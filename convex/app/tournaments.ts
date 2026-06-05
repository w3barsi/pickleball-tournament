import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import {
  authedQuery,
  authedMutation,
  requireManageTournament,
  deleteTournamentCascade,
} from "./lib";

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
    await deleteTournamentCascade(ctx, args.tournamentId);
    return { success: true };
  },
});
