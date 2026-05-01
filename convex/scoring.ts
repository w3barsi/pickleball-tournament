import { v } from "convex/values";

import { Doc, Id } from "./_generated/dataModel";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";

// ─── Types ─────────────────────────────────────────────────────────────────

type ServingTeam = 1 | 2;
type ServerNumber = 1 | 2;
type MatchStatus = "scheduled" | "inProgress" | "completed" | "abandoned";

interface SetState {
  team1Score: number;
  team2Score: number;
  servingTeam: ServingTeam;
  serverNumber: ServerNumber;
  isFirstServe: boolean;
  isGameOver: boolean;
  winner: 1 | 2 | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function computeSetState(
  points: Array<{ pointWinner: 1 | 2 }>,
  targetScore: number,
  winByTwo: boolean,
): SetState {
  let state: SetState = {
    team1Score: 0,
    team2Score: 0,
    servingTeam: 1,
    serverNumber: 2,
    isFirstServe: true,
    isGameOver: false,
    winner: null,
  };

  for (const point of points) {
    if (state.isGameOver) break;

    if (point.pointWinner === state.servingTeam) {
      if (state.servingTeam === 1) {
        state.team1Score += 1;
      } else {
        state.team2Score += 1;
      }

      // Check win condition
      const t1Wins =
        state.team1Score >= targetScore && (!winByTwo || state.team1Score >= state.team2Score + 2);
      const t2Wins =
        state.team2Score >= targetScore && (!winByTwo || state.team2Score >= state.team1Score + 2);

      if (t1Wins) {
        state.isGameOver = true;
        state.winner = 1;
      } else if (t2Wins) {
        state.isGameOver = true;
        state.winner = 2;
      }

      state.isFirstServe = false;
    } else {
      if (state.isFirstServe) {
        state.servingTeam = state.servingTeam === 1 ? 2 : 1;
        state.serverNumber = 2;
        state.isFirstServe = false;
      } else {
        if (state.serverNumber === 1) {
          state.serverNumber = 2;
        } else {
          state.servingTeam = state.servingTeam === 1 ? 2 : 1;
          state.serverNumber = 1;
        }
      }
    }
  }

  return state;
}

async function resolveParticipant(
  ctx: QueryCtx,
  participantId: Id<"categoryParticipants">,
  categoryType: "singles" | "doubles",
) {
  const cp = await ctx.db.get(participantId);
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

async function getCategoryType(ctx: QueryCtx, bracketId: Id<"brackets">) {
  const bracket = await ctx.db.get(bracketId);
  if (!bracket) return "singles" as const;
  const category = bracket.categoryId ? await ctx.db.get(bracket.categoryId) : null;
  return category?.type ?? "singles";
}

function setsNeededToWin(numberOfSets: number) {
  return Math.ceil(numberOfSets / 2);
}

async function updateParticipantRecords(
  ctx: MutationCtx,
  winnerId: Id<"categoryParticipants">,
  loserId: Id<"categoryParticipants">,
  delta: number,
) {
  const winner = await ctx.db.get(winnerId);
  const loser = await ctx.db.get(loserId);

  if (winner) {
    await ctx.db.patch(winnerId, {
      wins: Math.max(0, winner.wins + delta),
    });
  }
  if (loser) {
    await ctx.db.patch(loserId, {
      losses: Math.max(0, loser.losses + delta),
    });
  }
}

// ─── Queries ───────────────────────────────────────────────────────────────

export const listAllMatches = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").order("desc").take(100);
    const results = [];

    for (const match of matches) {
      const sets = await ctx.db
        .query("matchSets")
        .withIndex("by_match", (q) => q.eq("matchId", match._id))
        .order("desc")
        .collect();

      const currentSet = sets.find((s) => s.status === "inProgress") ?? sets[0];
      let currentScores = { team1Score: 0, team2Score: 0 };

      if (currentSet) {
        const points = await ctx.db
          .query("pickleballPoints")
          .withIndex("by_match_set", (q) => q.eq("matchSetId", currentSet._id))
          .collect();
        const state = computeSetState(points, currentSet.targetScore, match.winByTwo);
        currentScores = { team1Score: state.team1Score, team2Score: state.team2Score };
      }

      results.push({
        ...match,
        currentSetNumber: currentSet?.setNumber ?? 0,
        team1Score: currentScores.team1Score,
        team2Score: currentScores.team2Score,
      });
    }

    return results;
  },
});

