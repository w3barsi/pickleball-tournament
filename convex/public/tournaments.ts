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

export const counts = query({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db
      .query("tournaments")
      .withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined))
      .collect();

    const publicTournaments = tournaments.filter(
      (t) => t.isPublic === true && t.deletedAt === undefined,
    );

    return {
      upcomingCount: publicTournaments.filter((t) => t.status === "upcoming").length,
      liveCount: publicTournaments.filter((t) => t.status === "inProgress").length,
      completedCount: publicTournaments.filter((t) => t.status === "completed").length,
    };
  },
});

export const showcaseList = query({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db
      .query("tournaments")
      .withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined))
      .collect();

    const publicTournaments = tournaments.filter(
      (t) => t.isPublic === true && t.deletedAt === undefined,
    );

    const featured = publicTournaments.find((t) => t.isFeaturedEvent === true) ?? null;
    const showcased = publicTournaments
      .filter((t) => t.showcaseOrder !== undefined && t.showcaseOrder !== null)
      .sort((a, b) => (a.showcaseOrder ?? 0) - (b.showcaseOrder ?? 0));

    return {
      featuredEvent: featured,
      showcasedEvents: showcased,
    };
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

    // Collect singles players and doubles pairs separately
    const singlesPlayersMap = new Map();
    const doublesPairsMap = new Map();
    const allIndividualPlayersMap = new Map();

    for (const category of categories) {
      const participants = await ctx.db
        .query("categoryParticipants")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .take(500);

      if (category.type === "singles") {
        for (const p of participants) {
          if (p.playerId) {
            const player = await ctx.db.get(p.playerId);
            if (player && player.deletedAt === undefined) {
              singlesPlayersMap.set(player._id, player);
              allIndividualPlayersMap.set(player._id, player);
            }
          }
        }
      } else {
        for (const p of participants) {
          if (p.pairId) {
            const pair = await ctx.db.get(p.pairId);
            if (pair && pair.deletedAt === undefined) {
              const p1 = await ctx.db.get(pair.playerOne);
              const p2 = await ctx.db.get(pair.playerTwo);
              if (p1 && p2 && p1.deletedAt === undefined && p2.deletedAt === undefined) {
                doublesPairsMap.set(pair._id, {
                  pair,
                  playerOne: p1,
                  playerTwo: p2,
                });
                allIndividualPlayersMap.set(p1._id, p1);
                allIndividualPlayersMap.set(p2._id, p2);
              }
            }
          }
        }
      }
    }

    return {
      tournament,
      categories: categoryDetails,
      singlesPlayers: Array.from(singlesPlayersMap.values()).sort((a, b) =>
        a.fullName.localeCompare(b.fullName),
      ),
      doublesPairs: Array.from(doublesPairsMap.values()).sort((a, b) => {
        const aName = a.pair.teamName || `${a.playerOne.fullName} / ${a.playerTwo.fullName}`;
        const bName = b.pair.teamName || `${b.playerOne.fullName} / ${b.playerTwo.fullName}`;
        return aName.localeCompare(bName);
      }),
      totalIndividualPlayers: allIndividualPlayersMap.size,
    };
  },
});
