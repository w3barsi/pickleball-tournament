import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";

import { CategoriesSection } from "@/components/tournaments/categories-section";
import { LiveMatchesSection } from "@/components/tournaments/live-matches-section";
import { ParticipantsSection } from "@/components/tournaments/participants-section";
import { TournamentHeader } from "@/components/tournaments/tournament-header";

export const Route = createFileRoute("/_auth/app/tournaments/$slug/")({
  component: TournamentDetailPage,
  loader: async ({ params, context }) => {
    const tournament = await context.queryClient.ensureQueryData(
      convexQuery(api.app.tournaments.getBySlug, { slug: params.slug }),
    );

    if (!tournament) throw notFound();

    return { tournamentId: tournament._id };
  },
  notFoundComponent: () => <div>Tournament not found</div>,
});

function TournamentDetailPage() {
  const { slug } = Route.useParams();
  const { tournamentId } = Route.useLoaderData();
  const { data: tournament, isLoading } = useQuery(
    convexQuery(api.app.tournaments.getBySlug, { slug }),
  );

  if (isLoading || !tournament) {
    return (
      <div className="py-20 text-center">
        <Loader2Icon className="mx-auto size-10 animate-spin text-slate-400" />
        <p className="mt-4 text-lg font-bold text-slate-500">Loading tournament...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <TournamentHeader tournament={tournament} />
      <LiveMatchesSection tournamentId={tournamentId} />
      <CategoriesSection slug={slug} tournamentId={tournamentId} />
      <ParticipantsSection tournamentId={tournamentId} />
    </div>
  );
}
