import { v } from "convex/values";

import { query, mutation } from "./_generated/server";

// Types for internal use
type MatchStatus = "scheduled" | "inProgress" | "completed" | "abandoned";
type ServingTeam = 1 | 2;
type ServerNumber = 1 | 2;

// Helper to check win condition
function checkWinCondition(team1Score: number, team2Score: number, target: number): 1 | 2 | null {
  if (team1Score >= target && team1Score >= team2Score + 2) {
    return 1;
  }
  if (team2Score >= target && team2Score >= team1Score + 2) {
    return 2;
  }
  return null;
}

// Helper to calculate next match state after a point
function calculateNextState(
  current: {
    team1Score: number;
    team2Score: number;
    servingTeam: ServingTeam;
    serverNumber: ServerNumber;
    isFirstServe: boolean;
    targetScore: number;
  },
  pointWinner: ServingTeam,
): {
  team1Score: number;
  team2Score: number;
  servingTeam: ServingTeam;
  serverNumber: ServerNumber;
  isFirstServe: boolean;
  status: MatchStatus;
  winner: 1 | 2 | undefined;
} {
  let newState = {
    team1Score: current.team1Score,
    team2Score: current.team2Score,
    servingTeam: current.servingTeam,
    serverNumber: current.serverNumber,
    isFirstServe: current.isFirstServe,
    status: "inProgress" as MatchStatus,
    winner: undefined as 1 | 2 | undefined,
  };

  if (pointWinner === current.servingTeam) {
    // Serving team won - they score a point
    if (current.servingTeam === 1) {
      newState.team1Score += 1;
    } else {
      newState.team2Score += 1;
    }

    // Check for win
    const winner = checkWinCondition(newState.team1Score, newState.team2Score, current.targetScore);
    if (winner) {
      newState.status = "completed";
      newState.winner = winner;
    }

    // First serve is over after first point
    newState.isFirstServe = false;
  } else {
    // Receiving team won - sideout
    if (current.isFirstServe) {
      // First serve of game: switch to other team, reset to server 2
      newState.servingTeam = current.servingTeam === 1 ? 2 : 1;
      newState.serverNumber = 2;
      newState.isFirstServe = false;
    } else {
      // Normal play: check if we need to switch to partner or sideout
      if (current.serverNumber === 1) {
        // Server 1 faulted, move to server 2
        newState.serverNumber = 2;
      } else {
        // Server 2 faulted, sideout to other team
        newState.servingTeam = current.servingTeam === 1 ? 2 : 1;
        newState.serverNumber = 1;
      }
    }
  }

  return newState;
}

// List all matches (paginated)
export const listAllMatches = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").order("desc").take(100);
    return matches;
  },
});

// Get matches by bracket
export const getMatchesByBracket = query({
  args: {
    bracketId: v.id("brackets"),
  },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .order("desc")
      .take(100);
    return matches;
  },
});

// Get a single match with its full history
export const getMatchWithHistory = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;

    const points = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_match_and_sequence", (q) => q.eq("matchId", args.matchId))
      .order("desc")
      .take(100);

    return {
      match,
      points,
    };
  },
});

// Create a new match (requires bracketId)
export const createMatch = mutation({
  args: {
    bracketId: v.id("brackets"),
    participant1Id: v.id("categoryParticipants"),
    participant2Id: v.id("categoryParticipants"),
    numberOfSets: v.optional(v.number()),
    pointsPerGame: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get bracket to find category
    const bracket = await ctx.db.get(args.bracketId);
    if (!bracket) {
      throw new Error("Bracket not found");
    }

    const now = Date.now();
    const matchId = await ctx.db.insert("matches", {
      bracketId: args.bracketId,
      categoryId: bracket.categoryId,
      participant1Id: args.participant1Id,
      participant2Id: args.participant2Id,
      status: "scheduled",
      isLive: false,
      startedAt: now,
      lastUpdatedAt: now,
      numberOfSets: args.numberOfSets ?? 3,
      pointsPerGame: args.pointsPerGame ?? 11,
    });

    return matchId;
  },
});

// Start a match (change status from scheduled to inProgress)
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

    await ctx.db.patch(args.matchId, {
      status: "inProgress",
      lastUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Record a point
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

    const now = Date.now();

    // Get current sequence number
    const existingPoints = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();
    const sequenceNumber = existingPoints.length;

    // Record the point (state BEFORE the point was scored)
    await ctx.db.insert("pickleballPoints", {
      matchId: args.matchId,
      team1Score: match.team1Score,
      team2Score: match.team2Score,
      servingTeam: match.servingTeam,
      serverNumber: match.serverNumber,
      isFirstServe: match.isFirstServe,
      pointWinner: args.pointWinner,
      sequenceNumber,
      timestamp: now,
    });

    // Calculate next state
    const newState = calculateNextState(
      {
        team1Score: match.team1Score,
        team2Score: match.team2Score,
        servingTeam: match.servingTeam,
        serverNumber: match.serverNumber,
        isFirstServe: match.isFirstServe,
        targetScore: match.targetScore,
      },
      args.pointWinner,
    );

    // Determine winner participant ID
    let winnerParticipantId = undefined;
    if (newState.winner === 1) {
      winnerParticipantId = match.participant1Id;
    } else if (newState.winner === 2) {
      winnerParticipantId = match.participant2Id;
    }

    // Update match
    await ctx.db.patch(args.matchId, {
      team1Score: newState.team1Score,
      team2Score: newState.team2Score,
      servingTeam: newState.servingTeam,
      serverNumber: newState.serverNumber,
      isFirstServe: newState.isFirstServe,
      status: newState.status,
      winnerParticipantId,
      completedAt: newState.status === "completed" ? now : undefined,
      lastUpdatedAt: now,
    });

    // If match completed, update participant win/loss records
    if (newState.status === "completed" && winnerParticipantId) {
      const loserParticipantId =
        newState.winner === 1 ? match.participant2Id : match.participant1Id;

      // Update winner's record
      const winner = await ctx.db.get(winnerParticipantId);
      if (winner) {
        await ctx.db.patch(winnerParticipantId, {
          wins: winner.wins + 1,
        });
      }

      // Update loser's record
      const loser = await ctx.db.get(loserParticipantId);
      if (loser) {
        await ctx.db.patch(loserParticipantId, {
          losses: loser.losses + 1,
        });
      }
    }

    return newState;
  },
});

