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
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-3" />
            {formatDate(tournament.date)}
            {tournament.endDate && ` – ${formatDate(tournament.endDate)}`}
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1">
            <MapPinIcon className="size-3" />
            {tournament.venueName ?? "No venue set"}
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1">
            <LayoutGridIcon className="size-3" />
            {categories?.length ?? 0} categories
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1">
            <TrophyIcon className="size-3" />
            {totalBrackets} brackets
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1">
            <SwordsIcon className="size-3" />
            {liveMatches?.length ?? 0} live
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1">
            <UsersIcon className="size-3" />
            {totalParticipants} participants
          </span>
        </p>
      </div>
      <TournamentSettingsDialog tournament={tournament} />
    </HeaderCard>
  );
}
