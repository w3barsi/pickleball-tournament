import { v } from "convex/values";

import { Doc, Id } from "../_generated/dataModel";
import { authedQuery, authedMutation } from "./lib";

export const listAll = authedQuery({
  args: {},
  handler: async (ctx) => {
    const pairs = await ctx.db.query("playerPair").order("desc").take(100);

    const playerIds = new Set<Id<"player">>();
    for (const p of pairs) {
      playerIds.add(p.playerOne);
      playerIds.add(p.playerTwo);
    }

    const playerMap = new Map<Id<"player">, Doc<"player">>();
    for (const id of playerIds) {
      const player = await ctx.db.get(id);
      if (player) playerMap.set(id, player);
    }

    return pairs.map((pair) => ({
      ...pair,
      playerOneName: playerMap.get(pair.playerOne)?.fullName ?? "Unknown",
      playerTwoName: playerMap.get(pair.playerTwo)?.fullName ?? "Unknown",
    }));
  },
});

export const create = authedMutation({
  args: {
    teamName: v.optional(v.string()),
    playerOne: v.id("player"),
    playerTwo: v.id("player"),
  },
  handler: async (ctx, args) => {
    if (args.playerOne === args.playerTwo) {
      throw new Error("Player one and player two must be different people");
    }

    const ids = [args.playerOne, args.playerTwo].sort();
    const pairKey = `${ids[0]}:${ids[1]}`;

    const existing = await ctx.db
      .query("playerPair")
      .withIndex("by_pair_key", (q) => q.eq("pairKey", pairKey))
      .unique();

    if (existing) {
      throw new Error("This pair already exists");
    }

    const pairId = await ctx.db.insert("playerPair", {
      teamName: args.teamName || undefined,
      playerOne: args.playerOne,
      playerTwo: args.playerTwo,
      pairKey,
      wins: 0,
      losses: 0,
    });

    return pairId;
  },
});

export const createWithPlayers = authedMutation({
  args: {
    teamName: v.optional(v.string()),
    playerOneId: v.optional(v.id("player")),
    playerOneName: v.optional(v.string()),
    playerTwoId: v.optional(v.id("player")),
    playerTwoName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Resolve player one
    let p1Id = args.playerOneId;
    if (!p1Id && args.playerOneName) {
      const existing = await ctx.db
        .query("player")
        .withIndex("by_fullName", (q) => q.eq("fullName", args.playerOneName!))
        .take(1);
      if (existing.length > 0) {
        p1Id = existing[0]._id;
      } else {
        p1Id = await ctx.db.insert("player", { fullName: args.playerOneName!, nickname: "" });
      }
    }
    if (!p1Id) {
      throw new Error("Player one is required");
    }

    // Resolve player two
    let p2Id = args.playerTwoId;
    if (!p2Id && args.playerTwoName) {
      const existing = await ctx.db
        .query("player")
        .withIndex("by_fullName", (q) => q.eq("fullName", args.playerTwoName!))
        .take(1);
      if (existing.length > 0) {
        p2Id = existing[0]._id;
      } else {
        p2Id = await ctx.db.insert("player", { fullName: args.playerTwoName!, nickname: "" });
      }
    }
    if (!p2Id) {
      throw new Error("Player two is required");
    }

    if (p1Id === p2Id) {
      throw new Error("Player one and player two must be different people");
    }

    const ids = [p1Id, p2Id].sort();
    const pairKey = `${ids[0]}:${ids[1]}`;

    const existingPair = await ctx.db
      .query("playerPair")
      .withIndex("by_pair_key", (q) => q.eq("pairKey", pairKey))
      .unique();

    if (existingPair) {
      throw new Error("This pair already exists");
    }

    const pairId = await ctx.db.insert("playerPair", {
      teamName: args.teamName || undefined,
      playerOne: ids[0],
      playerTwo: ids[1],
      pairKey,
      wins: 0,
      losses: 0,
    });

    return pairId;
  },
});