export const getMatchForScorer = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;

    const categoryType = await getCategoryType(ctx, match.bracketId);

    const participant1 = await resolveParticipant(ctx, match.participant1Id, categoryType);
    const participant2 = await resolveParticipant(ctx, match.participant2Id, categoryType);

    const allSets = await ctx.db
      .query("matchSets")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .order("asc")
      .collect();

    let currentSet = allSets.find((s) => s.status === "inProgress");
    if (!currentSet && allSets.length > 0) {
      currentSet = allSets[allSets.length - 1];
    }

    let currentSetPoints: Doc<"pickleballPoints">[] = [];
    let computedState: SetState | null = null;

    if (currentSet) {
      currentSetPoints = await ctx.db
        .query("pickleballPoints")
        .withIndex("by_match_set", (q) => q.eq("matchSetId", currentSet!._id))
        .order("asc")
        .collect();

      computedState = computeSetState(currentSetPoints, currentSet.targetScore, match.winByTwo);
    }

    return {
      match,
      participant1,
      participant2,
      categoryType,
      allSets,
      currentSet,
      currentSetPoints,
      computedState,
    };
  },
});

export const getLiveMatch = query({
  args: {},
  handler: async (ctx) => {
    const match = await ctx.db
      .query("matches")
      .withIndex("by_is_live", (q) => q.eq("isLive", true))
      .first();

    if (!match) return null;

    const categoryType = await getCategoryType(ctx, match.bracketId);
    const participant1 = await resolveParticipant(ctx, match.participant1Id, categoryType);
    const participant2 = await resolveParticipant(ctx, match.participant2Id, categoryType);

    const sets = await ctx.db
      .query("matchSets")
      .withIndex("by_match", (q) => q.eq("matchId", match._id))
      .order("desc")
      .collect();

    const currentSet = sets.find((s) => s.status === "inProgress") ?? sets[0];
    let computedState: SetState | null = null;

    if (currentSet) {
      const points = await ctx.db
        .query("pickleballPoints")
        .withIndex("by_match_set", (q) => q.eq("matchSetId", currentSet._id))
        .collect();
      computedState = computeSetState(points, currentSet.targetScore, match.winByTwo);
    }

    return {
      ...match,
      currentSetNumber: currentSet?.setNumber ?? 0,
      team1Score: computedState?.team1Score ?? 0,
      team2Score: computedState?.team2Score ?? 0,
      servingTeam: computedState?.servingTeam ?? 1,
      serverNumber: computedState?.serverNumber ?? 2,
      isFirstServe: computedState?.isFirstServe ?? true,
      participant1Name: getParticipantDisplayName(participant1, categoryType),
      participant2Name: getParticipantDisplayName(participant2, categoryType),
    };
  },
});

// ─── Mutations ─────────────────────────────────────────────────────────────

export const startMatch = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "scheduled") {
      throw new Error("Match has already started");
    }

    const now = Date.now();

    await ctx.db.patch(args.matchId, {
      status: "inProgress",
      startedAt: now,
      lastUpdatedAt: now,
    });

    // Create the first set
    await ctx.db.insert("matchSets", {
      matchId: args.matchId,
      setNumber: 1,
      team1Score: 0,
      team2Score: 0,
      targetScore: match.pointsPerGame,
      status: "inProgress",
    });

    return { success: true };
  },
});

