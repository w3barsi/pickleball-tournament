import { v } from "convex/values";

import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";

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

// Update a player
export const update = mutation({
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

// Delete a player (admin only)
export const remove = mutation({
  args: {
    playerId: v.id("player"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.playerId);

    // Approve any pending deletion requests for this player
    const pendingRequests = await ctx.db
      .query("deletionRequest")
      .withIndex("by_target", (q) => q.eq("targetType", "player").eq("targetId", args.playerId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    for (const request of pendingRequests) {
      await ctx.db.patch(request._id, {
        status: "approved",
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Search players by full name
export const search = query({
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
