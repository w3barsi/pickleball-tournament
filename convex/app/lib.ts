import { customQuery, customMutation, customCtx } from "convex-helpers/server/customFunctions";

import { Id } from "../_generated/dataModel";
import { query, mutation, QueryCtx } from "../_generated/server";
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