export const recordPoint = mutation({
  args: {
    matchId: v.id("matches"),
    pointWinner: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "inProgress") {
      throw new Error("Match is not in progress");
    }

    // Find the current in-progress set
    const sets = await ctx.db
      .query("matchSets")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .order("desc")
      .collect();

    let currentSet: Doc<"matchSets"> | null | undefined = sets.find(
      (s) => s.status === "inProgress",
    );
    if (!currentSet) {
      // If no in-progress set but match is in progress, create next set
      const completedSets = sets.filter((s) => s.status === "completed");
      const nextSetNumber = completedSets.length + 1;
      if (nextSetNumber > match.numberOfSets) {
        throw new Error("All sets have been played");
      }
      const newSetId = await ctx.db.insert("matchSets", {
        matchId: args.matchId,
        setNumber: nextSetNumber,
        team1Score: 0,
        team2Score: 0,
        targetScore: match.pointsPerGame,
        status: "inProgress",
      });
      currentSet = await ctx.db.get(newSetId);
      if (!currentSet) {
        throw new Error("Failed to create set");
      }
    }

    const now = Date.now();

    // Get existing points for this set
    const existingPoints = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_match_set", (q) => q.eq("matchSetId", currentSet._id))
      .collect();

    const sequenceNumber = existingPoints.length;

    // Compute current state before recording the point
    const beforeState = computeSetState(existingPoints, currentSet.targetScore, match.winByTwo);

    // Record the point (stores state BEFORE the point was scored)
    await ctx.db.insert("pickleballPoints", {
      matchSetId: currentSet._id,
      team1Score: beforeState.team1Score,
      team2Score: beforeState.team2Score,
      servingTeam: beforeState.servingTeam,
      serverNumber: beforeState.serverNumber,
      isFirstServe: beforeState.isFirstServe,
      pointWinner: args.pointWinner,
      sequenceNumber,
      timestamp: now,
    });

    // Compute next state
    const afterState = computeSetState(
      [...existingPoints, { pointWinner: args.pointWinner }],
      currentSet.targetScore,
      match.winByTwo,
    );

    // Update set scores
    await ctx.db.patch(currentSet._id, {
      team1Score: afterState.team1Score,
      team2Score: afterState.team2Score,
    });

    // If set is completed, mark it and check match completion
    if (afterState.isGameOver && afterState.winner) {
      await ctx.db.patch(currentSet._id, {
        status: "completed",
        winnerTeam: afterState.winner,
        completedAt: now,
      });

      // Count completed sets
      const allSets = await ctx.db
        .query("matchSets")
        .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
        .collect();

      const team1SetWins = allSets.filter((s) => s.winnerTeam === 1).length;
      const team2SetWins = allSets.filter((s) => s.winnerTeam === 2).length;
      const needed = setsNeededToWin(match.numberOfSets);

      if (team1SetWins >= needed || team2SetWins >= needed) {
        const matchWinner = team1SetWins >= needed ? 1 : 2;
        const winnerParticipantId = matchWinner === 1 ? match.participant1Id : match.participant2Id;
        const loserParticipantId = matchWinner === 1 ? match.participant2Id : match.participant1Id;

        await ctx.db.patch(args.matchId, {
          status: "completed",
          winnerParticipantId,
          completedAt: now,
          lastUpdatedAt: now,
        });

        await updateParticipantRecords(ctx, winnerParticipantId, loserParticipantId, 1);
      } else {
        // Create next set
        const nextSetNumber = allSets.length + 1;
        if (nextSetNumber <= match.numberOfSets) {
          await ctx.db.insert("matchSets", {
            matchId: args.matchId,
            setNumber: nextSetNumber,
            team1Score: 0,
            team2Score: 0,
            targetScore: match.pointsPerGame,
            status: "inProgress",
          });
        }
        await ctx.db.patch(args.matchId, {
          lastUpdatedAt: now,
        });
      }
    } else {
      await ctx.db.patch(args.matchId, {
        lastUpdatedAt: now,
      });
    }

    return { success: true };
  },
});

