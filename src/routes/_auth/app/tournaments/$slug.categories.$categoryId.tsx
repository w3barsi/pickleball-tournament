import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/app/tournaments/$slug/categories/$categoryId")({
  component: CategoryLayout,
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.tournaments.getBySlug, { slug: params.slug }),
    );
    await context.queryClient.ensureQueryData(
      convexQuery(api.categories.get, { categoryId: params.categoryId as Id<"categories"> }),
    );
  },
});

function CategoryLayout() {
  return <Outlet />;
}
