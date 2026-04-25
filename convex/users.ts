import { v } from "convex/values";

import { components } from "./_generated/api";
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";

// List all users
export const list = query({
  args: {},
  handler: async (ctx, component) => {
    const currentUser = await authComponent.safeGetAuthUser(ctx);
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Unauthorized");
    }

    // const users = await ctx.db.query("user").collect();
    const users = await ctx.runQuery(components.betterAuth.users.list);
    return users;
  },
});

// Update a user's role
export const updateRole = mutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const currentUser = await authComponent.safeGetAuthUser(ctx);
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Unauthorized");
    }

    // Prevent self-demotion
    if (currentUser._id === args.userId && args.role !== "admin") {
      throw new Error("You cannot remove your own admin role");
    }

    return ctx.runMutation(components.betterAuth.users.updateRole, args);
  },
});
