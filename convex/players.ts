import { v } from "convex/values";

import { query, mutation } from "./_generated/server";

// List all players
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("player").order("desc").take(100);
    return players;
  },
});

// Get a single player by ID
export const get = query({
  args: {
    playerId: v.id("player"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});

// Create a new player
export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    nickname: v.string(),
  },
  handler: async (ctx, args) => {
    const playerId = await ctx.db.insert("player", {
      firstName: args.firstName,
      lastName: args.lastName,
      nickname: args.nickname,
    });
    return playerId;
  },
});

// Update a player
export const update = mutation({
  args: {
    playerId: v.id("player"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    nickname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { playerId, ...updates } = args;
    await ctx.db.patch(playerId, updates);
    return { success: true };
  },
});

// Delete a player
export const remove = mutation({
  args: {
    playerId: v.id("player"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.playerId);
    return { success: true };
  },
});
