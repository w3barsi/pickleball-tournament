import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/app/playerPairs")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_auth/app/playerPairs"!</div>;
}
