import { internalMutation } from "../_generated/server";

export const migrate = internalMutation({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").collect();
    let migrated = 0;
    let skipped = 0;

    for (const match of matches) {
      const updates: Record<string, unknown> = {};

      // Migrate participant1Id
      if (match.participant1Id) {
        const bp1 = await ctx.db
          .query("bracketParticipants")
          .withIndex("by_bracket", (q) => q.eq("bracketId", match.bracketId))
          .filter((q) => q.eq(q.field("categoryParticipantId"), match.participant1Id))
          .unique();
        if (bp1) {
          updates.participant1Id = bp1._id;
        } else {
          skipped++;
          console.warn(`No bracketParticipant found for match ${match._id} participant1Id ${match.participant1Id}`);
          continue;
        }
      }

      // Migrate participant2Id
      if (match.participant2Id) {
        const bp2 = await ctx.db
          .query("bracketParticipants")
          .withIndex("by_bracket", (q) => q.eq("bracketId", match.bracketId))
          .filter((q) => q.eq(q.field("categoryParticipantId"), match.participant2Id))
          .unique();
        if (bp2) {
          updates.participant2Id = bp2._id;
        } else {
          skipped++;
          console.warn(`No bracketParticipant found for match ${match._id} participant2Id ${match.participant2Id}`);
          continue;
        }
      }

      // Migrate winnerParticipantId
      if (match.winnerParticipantId) {
        const bpWinner = await ctx.db
          .query("bracketParticipants")
          .withIndex("by_bracket", (q) => q.eq("bracketId", match.bracketId))
          .filter((q) => q.eq(q.field("categoryParticipantId"), match.winnerParticipantId))
          .unique();
        if (bpWinner) {
          updates.winnerParticipantId = bpWinner._id;
        } else {
          skipped++;
          console.warn(`No bracketParticipant found for match ${match._id} winnerParticipantId ${match.winnerParticipantId}`);
          continue;
        }
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(match._id, updates);
        migrated++;
      }
    }

    return { migrated, skipped };
  },
});
