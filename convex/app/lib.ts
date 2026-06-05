import { customQuery, customMutation, customCtx } from "convex-helpers/server/customFunctions";

import { Id } from "../_generated/dataModel";
import { query, mutation, QueryCtx, MutationCtx } from "../_generated/server";
import { authComponent } from "../auth";

export const authedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Authentication required");
    return { user };
  }),
);

export const authedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Authentication required");
    return { user };
  }),
);

export async function canManageTournament(ctx: QueryCtx, tournamentId: Id<"tournaments">) {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) return false;
  const tournament = await ctx.db.get(tournamentId);
  if (!tournament) return false;
  return tournament.createdBy === user._id;
}

export async function requireManageTournament(ctx: QueryCtx, tournamentId: Id<"tournaments">) {
  const canManage = await canManageTournament(ctx, tournamentId);
  if (!canManage) throw new Error("You do not have permission to manage this tournament");
}

export async function getCategoryTournamentId(ctx: QueryCtx, categoryId: Id<"categories">) {
  const category = await ctx.db.get(categoryId);
  return category?.tournamentId ?? null;
}

export async function deleteTournamentCascade(ctx: MutationCtx, tournamentId: Id<"tournaments">) {
  const categories = await ctx.db
    .query("categories")
    .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
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

  await ctx.db.delete(tournamentId);
}
