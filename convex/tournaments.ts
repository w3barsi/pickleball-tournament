import { v } from "convex/values";

import { query, mutation } from "./_generated/server";

// List all tournaments
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").order("desc").take(100);
    return tournaments;
  },
});

// Get a single tournament by ID
export const get = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tournamentId);
  },
});

// Create a new tournament
export const create = mutation({
  args: {
    name: v.string(),
    date: v.number(),
    description: v.optional(v.string()),
    organizerName: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const tournamentId = await ctx.db.insert("tournaments", {
      name: args.name,
      date: args.date,
      description: args.description,
      organizerName: args.organizerName,
      status: "upcoming",
      createdAt: now,
    });
    return tournamentId;
  },
});

// Update a tournament
export const update = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    name: v.optional(v.string()),
    date: v.optional(v.number()),
    description: v.optional(v.string()),
    organizerName: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("upcoming"), v.literal("inProgress"), v.literal("completed")),
    ),
  },
  handler: async (ctx, args) => {
    const { tournamentId, ...updates } = args;
    await ctx.db.patch(tournamentId, updates);
    return { success: true };
  },
});

// Delete a tournament (and all related data)
export const remove = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    // Get all categories for this tournament
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    // Delete all related data (cascading delete)
    for (const category of categories) {
      // Get all brackets for this category
      const brackets = await ctx.db
        .query("brackets")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .collect();

      for (const bracket of brackets) {
        // Get all matches for this bracket
        const matches = await ctx.db
          .query("matches")
          .withIndex("by_bracket", (q) => q.eq("bracketId", bracket._id))
          .collect();

        for (const match of matches) {
          // Delete all points for this match
          const points = await ctx.db
            .query("pickleballPoints")
            .withIndex("by_match", (q) => q.eq("matchId", match._id))
            .collect();

          for (const point of points) {
            await ctx.db.delete(point._id);
          }

          await ctx.db.delete(match._id);
        }

        // Delete bracket participants
        const bracketParticipants = await ctx.db
          .query("bracketParticipants")
          .withIndex("by_bracket", (q) => q.eq("bracketId", bracket._id))
          .collect();

        for (const bp of bracketParticipants) {
          await ctx.db.delete(bp._id);
        }

        await ctx.db.delete(bracket._id);
      }

      // Delete category participants
      const categoryParticipants = await ctx.db
        .query("categoryParticipants")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .collect();

      for (const cp of categoryParticipants) {
        await ctx.db.delete(cp._id);
      }

      await ctx.db.delete(category._id);
    }

    // Finally delete the tournament
    await ctx.db.delete(args.tournamentId);
    return { success: true };
  },
});
