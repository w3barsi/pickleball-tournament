import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { authedQuery, authedMutation, requireManageTournament } from "./lib";

export const listAll = authedQuery({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db
      .query("tournaments")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", ctx.user._id))
      .order("desc")
      .collect();

    return tournaments;
  },
});

export const get = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tournamentId);
  },
});

export const getBySlug = authedQuery({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db
      .query("tournaments")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!tournament) return null;

    const hasAccess = tournament.createdBy === ctx.user._id;
    if (!hasAccess) return null;

    return tournament;
  },
});

export const create = authedMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    date: v.number(),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    organizerName: v.string(),
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    registrationDeadline: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tournaments")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing !== null) {
      throw new Error(`A tournament with slug "${args.slug}" already exists`);
    }

    const tournamentId = await ctx.db.insert("tournaments", {
      name: args.name,
      slug: args.slug,
      date: args.date,
      endDate: args.endDate,
      description: args.description,
      organizerName: args.organizerName,
      venueName: args.venueName,
      venueAddress: args.venueAddress,
      registrationDeadline: args.registrationDeadline,
      isPublic: args.isPublic,
      status: "upcoming",
      createdBy: ctx.user._id,
    });

    return tournamentId;
  },
});

export const update = authedMutation({
  args: {
    tournamentId: v.id("tournaments"),
    name: v.optional(v.string()),
    date: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    organizerName: v.optional(v.string()),
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    registrationDeadline: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    status: v.optional(
      v.union(v.literal("upcoming"), v.literal("inProgress"), v.literal("completed")),
    ),
  },
  handler: async (ctx, args) => {
    await requireManageTournament(ctx, args.tournamentId);

    const { tournamentId, ...updates } = args;
    await ctx.db.patch(tournamentId, updates);
    return { success: true };
  },
});

export const remove = authedMutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    await requireManageTournament(ctx, args.tournamentId);

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    for (const category of categories) {
      const brackets = await ctx.db
        .query("brackets")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
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
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .collect();

      for (const cp of categoryParticipants) {
        await ctx.db.delete(cp._id);
      }

      await ctx.db.delete(category._id);
    }

    await ctx.db.delete(args.tournamentId);
    return { success: true };
  },
});
