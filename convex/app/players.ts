import { v } from "convex/values";

import { authedQuery, authedMutation } from "./lib";

export const listAll = authedQuery({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("player").order("desc").take(100);
    return players;
  },
});

export const get = authedQuery({
  args: {
    playerId: v.id("player"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});

export const create = authedMutation({
  args: {
    fullName: v.string(),
    nickname: v.string(),
  },
  handler: async (ctx, args) => {
    const playerId = await ctx.db.insert("player", {
      fullName: args.fullName,
      nickname: args.nickname,
    });
    return playerId;
  },
});

export const update = authedMutation({
  args: {
    playerId: v.id("player"),
    fullName: v.optional(v.string()),
    nickname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { playerId, ...updates } = args;
    await ctx.db.patch(playerId, updates);
    return { success: true };
  },
});

export const search = authedQuery({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const q = args.query.trim().toLowerCase();
    const players = await ctx.db.query("player").order("desc").take(100);
    if (!q) return players.slice(0, 10);
    return players.filter((p) => p.fullName.toLowerCase().includes(q)).slice(0, 10);
  },
});
