import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { api } from "../../../convex/_generated/api";

/**
 * This is the _auth layout, which enables 'protected routes'
 * for all child routes under _auth (e.g. _auth/app/*)
 *
 * The returned context from beforeLoad is also available to all child routes & loaders.
 */
export const Route = createFileRoute("/_auth")({
  component: Outlet,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(
      convexQuery(api.auth.getCurrentUser, {}),
    );
    if (!user) {
      throw redirect({ to: "/login" });
    }

    // return context for use in child routes & loaders
    return { user };
  },
});
