import { v } from "convex/values";

import { components } from "../_generated/api";
import { adminMutation, adminQuery } from "./lib";

export const list = adminQuery({
  args: {},
  handler: async (_ctx) => {
    const users = await _ctx.runQuery(components.betterAuth.users.list);
    return users;
  },
});

export const updateRole = adminMutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    if (ctx.user._id === args.userId && args.role !== "admin") {
      throw new Error("You cannot remove your own admin role");
    }

    return ctx.runMutation(components.betterAuth.users.updateRole, args);
  },
});
