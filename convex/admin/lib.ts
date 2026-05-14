import { customQuery, customMutation, customCtx } from "convex-helpers/server/customFunctions";

import { query, mutation } from "../_generated/server";
import { authComponent } from "../auth";

export const adminQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Authentication required");
    if (user.role !== "admin") throw new Error("Admin access required");
    return { user };
  }),
);

export const adminMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Authentication required");
    if (user.role !== "admin") throw new Error("Admin access required");
    return { user };
  }),
);
