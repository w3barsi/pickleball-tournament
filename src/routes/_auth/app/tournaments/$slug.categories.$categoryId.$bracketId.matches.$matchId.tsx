import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  RadioIcon,
} from "lucide-react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { EditMatchDialog } from "@/components/tournaments/edit-match-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute(
  "/_auth/app/tournaments/$slug/categories/$categoryId/$bracketId/matches/$matchId",
)({
  component: MatchDetailPage,
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.matches.getWithDetails, {
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
  const { slug, categoryId, bracketId, matchId } = Route.useParams();
  const { data: matchData } = useQuery(
    convexQuery(api.matches.getWithDetails, { matchId: matchId as Id<"matches"> }),
  );
  const { data: tournament } = useQuery(convexQuery(api.tournaments.getBySlug, { slug }));
  const { data: canEdit } = useQuery(
    convexQuery(api.categories.canEdit, tournament ? { tournamentId: tournament._id } : "skip"),
  );

  if (!matchData) {
    return (
      <div className="py-20 text-center">
        <Loader2Icon className="mx-auto size-10 animate-spin text-slate-400" />
        <p className="mt-4 text-lg font-bold text-slate-500">Loading match...</p>
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

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Button
          variant="ghost"
          render={
            <Link
              to="/app/tournaments/$slug/categories/$categoryId/$bracketId"
              params={{ slug, categoryId, bracketId }}
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
        <div>
          <div className="mb-2 flex items-center gap-3">
            <HeaderCardHeading>
              Match {match.roundNumber ? `R${match.roundNumber}` : ""}
              {match.matchOrder ? ` · M${match.matchOrder}` : ""}
            </HeaderCardHeading>
            {getStatusBadge(match.status)}
          </div>
          <HeaderCardDescription>
            {matchTournament?.name ?? tournament?.name ?? "Tournament"} ·{" "}
            {category?.name ?? "Category"} · {bracket?.name ?? "Bracket"}
          </HeaderCardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            render={
              <Link to="/app/g/$id" params={{ id: matchId }}>
                <RadioIcon className="mr-1 size-4" />
                Go to Scorer
              </Link>
            }
          />
          {canEdit && match && <EditMatchDialog match={match} />}
        </div>
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
          <SwordsIcon className="text-tournament-lime size-5" />
          <CardTitle className="text-base font-medium">Score</CardTitle>
        </CardHeader>
        <CardContent>
          {matchSets.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4 text-3xl font-black">
                <span className={isP1Winner ? "text-green-600" : ""}>{p1Wins}</span>
                <span className="text-muted-foreground">—</span>
                <span className={isP2Winner ? "text-green-600" : ""}>{p2Wins}</span>
              </div>
              <div className="space-y-1">
                {matchSets.map((set) => (
                  <div
                    key={set._id}
                    className="flex items-center justify-between rounded-lg border px-4 py-2 text-sm"
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
                  </div>
                ))}
              </div>
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
            <MapPinIcon className="text-tournament-lime size-5" />
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
            <UserCheckIcon className="text-tournament-lime size-5" />
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
                {match.numberOfSets} {match.numberOfSets === 1 ? "set" : "sets"} ·{" "}
                {match.pointsPerGame} points
                {match.winByTwo ? " (win by 2)" : " (win at target)"}
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
            <StickyNoteIcon className="text-tournament-lime size-5" />
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
