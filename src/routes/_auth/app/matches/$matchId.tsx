import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  Loader2Icon,
  ChevronLeftIcon,
  SwordsIcon,
  ClockIcon,
  PlayIcon,
  CheckCircle2Icon,
  TrophyIcon,
  MapPinIcon,
  UserCheckIcon,
  StickyNoteIcon,
  ArrowRightIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { EditMatchDialog } from "@/components/tournaments/edit-match-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/app/matches/$matchId")({
  component: MatchDetailPage,
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.app.matches.getWithDetails, {
        matchId: params.matchId as Id<"matches">,
      }),
    );
  },
});

function getStatusBadge(status: string) {
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
    return (
      <span>
        {participant.pair.teamName}{" "}
        <span className="text-sm text-muted-foreground">
          ({participant.playerOne?.fullName ?? "Unknown"} /{" "}
          {participant.playerTwo?.fullName ?? "Unknown"})
        </span>
      </span>
    );
  }
  return `${participant.playerOne?.fullName ?? "Unknown"} / ${participant.playerTwo?.fullName ?? "Unknown"}`;
}

function formatDate(ts: number | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function MatchDetailPage() {
  const { matchId } = Route.useParams();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const { data: matchData } = useQuery(
    convexQuery(api.app.matches.getWithDetails, { matchId: matchId as Id<"matches"> }),
  );

  const startMatchMutation = useMutation(api.app.scoring.startMatch);
  const startNextSetMutation = useMutation(api.app.scoring.startNextSet);

  if (!matchData) {
    return (
      <div className="py-20 text-center">
        <Loader2Icon className="mx-auto size-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-lg font-bold text-muted-foreground">Loading match...</p>
      </div>
    );
  }

  const {
    match,
    bracket,
    category,
    tournament: matchTournament,
    participant1,
    participant2,
    matchSets,
  } = matchData;

  const isP1Winner = match.winnerParticipantId === match.participant1Id;
  const isP2Winner = match.winnerParticipantId === match.participant2Id;
  const p1Wins = matchSets.filter((s) => s.winnerTeam === 1).length;
  const p2Wins = matchSets.filter((s) => s.winnerTeam === 2).length;

  const handleStartAndGoToScorer = async () => {
    setIsStarting(true);
    try {
      await startMatchMutation({ matchId: matchId as Id<"matches"> });
      navigate({
        to: "/g/$id",
        params: { id: matchId },
        search: { setNumber: 1 },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start match");
      setIsStarting(false);
    }
  };

  const handleStartNextSet = async (nextSetNumber: number) => {
    setIsStarting(true);
    try {
      await startNextSetMutation({ matchId: matchId as Id<"matches"> });
      navigate({
        to: "/g/$id",
        params: { id: matchId },
        search: { setNumber: nextSetNumber },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start next set");
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back Link */}
      <div>
        <Button
          variant="ghost"
          nativeButton={false}
          render={
            <Link
              to="/app/brackets/$bracketId"
              params={{ bracketId: bracket?._id ?? "" }}
              className="flex items-center gap-1 text-muted-foreground"
            >
              <ChevronLeftIcon className="size-4" />
              Back to Bracket
            </Link>
          }
        />
      </div>

      {/* Header */}
      <HeaderCard>
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-3">
            <HeaderCardHeading>
              Match
              {match.matchOrder ? ` · M${match.matchOrder}` : ""}
            </HeaderCardHeading>
            {getStatusBadge(match.status)}
          </div>
          <HeaderCardDescription>
            {matchTournament?.name ?? "Tournament"} · {category?.name ?? "Category"} ·{" "}
            {bracket?.name ?? "Bracket"}
          </HeaderCardDescription>
        </div>

        {/* Matchup */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="text-right">
              <div className="max-w-[140px] text-base leading-tight font-bold text-white md:max-w-[200px] md:text-lg">
                {category?.type === "singles"
                  ? (participant1?.player?.fullName ?? "TBD")
                  : (participant1?.pair?.teamName ??
                    `${participant1?.playerOne?.fullName ?? "Unknown"} / ${participant1?.playerTwo?.fullName ?? "Unknown"}`)}
              </div>
              {isP1Winner && (
                <div className="flex items-center justify-end gap-1 text-xs font-semibold text-lime-300">
                  <TrophyIcon className="size-3" />
                  Winner
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono text-xl font-black text-white md:text-2xl">
              {match.status === "scheduled" ? (
                <span className="text-sm font-medium text-white/70">vs</span>
              ) : (
                <>
                  <span className={isP1Winner ? "text-lime-300" : ""}>{p1Wins}</span>
                  <span className="text-white/50">—</span>
                  <span className={isP2Winner ? "text-lime-300" : ""}>{p2Wins}</span>
                </>
              )}
            </div>

            <div className="text-left">
              <div className="max-w-[140px] text-base leading-tight font-bold text-white md:max-w-[200px] md:text-lg">
                {category?.type === "singles"
                  ? (participant2?.player?.fullName ?? "TBD")
                  : (participant2?.pair?.teamName ??
                    `${participant2?.playerOne?.fullName ?? "Unknown"} / ${participant2?.playerTwo?.fullName ?? "Unknown"}`)}
              </div>
              {isP2Winner && (
                <div className="flex items-center gap-1 text-xs font-semibold text-lime-300">
                  <TrophyIcon className="size-3" />
                  Winner
                </div>
              )}
            </div>
          </div>

          {/* Quick metadata */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-white/70">
            {match.courtNumber && <span>Court {match.courtNumber}</span>}
            {match.courtNumber && <span>·</span>}
            <span>
              {bracket?.numberOfSets ?? 3} {bracket?.numberOfSets === 1 ? "set" : "sets"}
            </span>
            <span>·</span>
            <span>
              {bracket?.pointsPerGame ?? 11} pts
              {bracket?.winByTwo ? " (win by 2)" : ""}
            </span>
            {match.scheduledAt && (
              <>
                <span>·</span>
                <span>
                  {new Date(match.scheduledAt).toLocaleDateString()}{" "}
                  {new Date(match.scheduledAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">{match && <EditMatchDialog match={match} />}</div>
      </HeaderCard>

      {/* Match Score Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={isP1Winner ? "border-2 border-green-400" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Participant 1
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl font-bold">
              {getParticipantName(participant1, category?.type ?? "singles")}
            </div>
            {isP1Winner && (
              <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                <TrophyIcon className="size-4" />
                Winner
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={isP2Winner ? "border-2 border-green-400" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Participant 2
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl font-bold">
              {getParticipantName(participant2, category?.type ?? "singles")}
            </div>
            {isP2Winner && (
              <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                <TrophyIcon className="size-4" />
                Winner
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Score / Sets */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <SwordsIcon className="size-5 text-tournament-lime" />
          <CardTitle className="text-base font-medium">Score</CardTitle>
        </CardHeader>
        <CardContent>
          {match.status === "scheduled" ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <p className="text-lg font-bold text-primary uppercase">Match Scheduled</p>
              <p className="text-sm text-muted-foreground">Start the match to begin scoring</p>
              <Button
                className="mt-2 gap-2"
                onClick={handleStartAndGoToScorer}
                disabled={isStarting}
              >
                {isStarting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <PlayIcon className="size-4" />
                )}
                Start Match & Go to Scorer
              </Button>
            </div>
          ) : matchSets.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4 text-3xl font-black">
                <span className={isP1Winner ? "text-green-600" : ""}>{p1Wins}</span>
                <span className="text-muted-foreground">—</span>
                <span className={isP2Winner ? "text-green-600" : ""}>{p2Wins}</span>
              </div>
              <div className="space-y-1">
                {matchSets.map((set) => {
                  const isActive = set.status === "inProgress";
                  return (
                    <Link
                      key={set._id}
                      to="/g/$id"
                      params={{ id: matchId }}
                      search={{ setNumber: set.setNumber }}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-muted",
                        isActive && "border-primary bg-primary/5",
                      )}
                    >
                      <span className="font-medium text-muted-foreground">Set {set.setNumber}</span>
                      <div className="flex items-center gap-3 font-mono text-base font-semibold">
                        <span className={set.winnerTeam === 1 ? "text-green-600" : ""}>
                          {set.team1Score}
                        </span>
                        <span className="text-muted-foreground">—</span>
                        <span className={set.winnerTeam === 2 ? "text-green-600" : ""}>
                          {set.team2Score}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Score" : "View"}
                        </Badge>
                        <ArrowRightIcon className="size-4 text-muted-foreground" />
                      </div>
                    </Link>
                  );
                })}
              </div>
              {match.status === "inProgress" &&
                !matchSets.some((s) => s.status === "inProgress") && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <p className="text-sm text-muted-foreground">
                      Start the next set to continue scoring
                    </p>
                    <Button
                      className="gap-2"
                      onClick={() =>
                        handleStartNextSet(
                          matchSets.filter((s) => s.status === "completed").length + 1,
                        )
                      }
                      disabled={isStarting}
                    >
                      {isStarting ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <PlayIcon className="size-4" />
                      )}
                      Start Set {matchSets.filter((s) => s.status === "completed").length + 1} & Go
                      to Scorer
                    </Button>
                  </div>
                )}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">No sets recorded yet.</div>
          )}
        </CardContent>
      </Card>

      {/* Match Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <MapPinIcon className="size-5 text-tournament-lime" />
            <CardTitle className="text-base font-medium">Scheduling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Court</span>
              <span className="font-medium">
                {match.courtNumber ? `Court ${match.courtNumber}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scheduled</span>
              <span className="font-medium">{formatDate(match.scheduledAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started</span>
              <span className="font-medium">{formatDate(match.startedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium">{formatDate(match.completedAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <UserCheckIcon className="size-5 text-tournament-lime" />
            <CardTitle className="text-base font-medium">Officiating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Referee</span>
              <span className="font-medium">{match.refereeName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format</span>
              <span className="font-medium">
                {bracket?.numberOfSets ?? 3} {bracket?.numberOfSets === 1 ? "set" : "sets"} ·{" "}
                {bracket?.pointsPerGame ?? 11} points
                {bracket?.winByTwo ? " (win by 2)" : " (win at target)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">{formatDate(match.lastUpdatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {match.matchNotes && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <StickyNoteIcon className="size-5 text-tournament-lime" />
            <CardTitle className="text-base font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{match.matchNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
