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

export const run = migrations.runner([
  internal.migrations.moveScoringConfigToBrackets,
  internal.migrations.removeScoringConfigFromMatches,
]);
