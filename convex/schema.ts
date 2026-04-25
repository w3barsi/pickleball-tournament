import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { tables as authTables } from "./betterAuth/schema";

export default defineSchema({
  // ========== PLAYERS & PAIRS ==========
  player: defineTable({
    fullName: v.string(),
    nickname: v.string(),
    photoUrl: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
  }).index("by_deletedAt", ["deletedAt"]),

  playerPair: defineTable({
    teamName: v.optional(v.string()),
    playerOne: v.id("player"),
    playerTwo: v.id("player"),
    pairKey: v.string(), // Sorted player IDs, e.g., "playerA:playerB" where A < B
    wins: v.number(),
    losses: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_pair_key", ["pairKey"])
    .index("by_deletedAt", ["deletedAt"]),

  // ========== TOURNAMENT STRUCTURE ==========
  tournaments: defineTable({
    name: v.string(),
    slug: v.string(),
    date: v.number(),
    description: v.optional(v.string()),
    organizerName: v.string(),
    status: v.union(v.literal("upcoming"), v.literal("inProgress"), v.literal("completed")),
    createdAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_createdBy", ["createdBy"])
    .index("by_deletedAt", ["deletedAt"]),

  tournamentManagers: defineTable({
    tournamentId: v.id("tournaments"),
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("manager")),
    invitedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_tournament", ["tournamentId"])
    .index("by_user", ["userId"])
    .index("by_tournament_user", ["tournamentId", "userId"])
    .index("by_deletedAt", ["deletedAt"]),

  categories: defineTable({
    tournamentId: v.id("tournaments"),
    name: v.string(),
    type: v.union(v.literal("singles"), v.literal("doubles")),
    format: v.union(v.literal("roundRobin"), v.literal("singleElimination")),
    rating: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    category: v.union(
      v.literal("womens"),
      v.literal("mens"),
      v.literal("mixed"),
      v.literal("open"),
    ),
    maxParticipants: v.optional(v.number()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_tournament", ["tournamentId"])
    .index("by_deletedAt", ["deletedAt"]),

  // Players/Pairs register HERE at the category level
  categoryParticipants: defineTable({
    categoryId: v.id("categories"),
    playerId: v.optional(v.id("player")),
    pairId: v.optional(v.id("playerPair")),
    status: v.union(v.literal("active"), v.literal("eliminated"), v.literal("withdrawn")),
    wins: v.number(),
    losses: v.number(),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_category", ["categoryId"])
    .index("by_player", ["playerId"])
    .index("by_pair", ["pairId"])
    .index("by_deletedAt", ["deletedAt"]),

  // Brackets = group stages within a category
  brackets: defineTable({
    categoryId: v.id("categories"),
    name: v.string(),
    stage: v.number(),
    status: v.union(v.literal("upcoming"), v.literal("inProgress"), v.literal("completed")),
    maxParticipants: v.optional(v.number()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_category", ["categoryId"])
    .index("by_category_stage", ["categoryId", "stage"])
    .index("by_deletedAt", ["deletedAt"]),

  // Who advances to which bracket
  bracketParticipants: defineTable({
    bracketId: v.id("brackets"),
    categoryParticipantId: v.id("categoryParticipants"),
    status: v.union(v.literal("active"), v.literal("eliminated"), v.literal("withdrawn")),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_bracket", ["bracketId"])
    .index("by_category_participant", ["categoryParticipantId"])
    .index("by_deletedAt", ["deletedAt"]),

  // ========== MATCHES ==========
  matches: defineTable({
    bracketId: v.id("brackets"),
    categoryId: v.id("categories"),
    participant1Id: v.id("categoryParticipants"),
    participant2Id: v.id("categoryParticipants"),
    team1Score: v.number(),
    team2Score: v.number(),
    servingTeam: v.union(v.literal(1), v.literal(2)),
    serverNumber: v.union(v.literal(1), v.literal(2)),
    isFirstServe: v.boolean(),
    targetScore: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("inProgress"),
      v.literal("completed"),
      v.literal("abandoned"),
    ),
    winnerParticipantId: v.optional(v.id("categoryParticipants")),
    isLive: v.optional(v.boolean()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    lastUpdatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_bracket", ["bracketId"])
    .index("by_category", ["categoryId"])
    .index("by_status", ["status"])
    .index("by_is_live", ["isLive"])
    .index("by_participant", ["participant1Id"])
    .index("by_participant2", ["participant2Id"])
    .index("by_deletedAt", ["deletedAt"]),

  // ========== POINTS ==========
  pickleballPoints: defineTable({
    matchId: v.id("matches"),
    team1Score: v.number(),
    team2Score: v.number(),
    servingTeam: v.union(v.literal(1), v.literal(2)),
    serverNumber: v.union(v.literal(1), v.literal(2)),
    isFirstServe: v.boolean(),
    pointWinner: v.union(v.literal(1), v.literal(2)),
    sequenceNumber: v.number(),
    timestamp: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_match", ["matchId"])
    .index("by_match_and_sequence", ["matchId", "sequenceNumber"])
    .index("by_deletedAt", ["deletedAt"]),

  // ========== DELETION REQUESTS ==========
  deletionRequest: defineTable({
    targetType: v.union(v.literal("player"), v.literal("playerPair")),
    targetId: v.string(),
    reason: v.string(),
    requestedBy: v.id("user"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    updatedAt: v.number(),
  })
    .index("by_target", ["targetType", "targetId"])
    .index("by_status", ["status"]),

  ...authTables,
});
