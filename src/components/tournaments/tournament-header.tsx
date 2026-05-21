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

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
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
    convexQuery(api.app.categories.listByTournament, { tournamentId: tournament._id }),
  );
  const { data: brackets } = useQuery(
    convexQuery(api.app.brackets.listByTournament, { tournamentId: tournament._id }),
  );
  const { data: categoryParticipants } = useQuery(
    convexQuery(api.app.categoryParticipants.listByTournament, { tournamentId: tournament._id }),
  );
  const { data: liveMatches } = useQuery(
    convexQuery(api.app.matches.listLiveMatchIdsByTournament, { tournamentId: tournament._id }),
  );

  const totalParticipants =
    categoryParticipants?.reduce((sum, cp) => sum + cp.participants.length, 0) ?? 0;
  const totalBrackets = brackets?.length ?? 0;

  return (
    <HeaderCard>
      <div>
        <HeaderCardHeading>{tournament.name}</HeaderCardHeading>
        <HeaderCardDescription>Organized by {tournament.organizerName}</HeaderCardDescription>

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

      <TournamentSettingsDialog tournament={tournament} />
    </HeaderCard>
  );
}
