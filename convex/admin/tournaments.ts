import { v } from "convex/values";

import { deleteTournamentCascade } from "../app/lib";
import { adminMutation, adminQuery } from "./lib";

export const list = adminQuery({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db
      .query("tournaments")
      .withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined))
      .order("desc")
      .collect();

    return tournaments;
  },
});

export const setFeatured = adminMutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const featured = await ctx.db
      .query("tournaments")
      .withIndex("by_featured_event", (q) => q.eq("isFeaturedEvent", true))
      .collect();

    for (const t of featured) {
      if (t._id !== args.tournamentId) {
        await ctx.db.patch(t._id, { isFeaturedEvent: false });
      }
    }

    await ctx.db.patch(args.tournamentId, { isFeaturedEvent: true });
    return { success: true };
  },
});

export const unsetFeatured = adminMutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tournamentId, { isFeaturedEvent: false });
    return { success: true };
  },
});

export const update = adminMutation({
  args: {
    tournamentId: v.id("tournaments"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    date: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    organizerName: v.optional(v.string()),
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    bannerImageUrl: v.optional(v.string()),
    registrationDeadline: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    status: v.optional(
      v.union(v.literal("upcoming"), v.literal("inProgress"), v.literal("completed")),
    ),
    isFeaturedEvent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tournamentId, ...updates } = args;
    await ctx.db.patch(tournamentId, updates);
    return { success: true };
  },
});

export const remove = adminMutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    await deleteTournamentCascade(ctx, args.tournamentId);
    return { success: true };
  },
});
