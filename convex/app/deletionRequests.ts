import { ConvexError, v } from "convex/values";

import { authedMutation } from "./lib";

export const playerDeletionRequestCreate = authedMutation({
  args: {
    targetType: v.union(v.literal("player"), v.literal("playerPair")),
    targetId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
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
      requestedBy: ctx.user._id,
      status: "pending",
      updatedAt: Date.now(),
    });

    return requestId;
  },
});
