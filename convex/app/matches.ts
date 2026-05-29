import { v } from "convex/values";

import { Doc, Id } from "../_generated/dataModel";
import { query, QueryCtx } from "../_generated/server";
import {
  authedQuery,
  authedMutation,
  requireManageTournament,
  getCategoryTournamentId,
} from "./lib";

async function hydrateMatch(ctx: QueryCtx, match: Doc<"matches">) {
  const bracket = await ctx.db.get(match.bracketId);
  const category = bracket ? await ctx.db.get(bracket.categoryId) : null;

  const p1 = await ctx.db.get(match.participant1Id);
  const p2 = await ctx.db.get(match.participant2Id);

  let participant1 = null;
  let participant2 = null;

  if (p1 && category) {
    if (category.type === "singles") {
      const player = p1.playerId ? await ctx.db.get(p1.playerId) : null;
      participant1 = { ...p1, player };
    } else {
      const pair = p1.pairId ? await ctx.db.get(p1.pairId) : null;
      let playerOne = null;
      let playerTwo = null;
      if (pair) {
        playerOne = await ctx.db.get(pair.playerOne);
        playerTwo = await ctx.db.get(pair.playerTwo);
      }
      participant1 = { ...p1, pair, playerOne, playerTwo };
    }
  }

  if (p2 && category) {
    if (category.type === "singles") {
      const player = p2.playerId ? await ctx.db.get(p2.playerId) : null;
      participant2 = { ...p2, player };
    } else {
      const pair = p2.pairId ? await ctx.db.get(p2.pairId) : null;
      let playerOne = null;
      let playerTwo = null;
      if (pair) {
        playerOne = await ctx.db.get(pair.playerOne);
        playerTwo = await ctx.db.get(pair.playerTwo);
      }
      participant2 = { ...p2, pair, playerOne, playerTwo };
    }
  }

  const matchSets = await ctx.db
    .query("matchSets")
    .withIndex("by_match", (q) => q.eq("matchId", match._id))
    .order("asc")
    .collect();

  return {
    ...match,
    bracket,
    category,
    participant1,
    participant2,
    matchSets,
  };
}

export const listByBracket = authedQuery({
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

    const matches = await ctx.db
      .query("matches")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .order("asc")
      .collect();

    const results = [];
    for (const match of matches) {
      const p1 = await ctx.db.get(match.participant1Id);
      const p2 = await ctx.db.get(match.participant2Id);

      let participant1 = null;
      let participant2 = null;

      if (p1) {
        if (category.type === "singles") {
          const player = p1.playerId ? await ctx.db.get(p1.playerId) : null;
          participant1 = { ...p1, player };
        } else {
          const pair = p1.pairId ? await ctx.db.get(p1.pairId) : null;
          let playerOne = null;
          let playerTwo = null;
          if (pair) {
            playerOne = await ctx.db.get(pair.playerOne);
            playerTwo = await ctx.db.get(pair.playerTwo);
          }
          participant1 = { ...p1, pair, playerOne, playerTwo };
        }
      }

      if (p2) {
        if (category.type === "singles") {
          const player = p2.playerId ? await ctx.db.get(p2.playerId) : null;
          participant2 = { ...p2, player };
        } else {
          const pair = p2.pairId ? await ctx.db.get(p2.pairId) : null;
          let playerOne = null;
          let playerTwo = null;
          if (pair) {
            playerOne = await ctx.db.get(pair.playerOne);
            playerTwo = await ctx.db.get(pair.playerTwo);
          }
          participant2 = { ...p2, pair, playerOne, playerTwo };
        }
      }

      const matchSets = await ctx.db
        .query("matchSets")
        .withIndex("by_match", (q) => q.eq("matchId", match._id))
        .order("asc")
        .collect();

      results.push({
        ...match,
        participant1,
        participant2,
        matchSets,
      });
    }

    return results;
  },
});

export const get = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.matchId);
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

    const matches = await ctx.db
      .query("matches")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .order("desc")
      .collect();

    const results = [];
    for (const match of matches) {
      results.push(await hydrateMatch(ctx, match));
    }

    return results;
  },
});

export const listLiveMatchIdsByTournament = authedQuery({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const matches = await ctx.db
      .query("matches")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    return matches
      .filter((m) => m.isLive || m.status === "inProgress")
      .map((m) => ({ _id: m._id, isLive: m.isLive, status: m.status }));
  },
});

export const getLiveMatchDetails = authedQuery({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;
    if (!match.isLive && match.status !== "inProgress") return null;
    return await hydrateMatch(ctx, match);
  },
});

export const getWithDetails = authedQuery({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;

    const bracket = await ctx.db.get(match.bracketId);
    const category = bracket ? await ctx.db.get(bracket.categoryId) : null;
    const tournament = category ? await ctx.db.get(category.tournamentId) : null;

    const p1 = await ctx.db.get(match.participant1Id);
    const p2 = await ctx.db.get(match.participant2Id);

    let participant1 = null;
    let participant2 = null;

    if (p1 && category) {
      if (category.type === "singles") {
        const player = p1.playerId ? await ctx.db.get(p1.playerId) : null;
        participant1 = { ...p1, player };
      } else {
        const pair = p1.pairId ? await ctx.db.get(p1.pairId) : null;
        let playerOne = null;
        let playerTwo = null;
        if (pair) {
          playerOne = await ctx.db.get(pair.playerOne);
          playerTwo = await ctx.db.get(pair.playerTwo);
        }
        participant1 = { ...p1, pair, playerOne, playerTwo };
      }
    }

    if (p2 && category) {
      if (category.type === "singles") {
        const player = p2.playerId ? await ctx.db.get(p2.playerId) : null;
        participant2 = { ...p2, player };
      } else {
        const pair = p2.pairId ? await ctx.db.get(p2.pairId) : null;
        let playerOne = null;
        let playerTwo = null;
        if (pair) {
          playerOne = await ctx.db.get(pair.playerOne);
          playerTwo = await ctx.db.get(pair.playerTwo);
        }
        participant2 = { ...p2, pair, playerOne, playerTwo };
      }
    }

    const matchSets = await ctx.db
      .query("matchSets")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .order("asc")
      .collect();

    return {
      match,
      bracket,
      category,
      tournament,
      participant1,
      participant2,
      matchSets,
    };
  },
});

