import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/app/tournaments/$slug")({
  component: TournamentDetailPage,
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.tournaments.getBySlug, { slug: params.slug }),
    );
  },
});

function TournamentDetailPage() {
  const { slug } = Route.useParams();
  const { data: tournament } = useQuery(convexQuery(api.tournaments.getBySlug, { slug }));

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-tournament-blue px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-tournament-lime opacity-20" />

        <div className="relative z-10">
          <h1 className="text-4xl leading-none font-black tracking-tight text-tournament-lime uppercase italic [text-shadow:3px_3px_0px_rgba(0,0,0,0.25)] sm:text-5xl">
            {tournament?.name ?? "TOURNAMENT"}
          </h1>
          <p className="mt-3 text-sm font-bold tracking-[0.2em] text-white/90 uppercase">
            {tournament ? `Organized by ${tournament.organizerName}` : slug}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border-4 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <p className="text-xl font-black text-slate-400 uppercase">
          Tournament Details Coming Soon
        </p>
        <p className="mt-2 text-sm text-slate-500">
          This page will show categories, brackets, and matches for this tournament.
        </p>
      </div>
    </div>
  );
}
