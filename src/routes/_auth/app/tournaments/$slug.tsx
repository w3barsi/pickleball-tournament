import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/app/tournaments/$slug")({
  component: TournamentLayout,
});

function TournamentLayout() {
  return <Outlet />;
}
