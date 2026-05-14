import { v } from "convex/values";

import { adminMutation, adminQuery } from "./lib";

export const remove = adminMutation({
  args: { playerId: v.id("player") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.playerId);

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

export const removePair = adminMutation({
  args: { pairId: v.id("playerPair") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.pairId);

    const pendingRequests = await ctx.db
      .query("deletionRequest")
      .withIndex("by_target", (q) => q.eq("targetType", "playerPair").eq("targetId", args.pairId))
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

export const playerDeletionRequest = adminQuery({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db.query("deletionRequest").order("desc").take(100);
    return requests;
  },
});
