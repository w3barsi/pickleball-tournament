import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { query, mutation, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

// ─── Helpers ───────────────────────────────────────────────────────────────

async function getAuthUser(ctx: QueryCtx) {
  return await authComponent.safeGetAuthUser(ctx);
}

async function requireAuthUser(ctx: QueryCtx) {
  const user = await getAuthUser(ctx);
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

async function canManageTournament(ctx: QueryCtx, tournamentId: Id<"tournaments">) {
  const user = await getAuthUser(ctx);
  if (!user) return false;

  const tournament = await ctx.db.get(tournamentId);
  if (!tournament) return false;

  // Creator always has access
  if (tournament.createdBy === user._id) return true;

  // Check manager table
  const manager = await ctx.db
    .query("tournamentManagers")
    .withIndex("by_tournament_user", (q) =>
      q.eq("tournamentId", tournamentId).eq("userId", user._id),
    )
    .unique();

  return manager !== null;
}

async function requireManageTournament(ctx: QueryCtx, tournamentId: Id<"tournaments">) {
  const canManage = await canManageTournament(ctx, tournamentId);
  if (!canManage) {
    throw new Error("You do not have permission to manage this tournament");
  }
}

// ─── Queries ───────────────────────────────────────────────────────────────

// List tournaments accessible by the current user (created by or manager of)
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return [];

    // Get tournaments created by the user
    const createdTournaments = await ctx.db
      .query("tournaments")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .collect();

    // Get tournaments where user is a manager
    const managers = await ctx.db
      .query("tournamentManagers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const managedTournamentIds = new Set(managers.map((m) => m.tournamentId));

    // Fetch managed tournaments that weren't created by this user
    const managedTournaments: typeof createdTournaments = [];
    for (const tournamentId of managedTournamentIds) {
      if (!createdTournaments.some((t) => t._id === tournamentId)) {
        const tournament = await ctx.db.get(tournamentId);
        if (tournament) {
          managedTournaments.push(tournament);
        }
      }
    }

    // Combine and sort by date descending
    const allTournaments = [...createdTournaments, ...managedTournaments];
    allTournaments.sort((a, b) => b.date - a.date);

    return allTournaments;
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

// Get a single tournament by slug (only if user has access)
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) return null;

    const tournament = await ctx.db
      .query("tournaments")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!tournament) return null;

    // Check if user has access (created by or is a manager)
    const hasAccess = await canManageTournament(ctx, tournament._id);
    if (!hasAccess) return null;

    return tournament;
  },
});

// Check if the current user can edit a tournament
export const canEdit = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    return await canManageTournament(ctx, args.tournamentId);
  },
});

// Get all tournament IDs the current user can manage
export const getEditableIds = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return [];

    const managers = await ctx.db
      .query("tournamentManagers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return managers.map((m) => m.tournamentId);
  },
});

// List managers for a tournament (including the creator as implicit owner)
export const listManagers = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) return [];

    const managers = await ctx.db
      .query("tournamentManagers")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    return managers;
  },
});

// ─── Mutations ─────────────────────────────────────────────────────────────

// Create a new tournament
export const create = mutation({
  args: {
    name: v.string(),
    date: v.number(),
    description: v.optional(v.string()),
    organizerName: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    // Check if a tournament with this slug already exists
    const existing = await ctx.db
      .query("tournaments")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing !== null) {
      throw new Error(`A tournament with slug "${args.slug}" already exists`);
    }

    const now = Date.now();
    const tournamentId = await ctx.db.insert("tournaments", {
      name: args.name,
      date: args.date,
      description: args.description,
      organizerName: args.organizerName,
      status: "upcoming",
      createdAt: now,
      slug: args.slug,
      createdBy: user._id,
    });

    // Also record the creator as an owner in the managers table
    await ctx.db.insert("tournamentManagers", {
      tournamentId,
      userId: user._id,
      role: "owner",
      invitedAt: now,
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
    await requireManageTournament(ctx, args.tournamentId);

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
    await requireManageTournament(ctx, args.tournamentId);

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

    // Delete all managers
    const managers = await ctx.db
      .query("tournamentManagers")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    for (const manager of managers) {
      await ctx.db.delete(manager._id);
    }

    // Finally delete the tournament
    await ctx.db.delete(args.tournamentId);
    return { success: true };
  },
});

// Invite a user to manage a tournament
export const inviteManager = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.string(),
    role: v.optional(v.union(v.literal("owner"), v.literal("manager"))),
  },
  handler: async (ctx, args) => {
    await requireManageTournament(ctx, args.tournamentId);

    // Check if already a manager
    const existing = await ctx.db
      .query("tournamentManagers")
      .withIndex("by_tournament_user", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("userId", args.userId),
      )
      .unique();

    if (existing !== null) {
      throw new Error("User is already a manager of this tournament");
    }

    const now = Date.now();
    await ctx.db.insert("tournamentManagers", {
      tournamentId: args.tournamentId,
      userId: args.userId,
      role: args.role ?? "manager",
      invitedAt: now,
    });

    return { success: true };
  },
});

// Remove a manager from a tournament
export const removeManager = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireManageTournament(ctx, args.tournamentId);

    const manager = await ctx.db
      .query("tournamentManagers")
      .withIndex("by_tournament_user", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("userId", args.userId),
      )
      .unique();

    if (manager === null) {
      throw new Error("User is not a manager of this tournament");
    }

    // Don't allow removing the last owner
    if (manager.role === "owner") {
      const owners = await ctx.db
        .query("tournamentManagers")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
        .collect();

      const ownerCount = owners.filter((m) => m.role === "owner").length;
      if (ownerCount <= 1) {
        throw new Error("Cannot remove the last owner of a tournament");
      }
    }

    await ctx.db.delete(manager._id);
    return { success: true };
  },
});
