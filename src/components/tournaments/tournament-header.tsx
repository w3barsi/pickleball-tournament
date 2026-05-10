import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Doc } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarIcon,
  MapPinIcon,
  LayoutGridIcon,
  TrophyIcon,
  SwordsIcon,
  UsersIcon,
} from "lucide-react";

import { TournamentSettingsDialog } from "@/components/tournaments/tournament-settings-dialog";

function formatDate(ts: number | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TournamentHeader({ tournament }: { tournament: Doc<"tournaments"> }) {
  const { data: categories } = useQuery(
    convexQuery(api.categories.listByTournament, { tournamentId: tournament._id }),
  );
  const { data: brackets } = useQuery(
    convexQuery(api.brackets.listByTournament, { tournamentId: tournament._id }),
  );
  const { data: categoryParticipants } = useQuery(
    convexQuery(api.categoryParticipants.listByTournament, { tournamentId: tournament._id }),
  );
  const { data: liveMatches } = useQuery(
    convexQuery(api.matches.listLiveMatchIdsByTournament, { tournamentId: tournament._id }),
  );

  const totalParticipants =
    categoryParticipants?.reduce((sum, cp) => sum + cp.participants.length, 0) ?? 0;
  const totalBrackets = brackets?.length ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-blue-600 px-6 py-8 lg:px-10">
      <div className="pointer-events-none absolute -top-10 -right-10 z-0 h-32 w-32 rounded-full bg-lime-400 opacity-30" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white opacity-10" />

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {tournament.name}
          </h1>
          <p className="mt-1 text-sm font-medium text-white/80">
            Organized by {tournament.organizerName}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/90">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="size-4" />
              <span>{formatDate(tournament.date)}</span>
              {tournament.endDate && <span>– {formatDate(tournament.endDate)}</span>}
            </div>
            <span className="hidden text-white/40 sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="size-4" />
              <span>{tournament.venueName ?? "No venue set"}</span>
            </div>
            <span className="hidden text-white/40 sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <LayoutGridIcon className="size-4" />
              <span>{categories?.length ?? 0} categories</span>
            </div>
            <span className="hidden text-white/40 sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <TrophyIcon className="size-4" />
              <span>{totalBrackets} brackets</span>
            </div>
            <span className="hidden text-white/40 sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <SwordsIcon className="size-4" />
              <span>{liveMatches?.length ?? 0} live</span>
            </div>
            <span className="hidden text-white/40 sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <UsersIcon className="size-4" />
              <span>{totalParticipants} participants</span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <TournamentSettingsDialog
            tournamentId={tournament._id}
            tournamentName={tournament.name}
          />
        </div>
      </div>
    </div>
  );
}
