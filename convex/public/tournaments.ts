import { query } from "../_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db
      .query("tournaments")
      .withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined))
      .order("desc")
      .collect();

    return tournaments.filter((t) => t.isPublic === true && t.deletedAt === undefined);
  },
});
