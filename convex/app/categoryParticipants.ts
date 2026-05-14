import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { authedQuery, authedMutation, requireManageTournament } from "./lib";

export const listByCategory = authedQuery({
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

export const register = authedMutation({
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

      const existing = await ctx.db
        .query("categoryParticipants")
        .withIndex("by_category_and_player", (q) =>
          q.eq("categoryId", args.categoryId).eq("playerId", args.playerId),
        )
        .unique();

      if (existing) {
        throw new Error("This player is already registered in this category");
      }

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
      if (!args.playerOneId || !args.playerTwoId) {
        throw new Error("Both player one and player two are required for doubles categories");
      }
      if (args.playerId) {
        throw new Error("Player ID should not be provided for doubles categories");
      }
      if (args.playerOneId === args.playerTwoId) {
        throw new Error("Player one and player two must be different people");
      }

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

      const existing = await ctx.db
        .query("categoryParticipants")
        .withIndex("by_category_and_pair", (q) =>
          q.eq("categoryId", args.categoryId).eq("pairId", pair._id),
        )
        .unique();

      if (existing) {
        throw new Error("This pair is already registered in this category");
      }

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

export const resyncRecords = authedMutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, category.tournamentId);

    const matches = await ctx.db
      .query("matches")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

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

    const participants = await ctx.db
      .query("categoryParticipants")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

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

export const unregister = authedMutation({
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
