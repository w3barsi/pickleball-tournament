import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { RadioIcon, PlayIcon, ClockIcon, CheckCircle2Icon } from "lucide-react";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";

import { LiveMatchesEmpty, LiveMatchesFallback } from "./live-matches-fallback";

export function LiveMatchesSection({
  tournamentId,
  slug,
}: {
  tournamentId: Id<"tournaments">;
  slug: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <RadioIcon className="size-5 text-red-500" />
        <h2 className="text-lg font-bold">Live Matches</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Suspense fallback={<LiveMatchesFallback />}>
          <LiveMatchesSectionInner tournamentId={tournamentId} slug={slug} />
        </Suspense>
      </div>
    </section>
  );
}

export function LiveMatchesSectionInner({
  tournamentId,
  slug,
}: {
  tournamentId: Id<"tournaments">;
  slug: string;
}) {
  const { data: liveMatchIds } = useSuspenseQuery(
    convexQuery(api.app.matches.listLiveMatchIdsByTournament, { tournamentId }),
  );

  if (liveMatchIds.length === 0) {
    return (
      <>
        <LiveMatchesEmpty />
      </>
    );
  }

  return (
    <>
      {liveMatchIds.map((match) => (
        <LiveMatchCard key={match._id} matchId={match._id} slug={slug} />
      ))}
    </>
  );
}

export function LiveMatchesSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <RadioIcon className="size-5 text-red-500" />
        <h2 className="text-lg font-bold">Live Matches</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function LiveMatchCard({ matchId, slug }: { matchId: Id<"matches">; slug: string }) {
  const navigate = useNavigate();
  const { data: match } = useSuspenseQuery(
    convexQuery(api.app.matches.getLiveMatchDetails, { matchId }),
  );

  if (!match) return null;

  return (
    <div
      className="cursor-pointer rounded-xl border border-red-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      onClick={() =>
        navigate({
          to: "/app/tournaments/$slug/categories/$categoryId/matches/$matchId",
          params: {
            slug,
            categoryId: match.category?._id ?? "",
            matchId: match._id,
          },
        })
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {match.category?.name ?? "Category"} · {match.bracket?.name ?? "Bracket"}
          {!match.courtNumber && <> · Court {match.courtNumber}</>}
        </span>
        {getMatchStatusBadge(match.status, match.isLive)}
      </div>
      <div className="mt-3 grid grid-cols-3 items-center justify-between">
        <span className="font-medium">
          {getParticipantName(match.participant1, match.category?.type ?? "singles")}
        </span>
        <span className="text-center text-xs text-muted-foreground">vs</span>
        <span className="text-right font-medium">
          {getParticipantName(match.participant2, match.category?.type ?? "singles")}
        </span>
      </div>
      <div className="mt-2 text-center font-mono text-2xl font-bold">{formatMatchScore(match)}</div>
    </div>
  );
}

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

function lastName(fullName: string | null | undefined) {
  if (!fullName) return "Unknown";
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
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
    return lastName(participant.player?.fullName);
  }
  if (participant.pair?.teamName) {
    return `${participant.pair.teamName} (${lastName(participant.playerOne?.fullName)} / ${lastName(participant.playerTwo?.fullName)})`;
  }
  return `${lastName(participant.playerOne?.fullName)} / ${lastName(participant.playerTwo?.fullName)}`;
}

function formatMatchScore(match: {
  matchSets: {
    setNumber: number;
    team1Score: number;
    team2Score: number;
    winnerTeam?: 1 | 2 | null;
    status: string;
  }[];
  status: string;
  winnerParticipantId?: Id<"categoryParticipants"> | null;
}) {
  const completedSets = match.matchSets.filter((s) => s.status === "completed");
  const inProgressSet = match.matchSets.find((s) => s.status === "inProgress");

  const p1Wins = completedSets.filter((s) => s.winnerTeam === 1).length;
  const p2Wins = completedSets.filter((s) => s.winnerTeam === 2).length;

  if (completedSets.length === 0 && !inProgressSet) {
    if (match.status === "completed" && match.winnerParticipantId) return "W - L";
    return "—";
  }

  const setWins = `${p1Wins} - ${p2Wins}`;
  if (inProgressSet) {
    return (
      <div className="flex w-full flex-col">
        <div className="flex flex-col text-sm text-muted-foreground">
          <span>{setWins}</span>
          <span className="-mt-2">Set/s won</span>
        </div>
        <span className="">
          {inProgressSet.team1Score} – {inProgressSet.team2Score}
        </span>
      </div>
    );
  }

  return setWins;
}
