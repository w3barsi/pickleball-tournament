import { Migrations } from "@convex-dev/migrations";

import { components } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

export const backfillWinByTwo = migrations.define({
  table: "matches",
  migrateOne: async (ctx, match) => {
    if (match.winByTwo === undefined) {
      await ctx.db.patch(match._id, { winByTwo: true });
    }
  },
});
