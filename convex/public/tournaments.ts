import { v } from "convex/values";

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

export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db
      .query("tournaments")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!tournament || tournament.isPublic !== true || tournament.deletedAt !== undefined) {
      return null;
    }

    return tournament;
  },
});

export const getDetails = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db
      .query("tournaments")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!tournament || tournament.isPublic !== true || tournament.deletedAt !== undefined) {
      return null;
    }

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
      .order("asc")
      .collect();

    const categoryDetails = [];
    const allPlayersMap = new Map();

    for (const category of categories) {
      const brackets = await ctx.db
        .query("brackets")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .order("asc")
        .collect();

      const bracketDetails = [];
      for (const bracket of brackets) {
        const participantCount = await ctx.db
          .query("bracketParticipants")
          .withIndex("by_bracket", (q) => q.eq("bracketId", bracket._id))
          .take(1000)
          .then((bps) => bps.length);

        const matchCount = await ctx.db
          .query("matches")
          .withIndex("by_bracket", (q) => q.eq("bracketId", bracket._id))
          .take(1000)
          .then((ms) => ms.length);

        bracketDetails.push({
          ...bracket,
          participantCount,
          matchCount,
        });
      }

      categoryDetails.push({
        category,
        brackets: bracketDetails,
      });
    }

    // Collect all unique players
    for (const category of categories) {
      const participants = await ctx.db
        .query("categoryParticipants")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .take(500);

      if (category.type === "singles") {
        for (const p of participants) {
          if (p.playerId) {
            const player = await ctx.db.get(p.playerId);
            if (player && player.deletedAt === undefined && !allPlayersMap.has(player._id)) {
              allPlayersMap.set(player._id, {
                ...player,
                _entryType: "singles" as const,
              });
            }
          }
        }
      } else {
        for (const p of participants) {
          if (p.pairId) {
            const pair = await ctx.db.get(p.pairId);
            if (pair) {
              const p1 = await ctx.db.get(pair.playerOne);
              const p2 = await ctx.db.get(pair.playerTwo);
              if (p1 && p1.deletedAt === undefined && !allPlayersMap.has(p1._id)) {
                allPlayersMap.set(p1._id, {
                  ...p1,
                  _entryType: "doubles" as const,
                });
              }
              if (p2 && p2.deletedAt === undefined && !allPlayersMap.has(p2._id)) {
                allPlayersMap.set(p2._id, {
                  ...p2,
                  _entryType: "doubles" as const,
                });
              }
            }
          }
        }
      }
    }

    return {
      tournament,
      categories: categoryDetails,
      players: Array.from(allPlayersMap.values()).sort((a, b) =>
        a.fullName.localeCompare(b.fullName),
      ),
    };
  },
});
