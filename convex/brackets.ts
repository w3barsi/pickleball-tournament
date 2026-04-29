import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { query, mutation, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

// ─── Helpers ───────────────────────────────────────────────────────────────

async function getAuthUser(ctx: QueryCtx) {
  return await authComponent.safeGetAuthUser(ctx);
}

async function canManageTournament(ctx: QueryCtx, tournamentId: Id<"tournaments">) {
  const user = await getAuthUser(ctx);
  if (!user) return false;

  const tournament = await ctx.db.get(tournamentId);
  if (!tournament) return false;

  if (tournament.createdBy === user._id) return true;

  const manager = await ctx.db
    .query("tournamentManagers")
    .withIndex("by_tournament_user", (q) =>
      q.eq("tournamentId", tournamentId).eq("userId", user._id),
    )
    .unique();

  return manager !== null;
}

async function requireManageTournament(ctx: QueryCtx, tournamentId: Id<"tournaments">) {
  const canManage = await canManageTournament(ctx, tournamentId);
  if (!canManage) {
    throw new Error("You do not have permission to manage this tournament");
  }
}

async function getCategoryTournamentId(ctx: QueryCtx, categoryId: Id<"categories">) {
  const category = await ctx.db.get(categoryId);
  return category?.tournamentId ?? null;
}

// ─── Queries ───────────────────────────────────────────────────────────────

export const listByCategory = query({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const brackets = await ctx.db
      .query("brackets")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .order("asc")
      .collect();

    // Get participant counts for each bracket
    const results = [];
    for (const bracket of brackets) {
      const participantCount = await ctx.db
        .query("bracketParticipants")
        .withIndex("by_bracket", (q) => q.eq("bracketId", bracket._id))
        .take(1000)
        .then((bps) => bps.length);

      const matchCount = await ctx.db
        .query("matches")
        .withIndex("by_bracket", (q) => q.eq("bracketId", bracket._id))
        .take(1000)
        .then((ms) => ms.length);

      results.push({
        ...bracket,
        participantCount,
        matchCount,
      });
    }

    return results;
  },
});

export const get = query({
  args: {
    bracketId: v.id("brackets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bracketId);
  },
});

export const getWithParticipants = query({
  args: {
    bracketId: v.id("brackets"),
  },
  handler: async (ctx, args) => {
    const bracket = await ctx.db.get(args.bracketId);
    if (!bracket) {
      throw new Error("Bracket not found");
    }

    const category = await ctx.db.get(bracket.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const bracketParticipants = await ctx.db
      .query("bracketParticipants")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .order("asc")
      .collect();

    const participants = [];
    for (const bp of bracketParticipants) {
      const categoryParticipant = await ctx.db.get(bp.categoryParticipantId);
      if (!categoryParticipant) continue;

      if (category.type === "singles") {
        const player = categoryParticipant.playerId
          ? await ctx.db.get(categoryParticipant.playerId)
          : null;
        participants.push({
          ...bp,
          categoryParticipant: {
            ...categoryParticipant,
            player,
          },
        });
      } else {
        const pair = categoryParticipant.pairId
          ? await ctx.db.get(categoryParticipant.pairId)
          : null;
        let playerOne = null;
        let playerTwo = null;
        if (pair) {
          playerOne = await ctx.db.get(pair.playerOne);
          playerTwo = await ctx.db.get(pair.playerTwo);
        }
        participants.push({
          ...bp,
          categoryParticipant: {
            ...categoryParticipant,
            pair,
            playerOne,
            playerTwo,
          },
        });
      }
    }

    return {
      bracket,
      category,
      participants,
    };
  },
});

export const getUnassignedParticipants = query({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const allParticipants = await ctx.db
      .query("categoryParticipants")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .order("asc")
      .collect();

    const unassigned = [];
    for (const cp of allParticipants) {
      const inBracket = await ctx.db
        .query("bracketParticipants")
        .withIndex("by_category_participant", (q) => q.eq("categoryParticipantId", cp._id))
        .unique();

      if (!inBracket) {
        if (category.type === "singles") {
          const player = cp.playerId ? await ctx.db.get(cp.playerId) : null;
          unassigned.push({
            ...cp,
            player,
          });
        } else {
          const pair = cp.pairId ? await ctx.db.get(cp.pairId) : null;
          let playerOne = null;
          let playerTwo = null;
          if (pair) {
            playerOne = await ctx.db.get(pair.playerOne);
            playerTwo = await ctx.db.get(pair.playerTwo);
          }
          unassigned.push({
            ...cp,
            pair,
            playerOne,
            playerTwo,
          });
        }
      }
    }

    return unassigned;
  },
});

// ─── Mutations ─────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    stage: v.number(),
    format: v.union(v.literal("roundRobin"), v.literal("singleElimination")),
    maxParticipants: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tournamentId = await getCategoryTournamentId(ctx, args.categoryId);
    if (!tournamentId) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, tournamentId);

    const bracketId = await ctx.db.insert("brackets", {
      categoryId: args.categoryId,
      name: args.name,
      stage: args.stage,
      format: args.format,
      status: "upcoming",
      maxParticipants: args.maxParticipants,
    });

    return bracketId;
  },
});

export const update = mutation({
  args: {
    bracketId: v.id("brackets"),
    name: v.optional(v.string()),
    stage: v.optional(v.number()),
    format: v.optional(v.union(v.literal("roundRobin"), v.literal("singleElimination"))),
    status: v.optional(
      v.union(v.literal("upcoming"), v.literal("inProgress"), v.literal("completed")),
    ),
    maxParticipants: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const bracket = await ctx.db.get(args.bracketId);
    if (!bracket) {
      throw new Error("Bracket not found");
    }

    const tournamentId = await getCategoryTournamentId(ctx, bracket.categoryId);
    if (!tournamentId) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, tournamentId);

    const { bracketId, ...updates } = args;
    await ctx.db.patch(bracketId, updates);
    return { success: true };
  },
});

