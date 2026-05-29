import { Migrations } from "@convex-dev/migrations";

import { components, internal } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";

export const migrations = new Migrations<DataModel>(components.migrations);

export const moveScoringConfigToBrackets = migrations.define({
  table: "brackets",
  migrateOne: async (ctx, bracket) => {
    if (bracket.numberOfSets === undefined) {
      await ctx.db.patch(bracket._id, {
        numberOfSets: 1,
        pointsPerGame: 11,
        winByTwo: true,
      });
    }
  },
});

export const removeScoringConfigFromMatches = migrations.define({
  table: "matches",
  migrateOne: async (ctx, match) => {
    if (
      (match as Record<string, unknown>).numberOfSets !== undefined ||
      (match as Record<string, unknown>).pointsPerGame !== undefined ||
      (match as Record<string, unknown>).winByTwo !== undefined
    ) {
      await ctx.db.patch(match._id, {
        numberOfSets: undefined,
        pointsPerGame: undefined,
        winByTwo: undefined,
      } as Record<string, unknown>);
    }
  },
});

export const backfillBracketParticipantSeeds = migrations.define({
  table: "bracketParticipants",
  migrateOne: async (ctx, bp) => {
    if (bp.seed !== undefined) return;

    const existingInBracket = await ctx.db
      .query("bracketParticipants")
      .withIndex("by_bracket", (q) => q.eq("bracketId", bp.bracketId))
      .order("asc")
      .collect();

    const position = existingInBracket.findIndex((p) => p._id === bp._id) + 1;
    if (position > 0) {
      await ctx.db.patch(bp._id, { seed: position });
    }
  },
});

export const run = migrations.runner([
  internal.migrations.moveScoringConfigToBrackets,
  internal.migrations.removeScoringConfigFromMatches,
  internal.migrations.backfillBracketParticipantSeeds,
]);