export const undoLastPoint = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Get all sets ordered by setNumber desc
    const sets = await ctx.db
      .query("matchSets")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .order("desc")
      .collect();

    if (sets.length === 0) {
      throw new Error("No sets to undo");
    }

    // Find the set with the most recent point
    let targetSet: Doc<"matchSets"> | null = null;
    let lastPoint: Doc<"pickleballPoints"> | null = null;

    for (const set of sets) {
      const point = await ctx.db
        .query("pickleballPoints")
        .withIndex("by_match_set_and_sequence", (q) => q.eq("matchSetId", set._id))
        .order("desc")
        .first();
      if (point) {
        targetSet = set;
        lastPoint = point;
        break;
      }
    }

    if (!lastPoint || !targetSet) {
      throw new Error("No points to undo");
    }

    const now = Date.now();

    // If match was completed, revert winner/loser records
    if (match.status === "completed" && match.winnerParticipantId) {
      const loserId =
        match.winnerParticipantId === match.participant1Id
          ? match.participant2Id
          : match.participant1Id;
      await updateParticipantRecords(ctx, match.winnerParticipantId, loserId, -1);
    }

    // Delete the last point
    await ctx.db.delete(lastPoint._id);

    // If the set was completed, delete any sets created after it and revert this set
    if (targetSet.status === "completed") {
      for (const set of sets) {
        if (set.setNumber > targetSet.setNumber) {
          // Delete points in that set first
          const points = await ctx.db
            .query("pickleballPoints")
            .withIndex("by_match_set", (q) => q.eq("matchSetId", set._id))
            .collect();
          for (const p of points) {
            await ctx.db.delete(p._id);
          }
          await ctx.db.delete(set._id);
        }
      }

      await ctx.db.patch(targetSet._id, {
        status: "inProgress",
        winnerTeam: undefined,
        completedAt: undefined,
      });
    }

    // Recompute state for targetSet
    const remainingPoints = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_match_set", (q) => q.eq("matchSetId", targetSet._id))
      .order("asc")
      .collect();

    const state = computeSetState(remainingPoints, targetSet.targetScore, match.winByTwo);

    await ctx.db.patch(targetSet._id, {
      team1Score: state.team1Score,
      team2Score: state.team2Score,
    });

    // Revert match status if it was completed
    if (match.status === "completed") {
      await ctx.db.patch(args.matchId, {
        status: "inProgress",
        winnerParticipantId: undefined,
        completedAt: undefined,
        lastUpdatedAt: now,
      });
    } else {
      await ctx.db.patch(args.matchId, {
        lastUpdatedAt: now,
      });
    }

    return { success: true };
  },
});

export const forfeitMatch = mutation({
  args: {
    matchId: v.id("matches"),
    forfeitedBy: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const winnerTeam = args.forfeitedBy === 1 ? 2 : 1;
    const winnerParticipantId = winnerTeam === 1 ? match.participant1Id : match.participant2Id;
    const loserParticipantId = winnerTeam === 1 ? match.participant2Id : match.participant1Id;

    await ctx.db.patch(args.matchId, {
      status: "abandoned",
      winnerParticipantId,
      forfeitedBy: args.forfeitedBy,
      isLive: false,
      completedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    });

    await updateParticipantRecords(ctx, winnerParticipantId, loserParticipantId, 1);

    return { success: true };
  },
});

export const setMatchLive = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Unset all other live matches
    const liveMatches = await ctx.db
      .query("matches")
      .withIndex("by_is_live", (q) => q.eq("isLive", true))
      .collect();

    for (const liveMatch of liveMatches) {
      if (liveMatch._id === args.matchId) continue;
      await ctx.db.patch(liveMatch._id, {
        isLive: false,
        lastUpdatedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.matchId, {
      isLive: true,
      lastUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ─── Display Helpers ───────────────────────────────────────────────────────

function getParticipantDisplayName(
  participant: {
    player?: { fullName: string } | null;
    pair?: { teamName?: string } | null;
    playerOne?: { fullName: string } | null;
    playerTwo?: { fullName: string } | null;
  } | null,
  categoryType: "singles" | "doubles",
) {
  if (!participant) return "TBD";
  if (categoryType === "singles") {
    return participant.player?.fullName ?? "Unknown";
  }
  if (participant.pair?.teamName) {
    return `${participant.pair.teamName} (${participant.playerOne?.fullName ?? "Unknown"} / ${participant.playerTwo?.fullName ?? "Unknown"})`;
  }
  return `${participant.playerOne?.fullName ?? "Unknown"} / ${participant.playerTwo?.fullName ?? "Unknown"}`;
}