// Undo last point
export const undoLastPoint = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Get the last point
    const lastPoint = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_match_and_sequence", (q) => q.eq("matchId", args.matchId))
      .order("desc")
      .first();

    if (!lastPoint) {
      throw new Error("No points to undo");
    }

    // If match was completed, we need to revert win/loss records
    if (match.status === "completed" && match.winnerParticipantId) {
      const loserParticipantId =
        match.winnerParticipantId === match.participant1Id
          ? match.participant2Id
          : match.participant1Id;

      const winner = await ctx.db.get(match.winnerParticipantId);
      if (winner && winner.wins > 0) {
        await ctx.db.patch(match.winnerParticipantId, {
          wins: winner.wins - 1,
        });
      }

      const loser = await ctx.db.get(loserParticipantId);
      if (loser && loser.losses > 0) {
        await ctx.db.patch(loserParticipantId, {
          losses: loser.losses - 1,
        });
      }
    }

    // Delete the last point
    await ctx.db.delete(lastPoint._id);

    // Restore match state from the deleted point (which had the BEFORE state)
    const now = Date.now();
    await ctx.db.patch(args.matchId, {
      team1Score: lastPoint.team1Score,
      team2Score: lastPoint.team2Score,
      servingTeam: lastPoint.servingTeam,
      serverNumber: lastPoint.serverNumber,
      isFirstServe: lastPoint.isFirstServe,
      status: "inProgress",
      winnerParticipantId: undefined,
      completedAt: undefined,
      lastUpdatedAt: now,
    });

    return { success: true };
  },
});

// Abandon a match
export const abandonMatch = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await ctx.db.patch(args.matchId, {
      status: "abandoned",
      isLive: false,
      lastUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a completed match and all its points
export const deleteMatch = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Delete all points for this match
    const points = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .take(1000);

    for (const point of points) {
      await ctx.db.delete(point._id);
    }

    // Delete the match
    await ctx.db.delete(args.matchId);

    return { success: true };
  },
});

// Update target score
export const updateTargetScore = mutation({
  args: {
    matchId: v.id("matches"),
    targetScore: v.number(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status === "completed" || match.status === "abandoned") {
      throw new Error("Cannot change target score after match is finished");
    }

    // Check if the new target score would immediately end the match
    const winner = checkWinCondition(match.team1Score, match.team2Score, args.targetScore);
    const now = Date.now();

    let winnerParticipantId = undefined;
    if (winner === 1) {
      winnerParticipantId = match.participant1Id;
    } else if (winner === 2) {
      winnerParticipantId = match.participant2Id;
    }

    if (winner && winnerParticipantId) {
      // Update winner and loser records
      const loserParticipantId = winner === 1 ? match.participant2Id : match.participant1Id;

      const winnerParticipant = await ctx.db.get(winnerParticipantId);
      if (winnerParticipant) {
        await ctx.db.patch(winnerParticipantId, {
          wins: winnerParticipant.wins + 1,
        });
      }

      const loserParticipant = await ctx.db.get(loserParticipantId);
      if (loserParticipant) {
        await ctx.db.patch(loserParticipantId, {
          losses: loserParticipant.losses + 1,
        });
      }

      await ctx.db.patch(args.matchId, {
        targetScore: args.targetScore,
        status: "completed",
        winnerParticipantId,
        completedAt: now,
        lastUpdatedAt: now,
      });
    } else {
      await ctx.db.patch(args.matchId, {
        targetScore: args.targetScore,
        lastUpdatedAt: now,
      });
    }

    return { success: true };
  },
});

// Set a match as live (unset all other live matches first)
export const setMatchLive = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Get all currently live matches and set them to not live
    const liveMatches = await ctx.db
      .query("matches")
      .withIndex("by_is_live", (q) => q.eq("isLive", true))
      .collect();

    for (const liveMatch of liveMatches) {
      // Skip the current match - we'll set it to live at the end
      if (liveMatch._id === args.matchId) continue;

      await ctx.db.patch(liveMatch._id, {
        isLive: false,
        lastUpdatedAt: Date.now(),
      });
    }

    // Set the current match to live
    await ctx.db.patch(args.matchId, {
      isLive: true,
      lastUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get the currently live match (public, no auth required)
export const getLiveMatch = query({
  args: {},
  handler: async (ctx) => {
    const liveMatch = await ctx.db
      .query("matches")
      .withIndex("by_is_live", (q) => q.eq("isLive", true))
      .first();

    return liveMatch;
  },
});
