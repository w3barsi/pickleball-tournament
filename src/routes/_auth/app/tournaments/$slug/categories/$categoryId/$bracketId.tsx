import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_auth/app/tournaments/$slug/categories/$categoryId/$bracketId",
)({
  component: BracketLayout,
});

function BracketLayout() {
  return <Outlet />;
}
