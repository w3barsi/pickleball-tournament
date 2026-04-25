import { ConvexError, v } from "convex/values";

import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";

// Create a deletion request
export const create = mutation({
  args: {
    targetType: v.union(v.literal("player"), v.literal("playerPair")),
    targetId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check for existing pending request for this target
    const existing = await ctx.db
      .query("deletionRequest")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .unique();

    if (existing) {
      throw new ConvexError("A pending deletion request already exists for this item.");
    }

    const requestId = await ctx.db.insert("deletionRequest", {
      targetType: args.targetType,
      targetId: args.targetId,
      reason: args.reason,
      requestedBy: user._id,
      status: "pending",
      updatedAt: Date.now(),
    });

    return requestId;
  },
});

// List all deletion requests (admin only)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const requests = await ctx.db.query("deletionRequest").order("desc").take(100);
    return requests;
  },
});
