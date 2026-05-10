import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { RadioIcon, PlayIcon, ClockIcon, CheckCircle2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

function getMatchStatusBadge(status: string, isLive?: boolean | null) {
  if (isLive) {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
        <RadioIcon className="mr-1 size-3" />
        Live
      </Badge>
    );
  }
  switch (status) {
    case "inProgress":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          <PlayIcon className="mr-1 size-3" />
          Live
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2Icon className="mr-1 size-3" />
          Completed
        </Badge>
      );
    case "abandoned":
      return <Badge variant="destructive">Abandoned</Badge>;
    default:
      return (
        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
          <ClockIcon className="mr-1 size-3" />
          Scheduled
        </Badge>
      );
  }
}

function getParticipantName(
  participant: {
    player?: { fullName: string } | null;
    pair?: { teamName?: string } | null;
    playerOne?: { fullName: string } | null;
    playerTwo?: { fullName: string } | null;
  } | null,
  categoryType: "singles" | "doubles",
) {
  if (!participant) return "TBD";
  if (categoryType === "singles") {
    return participant.player?.fullName ?? "Unknown";
  }
  if (participant.pair?.teamName) {
    return `${participant.pair.teamName} (${participant.playerOne?.fullName ?? "Unknown"} / ${participant.playerTwo?.fullName ?? "Unknown"})`;
  }
  return `${participant.playerOne?.fullName ?? "Unknown"} / ${participant.playerTwo?.fullName ?? "Unknown"}`;
}

function getMatchScore(match: {
  matchSets: { winnerTeam?: 1 | 2 | null }[];
  status: string;
  winnerParticipantId?: Id<"categoryParticipants"> | null;
}) {
  if (match.matchSets.length > 0) {
    const p1Wins = match.matchSets.filter((s) => s.winnerTeam === 1).length;
    const p2Wins = match.matchSets.filter((s) => s.winnerTeam === 2).length;
    return `${p1Wins} - ${p2Wins}`;
  }
  if (match.status === "completed" && match.winnerParticipantId) {
    return "W - L";
  }
  return "—";
}

export function LiveMatchesSection({ tournamentId }: { tournamentId: Id<"tournaments"> }) {
  const navigate = useNavigate();
  const { data: liveMatches } = useQuery(
    convexQuery(api.matches.listLiveByTournament, { tournamentId }),
  );

  if (!liveMatches || liveMatches.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <RadioIcon className="size-5 text-red-500" />
        <h2 className="text-lg font-bold">Live Matches</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {liveMatches.map((match) => (
          <div
            key={match._id}
            className="cursor-pointer rounded-xl border border-red-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            onClick={() =>
              navigate({ to: "/app/matches/$matchId", params: { matchId: match._id } })
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {match.category?.name ?? "Category"} · {match.bracket?.name ?? "Bracket"}
              </span>
              {getMatchStatusBadge(match.status, match.isLive)}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-medium">
                {getParticipantName(match.participant1, match.category?.type ?? "singles")}
              </span>
              <span className="text-xs text-muted-foreground">vs</span>
              <span className="text-right font-medium">
                {getParticipantName(match.participant2, match.category?.type ?? "singles")}
              </span>
            </div>
            <div className="mt-2 text-center font-mono text-2xl font-bold">
              {getMatchScore(match)}
            </div>
            {match.courtNumber && (
              <p className="mt-1 text-center text-xs text-muted-foreground">
                Court {match.courtNumber}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