export const remove = mutation({
  args: {
    bracketId: v.id("brackets"),
  },
  handler: async (ctx, args) => {
    const bracket = await ctx.db.get(args.bracketId);
    if (!bracket) {
      throw new Error("Bracket not found");
    }

    const tournamentId = await getCategoryTournamentId(ctx, bracket.categoryId);
    if (!tournamentId) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, tournamentId);

    // Cascade delete: matches, matchSets, points, bracketParticipants
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .collect();

    for (const match of matches) {
      const matchSets = await ctx.db
        .query("matchSets")
        .withIndex("by_match", (q) => q.eq("matchId", match._id))
        .collect();

      for (const matchSet of matchSets) {
        const points = await ctx.db
          .query("pickleballPoints")
          .withIndex("by_match_set", (q) => q.eq("matchSetId", matchSet._id))
          .collect();

        for (const point of points) {
          await ctx.db.delete(point._id);
        }

        await ctx.db.delete(matchSet._id);
      }

      await ctx.db.delete(match._id);
    }

    const bracketParticipants = await ctx.db
      .query("bracketParticipants")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .collect();

    for (const bp of bracketParticipants) {
      await ctx.db.delete(bp._id);
    }

    await ctx.db.delete(args.bracketId);
    return { success: true };
  },
});

export const addParticipants = mutation({
  args: {
    bracketId: v.id("brackets"),
    categoryParticipantIds: v.array(v.id("categoryParticipants")),
  },
  handler: async (ctx, args) => {
    const bracket = await ctx.db.get(args.bracketId);
    if (!bracket) {
      throw new Error("Bracket not found");
    }

    const tournamentId = await getCategoryTournamentId(ctx, bracket.categoryId);
    if (!tournamentId) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, tournamentId);

    // Check max participants
    if (bracket.maxParticipants !== undefined) {
      const currentCount = await ctx.db
        .query("bracketParticipants")
        .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
        .take(bracket.maxParticipants + 1)
        .then((bps) => bps.length);

      if (currentCount + args.categoryParticipantIds.length > bracket.maxParticipants) {
        throw new Error("Cannot exceed bracket max participants");
      }
    }

    const inserted = [];
    for (const cpId of args.categoryParticipantIds) {
      // Check if already in this bracket
      const existing = await ctx.db
        .query("bracketParticipants")
        .withIndex("by_category_participant", (q) => q.eq("categoryParticipantId", cpId))
        .unique();

      if (existing) {
        // Skip if already in any bracket
        continue;
      }

      const id = await ctx.db.insert("bracketParticipants", {
        bracketId: args.bracketId,
        categoryParticipantId: cpId,
        status: "active",
      });
      inserted.push(id);
    }

    return { inserted: inserted.length };
  },
});

export const removeParticipant = mutation({
  args: {
    bracketParticipantId: v.id("bracketParticipants"),
  },
  handler: async (ctx, args) => {
    const bp = await ctx.db.get(args.bracketParticipantId);
    if (!bp) {
      throw new Error("Bracket participant not found");
    }

    const bracket = await ctx.db.get(bp.bracketId);
    if (!bracket) {
      throw new Error("Bracket not found");
    }

    const tournamentId = await getCategoryTournamentId(ctx, bracket.categoryId);
    if (!tournamentId) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, tournamentId);

    await ctx.db.delete(args.bracketParticipantId);
    return { success: true };
  },
});

export const autoAssignRemaining = mutation({
  args: {
    bracketId: v.id("brackets"),
  },
  handler: async (ctx, args) => {
    const bracket = await ctx.db.get(args.bracketId);
    if (!bracket) {
      throw new Error("Bracket not found");
    }

    const tournamentId = await getCategoryTournamentId(ctx, bracket.categoryId);
    if (!tournamentId) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, tournamentId);

    const allCategoryParticipants = await ctx.db
      .query("categoryParticipants")
      .withIndex("by_category", (q) => q.eq("categoryId", bracket.categoryId))
      .order("asc")
      .collect();

    const unassigned = [];
    for (const cp of allCategoryParticipants) {
      const inBracket = await ctx.db
        .query("bracketParticipants")
        .withIndex("by_category_participant", (q) => q.eq("categoryParticipantId", cp._id))
        .unique();

      if (!inBracket) {
        unassigned.push(cp._id);
      }
    }

    if (unassigned.length === 0) {
      return { inserted: 0 };
    }

    // Check max participants
    if (bracket.maxParticipants !== undefined) {
      const currentCount = await ctx.db
        .query("bracketParticipants")
        .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
        .take(bracket.maxParticipants + 1)
        .then((bps) => bps.length);

      const availableSlots = bracket.maxParticipants - currentCount;
      if (availableSlots <= 0) {
        throw new Error("Bracket is already full");
      }
      if (unassigned.length > availableSlots) {
        throw new Error(`Not enough slots. Only ${availableSlots} slots available.`);
      }
    }

    const inserted = [];
    for (const cpId of unassigned) {
      const id = await ctx.db.insert("bracketParticipants", {
        bracketId: args.bracketId,
        categoryParticipantId: cpId,
        status: "active",
      });
      inserted.push(id);
    }

    return { inserted: inserted.length };
  },
});
