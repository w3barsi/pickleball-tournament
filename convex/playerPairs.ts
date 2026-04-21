import { v } from "convex/values";

import { Doc, Id } from "./_generated/dataModel";
import { query, mutation } from "./_generated/server";

// List all player pairs with player names populated
export const listAll = query({
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

// Create a new player pair
export const create = mutation({
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

// Delete a player pair
export const remove = mutation({
  args: {
    pairId: v.id("playerPair"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.pairId);
    return { success: true };
  },
});
