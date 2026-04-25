import { doc } from "convex-helpers/validators";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import schema from "./schema";

export const list = query({
  args: {},
  returns: v.array(doc(schema, "user")),
  handler: async (ctx) => {
    const users = await ctx.db.query("user").collect();
    return users;
  },
});

export const updateRole = mutation({
  args: {
    userId: v.id("user"),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("user", args.userId, { role: args.role });
    return { success: true };
  },
});
