import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import {
  authedQuery,
  authedMutation,
  requireManageTournament,
  getCategoryTournamentId,
} from "./lib";

export const listByCategory = authedQuery({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const brackets = await ctx.db
      .query("brackets")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .order("asc")
      .collect();

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

export const getWithParticipants = authedQuery({
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

    const tournament = category ? await ctx.db.get(category.tournamentId) : null;

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
      tournament,
      participants,
    };
  },
});

export const listByTournament = authedQuery({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    const results = [];
    for (const category of categories) {
      const brackets = await ctx.db
        .query("brackets")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .order("asc")
        .collect();

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
          category,
          participantCount,
          matchCount,
        });
      }
    }

    return results;
  },
});

export const create = authedMutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    label: v.optional(v.string()),
    stage: v.number(),
    format: v.union(v.literal("roundRobin"), v.literal("singleElimination")),
    maxParticipants: v.optional(v.number()),
    numberOfSets: v.optional(v.number()),
    pointsPerGame: v.optional(v.number()),
    winByTwo: v.optional(v.boolean()),
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
      label: args.label,
      stage: args.stage,
      format: args.format,
      status: "upcoming",
      maxParticipants: args.maxParticipants,
      numberOfSets: args.numberOfSets ?? 3,
      pointsPerGame: args.pointsPerGame ?? 11,
      winByTwo: args.winByTwo ?? true,
    });

    return bracketId;
  },
});

export const update = authedMutation({
  args: {
    bracketId: v.id("brackets"),
    name: v.optional(v.string()),
    label: v.optional(v.string()),
    stage: v.optional(v.number()),
    format: v.optional(v.union(v.literal("roundRobin"), v.literal("singleElimination"))),
    status: v.optional(
      v.union(v.literal("upcoming"), v.literal("inProgress"), v.literal("completed")),
    ),
    maxParticipants: v.optional(v.number()),
    numberOfSets: v.optional(v.number()),
    pointsPerGame: v.optional(v.number()),
    winByTwo: v.optional(v.boolean()),
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

export const remove = authedMutation({
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

export const addParticipants = authedMutation({
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

    const stageBracketIds = new Set(
      (
        await ctx.db
          .query("brackets")
          .withIndex("by_category_stage", (q) =>
            q.eq("categoryId", bracket.categoryId).eq("stage", bracket.stage),
          )
          .collect()
      ).map((b) => b._id),
    );

    const inserted = [];
    let seedCounter =
      (await ctx.db
        .query("bracketParticipants")
        .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
        .collect()
        .then((bps) => bps.length)) + 1;

    for (const cpId of args.categoryParticipantIds) {
      const existing = await ctx.db
        .query("bracketParticipants")
        .withIndex("by_category_participant", (q) => q.eq("categoryParticipantId", cpId))
        .collect()
        .then((bps) => bps.find((bp) => stageBracketIds.has(bp.bracketId)));

      if (existing) {
        continue;
      }

      const id = await ctx.db.insert("bracketParticipants", {
        bracketId: args.bracketId,
        categoryParticipantId: cpId,
        seed: seedCounter,
        status: "active",
      });
      inserted.push(id);
      seedCounter++;
    }

    return { inserted: inserted.length };
  },
});

export const listAssignmentsByStage = authedQuery({
  args: {
    categoryId: v.id("categories"),
    stage: v.number(),
  },
  handler: async (ctx, args) => {
    const brackets = await ctx.db
      .query("brackets")
      .withIndex("by_category_stage", (q) =>
        q.eq("categoryId", args.categoryId).eq("stage", args.stage),
      )
      .collect();

    const assignments = [];
    for (const bracket of brackets) {
      const bracketParticipants = await ctx.db
        .query("bracketParticipants")
        .withIndex("by_bracket", (q) => q.eq("bracketId", bracket._id))
        .collect();

      for (const bp of bracketParticipants) {
        assignments.push({
          _id: bp._id,
          bracketId: bracket._id,
          bracketName: bracket.name,
          categoryParticipantId: bp.categoryParticipantId,
          status: bp.status,
        });
      }
    }

    return assignments;
  },
});

export const removeParticipant = authedMutation({
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

export const updateParticipantStatus = authedMutation({
  args: {
    bracketParticipantId: v.id("bracketParticipants"),
    status: v.union(v.literal("active"), v.literal("eliminated"), v.literal("withdrawn")),
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

    await ctx.db.patch(args.bracketParticipantId, { status: args.status });

    // Sync status to the category participant
    await ctx.db.patch(bp.categoryParticipantId, { status: args.status });

    return { success: true };
  },
});
