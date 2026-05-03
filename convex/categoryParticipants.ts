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

// ─── Queries ───────────────────────────────────────────────────────────────

export const listByCategory = query({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const participants = await ctx.db
      .query("categoryParticipants")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .order("asc")
      .take(100);

    if (category.type === "singles") {
      const results = [];
      for (const p of participants) {
        const player = p.playerId ? await ctx.db.get(p.playerId) : null;
        results.push({
          ...p,
          player,
        });
      }
      return results;
    } else {
      const results = [];
      for (const p of participants) {
        const pair = p.pairId ? await ctx.db.get(p.pairId) : null;
        let playerOne = null;
        let playerTwo = null;
        if (pair) {
          playerOne = await ctx.db.get(pair.playerOne);
          playerTwo = await ctx.db.get(pair.playerTwo);
        }
        results.push({
          ...p,
          pair,
          playerOne,
          playerTwo,
        });
      }
      return results;
    }
  },
});

export const listByTournament = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Get all categories for this tournament
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    const results = [];
    for (const category of categories) {
      const participants = await ctx.db
        .query("categoryParticipants")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .order("asc")
        .take(100);

      if (category.type === "singles") {
        const categoryParticipants = [];
        for (const p of participants) {
          const player = p.playerId ? await ctx.db.get(p.playerId) : null;
          categoryParticipants.push({
            ...p,
            player,
          });
        }
        results.push({
          category,
          participants: categoryParticipants,
        });
      } else {
        const categoryParticipants = [];
        for (const p of participants) {
          const pair = p.pairId ? await ctx.db.get(p.pairId) : null;
          let playerOne = null;
          let playerTwo = null;
          if (pair) {
            playerOne = await ctx.db.get(pair.playerOne);
            playerTwo = await ctx.db.get(pair.playerTwo);
          }
          categoryParticipants.push({
            ...p,
            pair,
            playerOne,
            playerTwo,
          });
        }
        results.push({
          category,
          participants: categoryParticipants,
        });
      }
    }

    return results;
  },
});

// ─── Mutations ─────────────────────────────────────────────────────────────

export const register = mutation({
  args: {
    categoryId: v.id("categories"),
    playerId: v.optional(v.id("player")),
    playerOneId: v.optional(v.id("player")),
    playerTwoId: v.optional(v.id("player")),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, category.tournamentId);

    if (category.type === "singles") {
      if (!args.playerId) {
        throw new Error("Player ID is required for singles categories");
      }
      if (args.playerOneId || args.playerTwoId) {
        throw new Error("Player one and player two should not be provided for singles categories");
      }

      // Check for duplicate
      const existing = await ctx.db
        .query("categoryParticipants")
        .withIndex("by_category_and_player", (q) =>
          q.eq("categoryId", args.categoryId).eq("playerId", args.playerId),
        )
        .unique();

      if (existing) {
        throw new Error("This player is already registered in this category");
      }

      // Check max participants
      if (category.maxParticipants !== undefined) {
        const count = await ctx.db
          .query("categoryParticipants")
          .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
          .take(category.maxParticipants + 1);
        if (count.length >= category.maxParticipants) {
          throw new Error("This category is already full");
        }
      }

      const participantId = await ctx.db.insert("categoryParticipants", {
        categoryId: args.categoryId,
        playerId: args.playerId,
        status: "active",
        registrationStatus: "confirmed",
        wins: 0,
        losses: 0,
      });

      return participantId;
    } else {
      // Doubles
      if (!args.playerOneId || !args.playerTwoId) {
        throw new Error("Both player one and player two are required for doubles categories");
      }
      if (args.playerId) {
        throw new Error("Player ID should not be provided for doubles categories");
      }
      if (args.playerOneId === args.playerTwoId) {
        throw new Error("Player one and player two must be different people");
      }

      // Find or create player pair
      const ids = [args.playerOneId, args.playerTwoId].sort();
      const pairKey = `${ids[0]}:${ids[1]}`;

      let pair = await ctx.db
        .query("playerPair")
        .withIndex("by_pair_key", (q) => q.eq("pairKey", pairKey))
        .unique();

      if (!pair) {
        const pairId = await ctx.db.insert("playerPair", {
          playerOne: ids[0],
          playerTwo: ids[1],
          pairKey,
          wins: 0,
          losses: 0,
        });
        pair = await ctx.db.get(pairId);
        if (!pair) {
          throw new Error("Failed to create player pair");
        }
      }

      // Check for duplicate
      const existing = await ctx.db
        .query("categoryParticipants")
        .withIndex("by_category_and_pair", (q) =>
          q.eq("categoryId", args.categoryId).eq("pairId", pair._id),
        )
        .unique();

      if (existing) {
        throw new Error("This pair is already registered in this category");
      }

      // Check max participants
      if (category.maxParticipants !== undefined) {
        const count = await ctx.db
          .query("categoryParticipants")
          .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
          .take(category.maxParticipants + 1);
        if (count.length >= category.maxParticipants) {
          throw new Error("This category is already full");
        }
      }

      const participantId = await ctx.db.insert("categoryParticipants", {
        categoryId: args.categoryId,
        pairId: pair._id,
        status: "active",
        registrationStatus: "confirmed",
        wins: 0,
        losses: 0,
      });

      return participantId;
    }
  },
});

export const resyncRecords = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, category.tournamentId);

    // Fetch all completed matches with a winner for this category
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    // Count wins and losses per participant
    const winCounts: Record<string, number> = {};
    const lossCounts: Record<string, number> = {};

    for (const match of matches) {
      if (!match.winnerParticipantId) continue;

      const loserId =
        match.winnerParticipantId === match.participant1Id
          ? match.participant2Id
          : match.participant1Id;

      winCounts[match.winnerParticipantId] = (winCounts[match.winnerParticipantId] ?? 0) + 1;
      lossCounts[loserId] = (lossCounts[loserId] ?? 0) + 1;
    }

    // Fetch all participants in this category
    const participants = await ctx.db
      .query("categoryParticipants")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    // Update each participant's wins and losses
    for (const participant of participants) {
      const wins = winCounts[participant._id] ?? 0;
      const losses = lossCounts[participant._id] ?? 0;

      if (participant.wins !== wins || participant.losses !== losses) {
        await ctx.db.patch(participant._id, { wins, losses });
      }
    }

    return { success: true };
  },
});

export const unregister = mutation({
  args: {
    categoryParticipantId: v.id("categoryParticipants"),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.categoryParticipantId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    const category = await ctx.db.get(participant.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, category.tournamentId);

    // Cascade delete: remove from all brackets
    const bracketParticipants = await ctx.db
      .query("bracketParticipants")
      .withIndex("by_category_participant", (q) =>
        q.eq("categoryParticipantId", args.categoryParticipantId),
      )
      .take(100);

    for (const bp of bracketParticipants) {
      await ctx.db.delete(bp._id);
    }

    await ctx.db.delete(args.categoryParticipantId);
    return { success: true };
  },
});
