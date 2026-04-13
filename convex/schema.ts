import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  player: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    nickname: v.string(),
  }),
  playerPair: defineTable({
    teamName: v.string(),
    playerOne: v.id("player"),
    playerTwo: v.id("player"),
    wins: v.number(),
    losses: v.number(),
  }),

  // Pickleball games - current state stored here
  pickleballGames: defineTable({
    // Ownership
    ownerId: v.string(), // user's _id from better-auth

    // Team names
    team1Name: v.string(),
    team2Name: v.string(),

    // Current game state
    team1Score: v.number(),
    team2Score: v.number(),
    servingTeam: v.union(v.literal(1), v.literal(2)),
    serverNumber: v.union(v.literal(1), v.literal(2)),
    isFirstServe: v.boolean(),

    // Game configuration
    targetScore: v.number(),

    // Game status
    status: v.union(
      v.literal("upcoming"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("abandoned"),
    ),
    winner: v.optional(v.union(v.literal(1), v.literal(2))),

    // Live status for display
    isLive: v.optional(v.boolean()),

    // Timestamps
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    lastUpdatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_owner_and_status", ["ownerId", "status"])
    .index("by_is_live", ["isLive"]),

  // Individual points - unbounded per game, stored separately
  pickleballPoints: defineTable({
    gameId: v.id("pickleballGames"),

    // State BEFORE this point was scored
    team1Score: v.number(),
    team2Score: v.number(),
    servingTeam: v.union(v.literal(1), v.literal(2)),
    serverNumber: v.union(v.literal(1), v.literal(2)),
    isFirstServe: v.boolean(),

    // What happened
    pointWinner: v.union(v.literal(1), v.literal(2)),
    sequenceNumber: v.number(),
    timestamp: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_and_sequence", ["gameId", "sequenceNumber"]),
});
