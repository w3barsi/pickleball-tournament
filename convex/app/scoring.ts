import { v } from "convex/values";

import { Doc, Id } from "../_generated/dataModel";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { authedQuery, authedMutation, requireManageTournament } from "./lib";

type ServingTeam = 1 | 2;
type ServerNumber = 1 | 2;

interface SetState {
  team1Score: number;
  team2Score: number;
  servingTeam: ServingTeam;
  serverNumber: ServerNumber;
  isFirstServe: boolean;
  isGameOver: boolean;
  winner: 1 | 2 | null;
}

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

export const getMatchForScorer = authedQuery({
  args: {
    matchId: v.id("matches"),
    viewSetNumber: v.optional(v.number()),
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

    let viewedSet = currentSet;
    if (args.viewSetNumber !== undefined) {
      viewedSet = allSets.find((s) => s.setNumber === args.viewSetNumber) ?? currentSet;
    }

    let currentSetPoints: Doc<"pickleballPoints">[] = [];
    let computedState: SetState | null = null;

    if (viewedSet) {
      currentSetPoints = await ctx.db
        .query("pickleballPoints")
        .withIndex("by_match_set", (q) => q.eq("matchSetId", viewedSet!._id))
        .order("asc")
        .collect();

      computedState = computeSetState(currentSetPoints, viewedSet.targetScore, match.winByTwo);
    }

    return {
      match,
      participant1,
      participant2,
      categoryType,
      allSets,
      currentSet: viewedSet,
      currentSetPoints,
      computedState,
      activeSet: currentSet,
    };
  },
});

export const startMatch = authedMutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireManageTournament(ctx, match.tournamentId);

    if (match.status !== "scheduled") {
      throw new Error("Match has already started");
    }

    const now = Date.now();

    await ctx.db.patch(args.matchId, {
      status: "inProgress",
      startedAt: now,
      lastUpdatedAt: now,
    });

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

export const recordPoint = authedMutation({
  args: {
    matchId: v.id("matches"),
    pointWinner: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireManageTournament(ctx, match.tournamentId);

    if (match.status !== "inProgress") {
      throw new Error("Match is not in progress");
    }

    const sets = await ctx.db
      .query("matchSets")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .order("desc")
      .collect();

    let currentSet: Doc<"matchSets"> | null | undefined = sets.find(
      (s) => s.status === "inProgress",
    );
    if (!currentSet) {
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

    const existingPoints = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_match_set", (q) => q.eq("matchSetId", currentSet._id))
      .collect();

    const sequenceNumber = existingPoints.length;

    const beforeState = computeSetState(existingPoints, currentSet.targetScore, match.winByTwo);

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

    const afterState = computeSetState(
      [...existingPoints, { pointWinner: args.pointWinner }],
      currentSet.targetScore,
      match.winByTwo,
    );

    await ctx.db.patch(currentSet._id, {
      team1Score: afterState.team1Score,
      team2Score: afterState.team2Score,
    });

    await ctx.db.patch(args.matchId, {
      lastUpdatedAt: now,
    });

    return { success: true };
  },
});

export const confirmSetComplete = authedMutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireManageTournament(ctx, match.tournamentId);

    if (match.status !== "inProgress") {
      throw new Error("Match is not in progress");
    }

    const sets = await ctx.db
      .query("matchSets")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .order("asc")
      .collect();

    const currentSet = sets.find((s) => s.status === "inProgress");
    if (!currentSet) {
      throw new Error("No set in progress");
    }

    const points = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_match_set", (q) => q.eq("matchSetId", currentSet._id))
      .collect();

    const state = computeSetState(points, currentSet.targetScore, match.winByTwo);

    if (!state.isGameOver || !state.winner) {
      throw new Error("Set is not over yet");
    }

    const now = Date.now();

    await ctx.db.patch(currentSet._id, {
      status: "completed",
      winnerTeam: state.winner,
      completedAt: now,
    });

    const team1SetWins =
      sets.filter((s) => s.winnerTeam === 1).length + (state.winner === 1 ? 1 : 0);
    const team2SetWins =
      sets.filter((s) => s.winnerTeam === 2).length + (state.winner === 2 ? 1 : 0);
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
      const nextSetNumber = sets.length + 1;
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

    return { success: true };
  },
});

export const undoLastPoint = authedMutation({
  args: {
    matchId: v.id("matches"),
    setId: v.optional(v.id("matchSets")),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireManageTournament(ctx, match.tournamentId);

    let targetSet: Doc<"matchSets"> | null = null;
    let lastPoint: Doc<"pickleballPoints"> | null = null;

    if (args.setId) {
      targetSet = await ctx.db.get(args.setId);
      if (!targetSet || targetSet.matchId !== args.matchId) {
        throw new Error("Set not found");
      }
      lastPoint = await ctx.db
        .query("pickleballPoints")
        .withIndex("by_match_set_and_sequence", (q) => q.eq("matchSetId", targetSet!._id))
        .order("desc")
        .first();
    } else {
      const sets = await ctx.db
        .query("matchSets")
        .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
        .order("desc")
        .collect();

      if (sets.length === 0) {
        throw new Error("No sets to undo");
      }

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
    }

    if (!lastPoint || !targetSet) {
      throw new Error("No points to undo");
    }

    const now = Date.now();

    if (match.status === "completed" && match.winnerParticipantId) {
      const loserId =
        match.winnerParticipantId === match.participant1Id
          ? match.participant2Id
          : match.participant1Id;
      await updateParticipantRecords(ctx, match.winnerParticipantId, loserId, -1);
    }

    if (targetSet.status === "completed") {
      const allSets = await ctx.db
        .query("matchSets")
        .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
        .order("desc")
        .collect();

      for (const set of allSets) {
        if (set.setNumber > targetSet.setNumber) {
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

      let remainingPoints = await ctx.db
        .query("pickleballPoints")
        .withIndex("by_match_set", (q) => q.eq("matchSetId", targetSet._id))
        .order("asc")
        .collect();

      let state = computeSetState(remainingPoints, targetSet.targetScore, match.winByTwo);
      while (state.isGameOver && remainingPoints.length > 0) {
        const pointToDelete = remainingPoints[remainingPoints.length - 1];
        await ctx.db.delete(pointToDelete._id);
        remainingPoints = remainingPoints.slice(0, -1);
        state = computeSetState(remainingPoints, targetSet.targetScore, match.winByTwo);
      }

      await ctx.db.patch(targetSet._id, {
        team1Score: state.team1Score,
        team2Score: state.team2Score,
      });
    } else {
      await ctx.db.delete(lastPoint._id);

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
    }

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

export const forfeitMatch = authedMutation({
  args: {
    matchId: v.id("matches"),
    forfeitedBy: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireManageTournament(ctx, match.tournamentId);

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

export const setMatchLive = authedMutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireManageTournament(ctx, match.tournamentId);

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
