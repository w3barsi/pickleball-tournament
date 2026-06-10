import { v } from "convex/values";

import { deleteTournamentCascade } from "../app/lib";
import { adminMutation, adminQuery } from "./lib";

export const list = adminQuery({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").order("desc").collect();

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

    await ctx.db.patch(args.tournamentId, { isFeaturedEvent: true, showcaseOrder: undefined });
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

export const setShowcaseOrder = adminMutation({
  args: {
    tournamentId: v.id("tournaments"),
    order: v.union(v.null(), v.number()),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.tournamentId);
    if (!target) throw new Error("Tournament not found");

    // If removing from showcase
    if (args.order === null) {
      await ctx.db.patch(args.tournamentId, { showcaseOrder: undefined });
      return { success: true };
    }

    const requestedOrder = args.order;
    if (requestedOrder < 1 || requestedOrder > 6) {
      throw new Error("Showcase order must be between 1 and 6");
    }

    // Get all currently showcased tournaments excluding the target
    const allTournaments = await ctx.db.query("tournaments").collect();

    const showcased = allTournaments.filter(
      (t) =>
        t._id !== args.tournamentId && t.showcaseOrder !== undefined && t.showcaseOrder !== null,
    );

    // If target is already at the requested order, nothing to do
    if (target.showcaseOrder === requestedOrder) {
      return { success: true };
    }

    // Find tournaments that need to shift (order >= requestedOrder)
    const toShift = showcased
      .filter((t) => (t.showcaseOrder ?? 0) >= requestedOrder)
      .sort((a, b) => (b.showcaseOrder ?? 0) - (a.showcaseOrder ?? 0));

    // Shift them down by 1, evicting any that exceed 6
    for (const t of toShift) {
      const newOrder = (t.showcaseOrder ?? 0) + 1;
      if (newOrder > 6) {
        await ctx.db.patch(t._id, { showcaseOrder: undefined });
      } else {
        await ctx.db.patch(t._id, { showcaseOrder: newOrder });
      }
    }

    // Assign the requested order to the target
    await ctx.db.patch(args.tournamentId, { showcaseOrder: requestedOrder });
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
    showcaseOrder: v.optional(v.number()),
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
