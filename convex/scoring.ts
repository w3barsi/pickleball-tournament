import { v } from "convex/values";

import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";

// Types for internal use
type GameStatus = "in_progress" | "completed" | "abandoned";
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

// Helper to calculate next game state after a point
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
  status: GameStatus;
  winner: 1 | 2 | undefined;
} {
  let newState = {
    team1Score: current.team1Score,
    team2Score: current.team2Score,
    servingTeam: current.servingTeam,
    serverNumber: current.serverNumber,
    isFirstServe: current.isFirstServe,
    status: "in_progress" as GameStatus,
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

// List all games (paginated)
export const listAllGames = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db.query("pickleballGames").order("desc").take(100);

    return games;
  },
});

// Get a single game with its full history
export const getGameWithHistory = query({
  args: {
    gameId: v.id("pickleballGames"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get("pickleballGames", args.gameId);
    if (!game) return null;

    const points = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_game_and_sequence", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(100);

    return {
      game,
      points,
    };
  },
});

// Create a new game
export const createGame = mutation({
  args: {
    team1Name: v.optional(v.string()),
    team2Name: v.optional(v.string()),
    targetScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const gameId = await ctx.db.insert("pickleballGames", {
      ownerId: user._id,
      team1Name: args.team1Name ?? "Team 1",
      team2Name: args.team2Name ?? "Team 2",
      team1Score: 0,
      team2Score: 0,
      servingTeam: 1,
      serverNumber: 2, // Start as server 2 (first serve rule)
      isFirstServe: true,
      targetScore: args.targetScore ?? 11,
      status: "in_progress",
      isLive: false,
      startedAt: now,
      lastUpdatedAt: now,
    });

    return gameId;
  },
});

// Record a point
export const recordPoint = mutation({
  args: {
    gameId: v.id("pickleballGames"),
    pointWinner: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "in_progress") {
      throw new Error("Game is not in progress");
    }

    const now = Date.now();

    // Get current sequence number
    const existingPoints = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
    const sequenceNumber = existingPoints.length;

    // Record the point (state BEFORE the point was scored)
    await ctx.db.insert("pickleballPoints", {
      gameId: args.gameId,
      team1Score: game.team1Score,
      team2Score: game.team2Score,
      servingTeam: game.servingTeam,
      serverNumber: game.serverNumber,
      isFirstServe: game.isFirstServe,
      pointWinner: args.pointWinner,
      sequenceNumber,
      timestamp: now,
    });

    // Calculate next state
    const newState = calculateNextState(
      {
        team1Score: game.team1Score,
        team2Score: game.team2Score,
        servingTeam: game.servingTeam,
        serverNumber: game.serverNumber,
        isFirstServe: game.isFirstServe,
        targetScore: game.targetScore,
      },
      args.pointWinner,
    );

    // Update game
    await ctx.db.patch(args.gameId, {
      team1Score: newState.team1Score,
      team2Score: newState.team2Score,
      servingTeam: newState.servingTeam,
      serverNumber: newState.serverNumber,
      isFirstServe: newState.isFirstServe,
      status: newState.status,
      winner: newState.winner,
      completedAt: newState.status === "completed" ? now : undefined,
      lastUpdatedAt: now,
    });

    return newState;
  },
});

// Undo last point
export const undoLastPoint = mutation({
  args: {
    gameId: v.id("pickleballGames"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Get the last point
    const lastPoint = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_game_and_sequence", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .first();

    if (!lastPoint) {
      throw new Error("No points to undo");
    }

    // Delete the last point
    await ctx.db.delete(lastPoint._id);

    // Restore game state from the deleted point (which had the BEFORE state)
    const now = Date.now();
    await ctx.db.patch(args.gameId, {
      team1Score: lastPoint.team1Score,
      team2Score: lastPoint.team2Score,
      servingTeam: lastPoint.servingTeam,
      serverNumber: lastPoint.serverNumber,
      isFirstServe: lastPoint.isFirstServe,
      status: "in_progress",
      winner: undefined,
      completedAt: undefined,
      lastUpdatedAt: now,
    });

    return { success: true };
  },
});

// Update team names
export const updateTeamNames = mutation({
  args: {
    gameId: v.id("pickleballGames"),
    team1Name: v.optional(v.string()),
    team2Name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const updates: Partial<{
      team1Name: string;
      team2Name: string;
      lastUpdatedAt: number;
    }> = {
      lastUpdatedAt: Date.now(),
    };

    if (args.team1Name !== undefined) {
      updates.team1Name = args.team1Name;
    }
    if (args.team2Name !== undefined) {
      updates.team2Name = args.team2Name;
    }

    await ctx.db.patch(args.gameId, updates);
    return { success: true };
  },
});

// Abandon a game
export const abandonGame = mutation({
  args: {
    gameId: v.id("pickleballGames"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    await ctx.db.patch(args.gameId, {
      status: "abandoned",
      lastUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a completed game and all its points
export const deleteGame = mutation({
  args: {
    gameId: v.id("pickleballGames"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "completed") {
      throw new Error("Only completed games can be deleted");
    }

    // Delete all points for this game
    const points = await ctx.db
      .query("pickleballPoints")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .take(1000);

    for (const point of points) {
      await ctx.db.delete(point._id);
    }

    // Delete the game
    await ctx.db.delete(args.gameId);

    return { success: true };
  },
});

// Update target score
export const updateTargetScore = mutation({
  args: {
    gameId: v.id("pickleballGames"),
    targetScore: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "in_progress") {
      throw new Error("Cannot change target score after game is finished");
    }

    // Check if the new target score would immediately end the game
    const winner = checkWinCondition(game.team1Score, game.team2Score, args.targetScore);
    const now = Date.now();

    if (winner) {
      await ctx.db.patch(args.gameId, {
        targetScore: args.targetScore,
        status: "completed",
        winner,
        completedAt: now,
        lastUpdatedAt: now,
      });
    } else {
      await ctx.db.patch(args.gameId, {
        targetScore: args.targetScore,
        lastUpdatedAt: now,
      });
    }

    return { success: true };
  },
});

// Set a game as live (unset all other live games first)
export const setGameLive = mutation({
  args: {
    gameId: v.id("pickleballGames"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Get all currently live games and set them to not live
    const liveGames = await ctx.db
      .query("pickleballGames")
      .withIndex("by_is_live", (q) => q.eq("isLive", true))
      .collect();

    for (const liveGame of liveGames) {
      // Skip the current game - we'll set it to live at the end
      if (liveGame._id === args.gameId) continue;

      await ctx.db.patch(liveGame._id, {
        isLive: false,
        lastUpdatedAt: Date.now(),
      });
    }

    // Set the current game to live
    await ctx.db.patch(args.gameId, {
      isLive: true,
      lastUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get the currently live game (public, no auth required)
export const getLiveGame = query({
  args: {},
  handler: async (ctx) => {
    const liveGame = await ctx.db
      .query("pickleballGames")
      .withIndex("by_is_live", (q) => q.eq("isLive", true))
      .first();

    return liveGame;
  },
});
