import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ActivityIcon, ChevronRightIcon, MapPinIcon, TrophyIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface PublicTournamentLiveGamesProps {
  tournamentId: Id<"tournaments">;
}

export function PublicTournamentLiveGames({ tournamentId }: PublicTournamentLiveGamesProps) {
  const { data: liveGames } = useQuery(
    convexQuery(api.public.games.getLiveGames, { tournamentId }),
  );

  if (!liveGames || liveGames.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-2">
          <ActivityIcon className="size-5 text-amber-500" />
          <h2 className="font-heading text-2xl font-bold tracking-tight">Live Games</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Currently in progress matches</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {liveGames.map((game) => (
          <Link
            key={game.match._id}
            to="/score/$matchId"
            params={{ matchId: game.match._id }}
            className="block cursor-pointer"
          >
            <LiveGameCard game={game} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function LiveGameCard({
  game,
}: {
  game: {
    match: {
      _id: string;
      courtNumber?: number;
      status: string;
      isLive?: boolean;
    };
    bracket: {
      name: string;
      label?: string;
    } | null;
    category: {
      name: string;
      type: string;
      rating: string;
      category: string;
    } | null;
    participant1: {
      player?: { fullName: string } | null;
      pair?: { teamName?: string } | null;
      playerOne?: { fullName: string } | null;
      playerTwo?: { fullName: string } | null;
    } | null;
    participant2: {
      player?: { fullName: string } | null;
      pair?: { teamName?: string } | null;
      playerOne?: { fullName: string } | null;
      playerTwo?: { fullName: string } | null;
    } | null;
    categoryType: "singles" | "doubles";
    currentSet: {
      team1Score: number;
      team2Score: number;
      targetScore: number;
      setNumber: number;
    } | null;
    team1SetWins: number;
    team2SetWins: number;
    numberOfSets: number;
  };
}) {
  const team1Name = getParticipantName(game.participant1, game.categoryType);
  const team2Name = getParticipantName(game.participant2, game.categoryType);

  return (
    <Card className="group overflow-hidden bg-amber-50/30 ring-amber-500/50 transition-all hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
              Live
            </span>
          </div>
          <div className="flex items-center gap-2">
            {game.match.courtNumber !== undefined && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPinIcon className="size-3" />
                Court {game.match.courtNumber}
              </span>
            )}
            <ChevronRightIcon className="size-4 text-amber-500 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {game.category && (
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium">
              {game.category.name}
            </span>
          )}
          {game.bracket && (
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium">
              {game.bracket.name}
              {game.bracket.label && ` — ${game.bracket.label}`}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Team 1 */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{team1Name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-lg font-bold tabular-nums">
              {game.currentSet ? game.currentSet.team1Score : 0}
            </span>
            <span className="text-xs text-muted-foreground">({game.team1SetWins})</span>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">VS</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Team 2 */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{team2Name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-lg font-bold tabular-nums">
              {game.currentSet ? game.currentSet.team2Score : 0}
            </span>
            <span className="text-xs text-muted-foreground">({game.team2SetWins})</span>
          </div>
        </div>

        {/* Set info */}
        {game.currentSet && (
          <div className="flex items-center justify-center gap-1 rounded-lg bg-background/60 py-1.5 text-xs text-muted-foreground">
            <TrophyIcon className="size-3" />
            Set {game.currentSet.setNumber} of {game.numberOfSets} — race to{" "}
            {game.currentSet.targetScore}
          </div>
        )}

        {/* View score link */}
        <div className="flex items-center justify-center gap-1 border-t border-amber-200/40 pt-3 text-xs font-medium text-amber-600 transition-colors group-hover:text-amber-700">
          <span>View Score</span>
          <ChevronRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </CardContent>
    </Card>
  );
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
