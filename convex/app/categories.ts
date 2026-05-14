import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { authedQuery, authedMutation, requireManageTournament } from "./lib";

export const listByTournament = authedQuery({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .order("asc")
      .collect();

    return categories;
  },
});

export const get = query({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.categoryId);
  },
});

export const create = authedMutation({
  args: {
    tournamentId: v.id("tournaments"),
    name: v.string(),
    type: v.union(v.literal("singles"), v.literal("doubles")),
    rating: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    category: v.union(
      v.literal("womens"),
      v.literal("mens"),
      v.literal("mixed"),
      v.literal("open"),
    ),
    maxParticipants: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireManageTournament(ctx, args.tournamentId);

    const categoryId = await ctx.db.insert("categories", {
      tournamentId: args.tournamentId,
      name: args.name,
      type: args.type,
      rating: args.rating,
      category: args.category,
      maxParticipants: args.maxParticipants,
    });

    return categoryId;
  },
});

export const update = authedMutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("singles"), v.literal("doubles"))),
    rating: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    ),
    category: v.optional(
      v.union(v.literal("womens"), v.literal("mens"), v.literal("mixed"), v.literal("open")),
    ),
    maxParticipants: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, category.tournamentId);

    const { categoryId, ...updates } = args;
    await ctx.db.patch(categoryId, updates);
    return { success: true };
  },
});

export const remove = authedMutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await requireManageTournament(ctx, category.tournamentId);

    const brackets = await ctx.db
      .query("brackets")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    for (const bracket of brackets) {
      const matches = await ctx.db
        .query("matches")
        .withIndex("by_bracket", (q) => q.eq("bracketId", bracket._id))
        .collect();

      for (const match of matches) {
        const matchSets = await ctx.db
          .query("matchSets")
          .withIndex("by_match", (q) => q.eq("matchId", match._id))
          .collect();

        for (const matchSet of matchSets) {
          const points = await ctx.db
            .query("pickleballPoints")
            .withIndex("by_match_set", (q) => q.eq("matchSetId", matchSet._id))
            .collect();

          for (const point of points) {
            await ctx.db.delete(point._id);
          }

          await ctx.db.delete(matchSet._id);
        }

        await ctx.db.delete(match._id);
      }

      const bracketParticipants = await ctx.db
        .query("bracketParticipants")
        .withIndex("by_bracket", (q) => q.eq("bracketId", bracket._id))
        .collect();

      for (const bp of bracketParticipants) {
        await ctx.db.delete(bp._id);
      }

      await ctx.db.delete(bracket._id);
    }

    const categoryParticipants = await ctx.db
      .query("categoryParticipants")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    for (const cp of categoryParticipants) {
      await ctx.db.delete(cp._id);
    }

    await ctx.db.delete(args.categoryId);
    return { success: true };
  },
});
