import { v } from "convex/values";

import { query } from "../_generated/server";

export const getLiveGames = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db
      .query("tournaments")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!tournament) {
      return [];
    }

    const matches = await ctx.db
      .query("matches")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
      .collect();

    const liveOrInProgress = matches.filter((m) => m.status === "inProgress" || m.isLive === true);

    if (liveOrInProgress.length === 0) {
      return [];
    }

    const results = [];

    for (const match of liveOrInProgress) {
      const bracket = await ctx.db.get(match.bracketId);
      const category = bracket ? await ctx.db.get(bracket.categoryId) : null;

      const categoryType = category?.type ?? "singles";

      const participant1 = await resolveParticipant(ctx, match.participant1Id, categoryType);
      const participant2 = await resolveParticipant(ctx, match.participant2Id, categoryType);

      const allSets = await ctx.db
        .query("matchSets")
        .withIndex("by_match", (q) => q.eq("matchId", match._id))
        .order("asc")
        .collect();

      const currentSet = allSets.find((s) => s.status === "inProgress") ?? null;
      const completedSets = allSets.filter((s) => s.status === "completed");

      const team1SetWins = completedSets.filter((s) => s.winnerTeam === 1).length;
      const team2SetWins = completedSets.filter((s) => s.winnerTeam === 2).length;

      results.push({
        match,
        bracket,
        category,
        participant1,
        participant2,
        categoryType,
        currentSet,
        completedSets,
        team1SetWins,
        team2SetWins,
        numberOfSets: bracket?.numberOfSets ?? 3,
      });
    }

    return results;
  },
});

export const getRecentMatches = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db
      .query("tournaments")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!tournament) {
      return [];
    }

    const matches = await ctx.db
      .query("matches")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
      .order("desc")
      .collect();

    const recentMatches = matches
      .filter(
        (m) => m.status === "completed" || m.status === "inProgress" || m.status === "abandoned",
      )
      .slice(0, 20);

    if (recentMatches.length === 0) {
      return [];
    }

    const results = [];

    for (const match of recentMatches) {
      const bracket = await ctx.db.get(match.bracketId);
      const category = bracket ? await ctx.db.get(bracket.categoryId) : null;

      const categoryType = category?.type ?? "singles";

      const participant1 = await resolveParticipant(ctx, match.participant1Id, categoryType);
      const participant2 = await resolveParticipant(ctx, match.participant2Id, categoryType);

      const allSets = await ctx.db
        .query("matchSets")
        .withIndex("by_match", (q) => q.eq("matchId", match._id))
        .order("asc")
        .collect();

      const completedSets = allSets.filter((s) => s.status === "completed");

      const team1SetWins = completedSets.filter((s) => s.winnerTeam === 1).length;
      const team2SetWins = completedSets.filter((s) => s.winnerTeam === 2).length;

      results.push({
        match,
        bracket,
        category,
        participant1,
        participant2,
        categoryType,
        completedSets,
        team1SetWins,
        team2SetWins,
        numberOfSets: bracket?.numberOfSets ?? 3,
      });
    }

    return results;
  },
});

export const getMatchDetails = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;

    const bracket = await ctx.db.get(match.bracketId);
    const category = bracket ? await ctx.db.get(bracket.categoryId) : null;
    const tournament = await ctx.db.get(match.tournamentId);

    const categoryType = category?.type ?? "singles";

    const participant1 = await resolveParticipant(ctx, match.participant1Id, categoryType);
    const participant2 = await resolveParticipant(ctx, match.participant2Id, categoryType);

    const allSets = await ctx.db
      .query("matchSets")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .order("asc")
      .collect();

    const currentSet = allSets.find((s) => s.status === "inProgress") ?? null;
    const completedSets = allSets.filter((s) => s.status === "completed");

    const team1SetWins = completedSets.filter((s) => s.winnerTeam === 1).length;
    const team2SetWins = completedSets.filter((s) => s.winnerTeam === 2).length;

    return {
      match,
      bracket,
      category,
      tournament,
      participant1,
      participant2,
      categoryType,
      allSets,
      currentSet,
      completedSets,
      team1SetWins,
      team2SetWins,
      numberOfSets: bracket?.numberOfSets ?? 3,
      pointsPerGame: bracket?.pointsPerGame ?? 11,
      winByTwo: bracket?.winByTwo ?? true,
    };
  },
});

async function resolveParticipant(
  ctx: any,
  participantId: any,
  categoryType: "singles" | "doubles",
) {
  if (!participantId) return null;

  const doc = await ctx.db.get(participantId);
  if (!doc) return null;

  let cp: any = null;

  if ("categoryParticipantId" in doc) {
    cp = await ctx.db.get(doc.categoryParticipantId);
  } else {
    cp = doc;
  }

  if (!cp) return null;

  if (categoryType === "singles") {
    const player = cp.playerId ? await ctx.db.get(cp.playerId) : null;
    return { ...cp, player };
  }

  const pair = cp.pairId ? await ctx.db.get(cp.pairId) : null;
  let playerOne = null;
  let playerTwo = null;
  if (pair) {
    playerOne = await ctx.db.get(pair.playerOne);
    playerTwo = await ctx.db.get(pair.playerTwo);
  }
  return { ...cp, pair, playerOne, playerTwo };
}