export const create = authedMutation({
  args: {
    bracketId: v.id("brackets"),
    participant1Id: v.id("categoryParticipants"),
    participant2Id: v.id("categoryParticipants"),
    courtNumber: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    refereeName: v.optional(v.string()),
    roundNumber: v.optional(v.number()),
    matchOrder: v.optional(v.number()),
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

    const bp1 = await ctx.db
      .query("bracketParticipants")
      .withIndex("by_category_participant", (q) =>
        q.eq("categoryParticipantId", args.participant1Id),
      )
      .unique();

    const bp2 = await ctx.db
      .query("bracketParticipants")
      .withIndex("by_category_participant", (q) =>
        q.eq("categoryParticipantId", args.participant2Id),
      )
      .unique();

    if (!bp1 || bp1.bracketId !== args.bracketId) {
      throw new Error("Participant 1 is not in this bracket");
    }
    if (!bp2 || bp2.bracketId !== args.bracketId) {
      throw new Error("Participant 2 is not in this bracket");
    }

    const matchId = await ctx.db.insert("matches", {
      tournamentId,
      bracketId: args.bracketId,
      categoryId: bracket.categoryId,
      participant1Id: args.participant1Id,
      participant2Id: args.participant2Id,
      status: "scheduled",
      courtNumber: args.courtNumber,
      scheduledAt: args.scheduledAt,
      refereeName: args.refereeName,
      roundNumber: args.roundNumber,
      matchOrder: args.matchOrder,
      lastUpdatedAt: Date.now(),
    });

    return matchId;
  },
});

export const update = authedMutation({
  args: {
    matchId: v.id("matches"),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("inProgress"),
        v.literal("completed"),
        v.literal("abandoned"),
      ),
    ),
    courtNumber: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    refereeName: v.optional(v.string()),
    matchNotes: v.optional(v.string()),
    roundNumber: v.optional(v.number()),
    matchOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireManageTournament(ctx, match.tournamentId);

    const { matchId, ...updates } = args;
    await ctx.db.patch(matchId, {
      ...updates,
      lastUpdatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const updateResult = authedMutation({
  args: {
    matchId: v.id("matches"),
    winnerParticipantId: v.id("categoryParticipants"),
    forfeitedBy: v.optional(v.union(v.literal(1), v.literal(2))),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireManageTournament(ctx, match.tournamentId);

    if (
      args.winnerParticipantId !== match.participant1Id &&
      args.winnerParticipantId !== match.participant2Id
    ) {
      throw new Error("Winner must be one of the match participants");
    }

    await ctx.db.patch(args.matchId, {
      winnerParticipantId: args.winnerParticipantId,
      status: "completed",
      completedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      forfeitedBy: args.forfeitedBy,
    });

    const loserId =
      args.winnerParticipantId === match.participant1Id
        ? match.participant2Id
        : match.participant1Id;

    const winner = await ctx.db.get(args.winnerParticipantId);
    const loser = await ctx.db.get(loserId);

    if (winner) {
      await ctx.db.patch(args.winnerParticipantId, {
        wins: winner.wins + 1,
      });
    }
    if (loser) {
      await ctx.db.patch(loserId, {
        losses: loser.losses + 1,
      });
    }

    return { success: true };
  },
});

export const reset = authedMutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireManageTournament(ctx, match.tournamentId);

    if (match.status === "completed" && match.winnerParticipantId) {
      const loserId =
        match.winnerParticipantId === match.participant1Id
          ? match.participant2Id
          : match.participant1Id;

      const winner = await ctx.db.get(match.winnerParticipantId);
      const loser = await ctx.db.get(loserId);

      if (winner && winner.wins > 0) {
        await ctx.db.patch(match.winnerParticipantId, {
          wins: winner.wins - 1,
        });
      }
      if (loser && loser.losses > 0) {
        await ctx.db.patch(loserId, {
          losses: loser.losses - 1,
        });
      }
    }

    const matchSets = await ctx.db
      .query("matchSets")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
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

    await ctx.db.patch(args.matchId, {
      status: "scheduled",
      winnerParticipantId: undefined,
      completedAt: undefined,
      startedAt: undefined,
      isLive: undefined,
      forfeitedBy: undefined,
      lastUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const remove = authedMutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireManageTournament(ctx, match.tournamentId);

    if (match.status === "completed" && match.winnerParticipantId) {
      const loserId =
        match.winnerParticipantId === match.participant1Id
          ? match.participant2Id
          : match.participant1Id;

      const winner = await ctx.db.get(match.winnerParticipantId);
      const loser = await ctx.db.get(loserId);

      if (winner && winner.wins > 0) {
        await ctx.db.patch(match.winnerParticipantId, {
          wins: winner.wins - 1,
        });
      }
      if (loser && loser.losses > 0) {
        await ctx.db.patch(loserId, {
          losses: loser.losses - 1,
        });
      }
    }

    const matchSets = await ctx.db
      .query("matchSets")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
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

    await ctx.db.delete(args.matchId);
    return { success: true };
  },
});
