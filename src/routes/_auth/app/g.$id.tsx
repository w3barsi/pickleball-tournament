import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  RotateCcwIcon,
  TrophyIcon,
  UserIcon,
  HistoryIcon,
  ArrowLeftIcon,
  RadioIcon,
  PlayIcon,
} from "lucide-react";
import { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/app/g/$id")({
  component: MatchDetailPage,
  loader: async (ctx) => {
    const matchId = ctx.params.id as Id<"matches">;
    await ctx.context.queryClient.ensureQueryData(
      convexQuery(api.scoring.getMatchWithHistory, { matchId }),
    );
  },
});

function MatchDetailPage() {
  const { id } = Route.useParams();
  const matchId = id as Id<"matches">;
  const navigate = useNavigate();

  const matchData = useQuery(convexQuery(api.scoring.getMatchWithHistory, { matchId }));

  const recordPointMutation = useMutation(api.scoring.recordPoint);
  const undoPointMutation = useMutation(api.scoring.undoLastPoint);
  const updateTargetScoreMutation = useMutation(api.scoring.updateTargetScore);
  const setMatchLiveMutation = useMutation(api.scoring.setMatchLive);
  const startMatchMutation = useMutation(api.scoring.startMatch);

  const [showHistory, setShowHistory] = useState(false);

  // Local state for team names (display only for now)
  const [localTeam1Name, setLocalTeam1Name] = useState("Team 1");
  const [localTeam2Name, setLocalTeam2Name] = useState("Team 2");

  // Sync local state with server data
  const match = matchData.data?.match;
  const points = matchData.data?.points ?? [];

  const recordPoint = recordPointMutation.withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.scoring.getMatchWithHistory, { matchId });
    if (!current?.match) return;

    const match = current.match;
    const pointWinner = args.pointWinner as 1 | 2;

    // Calculate new state
    let newState = { ...match };

    if (pointWinner === match.servingTeam) {
      if (match.servingTeam === 1) {
        newState.team1Score += 1;
      } else {
        newState.team2Score += 1;
      }

      // Check win condition
      if (
        newState.team1Score >= newState.targetScore &&
        newState.team1Score >= newState.team2Score + 2
      ) {
        newState.status = "completed";
        newState.winnerParticipantId = match.participant1Id;
      } else if (
        newState.team2Score >= newState.targetScore &&
        newState.team2Score >= newState.team1Score + 2
      ) {
        newState.status = "completed";
        newState.winnerParticipantId = match.participant2Id;
      }

      newState.isFirstServe = false;
    } else {
      if (match.isFirstServe) {
        newState.servingTeam = match.servingTeam === 1 ? 2 : 1;
        newState.serverNumber = 2;
        newState.isFirstServe = false;
      } else {
        if (match.serverNumber === 1) {
          newState.serverNumber = 2;
        } else {
          newState.servingTeam = match.servingTeam === 1 ? 2 : 1;
          newState.serverNumber = 1;
        }
      }
    }

    localStore.setQuery(
      api.scoring.getMatchWithHistory,
      { matchId },
      {
        ...current,
        match: newState,
      },
    );
  });

  const undoPoint = undoPointMutation.withOptimisticUpdate((localStore) => {
    const current = localStore.getQuery(api.scoring.getMatchWithHistory, { matchId });
    if (!current?.match || current.points.length === 0) return;

    const lastPoint = current.points[0];
    const newState = {
      ...current.match,
      team1Score: lastPoint.team1Score,
      team2Score: lastPoint.team2Score,
      servingTeam: lastPoint.servingTeam,
      serverNumber: lastPoint.serverNumber,
      isFirstServe: lastPoint.isFirstServe,
      status: "inProgress" as const,
      winnerParticipantId: undefined,
    };

    localStore.setQuery(
      api.scoring.getMatchWithHistory,
      { matchId },
      {
        match: newState,
        points: current.points.slice(1),
      },
    );
  });

  const handlePoint = useCallback(
    async (winningTeam: 1 | 2) => {
      if (match?.status !== "inProgress") return;
      await recordPoint({ matchId, pointWinner: winningTeam });
    },
    [matchId, match?.status, recordPoint],
  );

  const handleUndo = useCallback(async () => {
    if (points.length === 0) return;
    await undoPoint({ matchId });
  }, [matchId, points.length, undoPoint]);

  const handleTargetScoreChange = useCallback(
    (value: string) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 1) {
        updateTargetScoreMutation({ matchId, targetScore: num });
      }
    },
    [matchId, updateTargetScoreMutation],
  );

  const getScoreAnnouncement = useCallback(() => {
    if (!match) return "";
    const servingScore = match.servingTeam === 1 ? match.team1Score : match.team2Score;
    const receivingScore = match.servingTeam === 1 ? match.team2Score : match.team1Score;
    return `${servingScore}-${receivingScore}-${match.serverNumber}`;
  }, [match]);

  const handleStartMatch = useCallback(async () => {
    await startMatchMutation({ matchId });
  }, [matchId, startMatchMutation]);

  if (!match) {
    return <div className="py-12 text-center text-muted-foreground">Loading match...</div>;
  }

  const isGameOver = match.status === "completed";
  const isInProgress = match.status === "inProgress";
  const isScheduled = match.status === "scheduled";

  const handleGoLive = useCallback(async () => {
    await setMatchLiveMutation({ matchId });
  }, [matchId, setMatchLiveMutation]);

  // Determine winner for display
  const team1Wins = match.winnerParticipantId === match.participant1Id;
  const team2Wins = match.winnerParticipantId === match.participant2Id;

  return (
    <div className="mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate({ to: "/app/games" })} className="gap-1">
          <ArrowLeftIcon className="size-4" />
          Back to Matches
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {localTeam1Name} vs {localTeam2Name}
        </h1>
        <div className="flex gap-2">
          {isInProgress && (
            <Button
              variant="outline"
              onClick={handleUndo}
              disabled={points.length === 0}
              className="gap-1"
            >
              <RotateCcwIcon className="size-4" />
              Undo
            </Button>
          )}
          <Button
            variant={match.isLive ? "default" : "outline"}
            onClick={handleGoLive}
            className="gap-1"
          >
            <RadioIcon className="size-3" />
            {match.isLive ? "Live" : "Go Live"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-1"
          >
            <HistoryIcon className="size-4" />
            History
          </Button>
        </div>
      </div>

      {isScheduled && (
        <Card className="border-tournament-blue/40 border-4 border-dashed bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-tournament-blue text-lg font-bold uppercase">Match Scheduled</p>
            <p className="text-sm text-muted-foreground">Start the match to begin scoring</p>
            <Button className="mt-4 gap-2" onClick={handleStartMatch}>
              <PlayIcon className="size-4" />
              Start Match
            </Button>
          </CardContent>
        </Card>
      )}

      <Card
        className={cn(
          "text-primary-foreground",
          match.servingTeam === 1 ? "bg-orange-400" : "bg-blue-400",
        )}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-sm opacity-80">Score Call</div>
          <div className="text-5xl font-bold tracking-wider">{getScoreAnnouncement()}</div>
          <div className="mt-2 text-sm opacity-80">
            {match.servingTeam === 1 ? localTeam1Name : localTeam2Name} serving
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card
          className={cn(
            "relative overflow-hidden border-2 border-transparent transition-all",
            team1Wins
              ? "border-4 border-green-400"
              : match.servingTeam === 1
                ? "border-primary"
                : "",
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {match.servingTeam === 1 && (
                <div className="bg-ballgreen flex size-10 shrink-0 items-center justify-center rounded-full border-green-800/10 text-xs font-bold">
                  {match.serverNumber}
                </div>
              )}
              <span className="text-lg font-semibold">{localTeam1Name}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-7xl font-bold">{match.team1Score}</div>
            </div>
          </CardContent>
          {team1Wins && (
            <div className="absolute top-2 right-2">
              <TrophyIcon className="size-8 text-green-400" />
            </div>
          )}
        </Card>

        <Card
          className={cn(
            "relative overflow-hidden border-2 border-transparent transition-all",
            team2Wins
              ? "border-4 border-green-400"
              : match.servingTeam === 2
                ? "border-primary"
                : "",
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {match.servingTeam === 2 && (
                <div className="bg-ballgreen flex size-10 shrink-0 items-center justify-center rounded-full border-green-800/10 text-xs font-bold">
                  {match.serverNumber}
                </div>
              )}
              <span className="text-lg font-semibold">{localTeam2Name}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-7xl font-bold">{match.team2Score}</div>
            </div>
          </CardContent>
          {team2Wins && (
            <div className="absolute top-2 right-2">
              <TrophyIcon className="size-8 text-yellow-400" />
            </div>
          )}
        </Card>
      </div>

      {isInProgress && (
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            className="h-24 text-xl"
            onClick={() => handlePoint(1)}
            variant={match.servingTeam === 1 ? "default" : "outline"}
          >
            <div className="flex flex-col items-center gap-1">
              <span>{localTeam1Name} Wins Point</span>
              {match.servingTeam === 1 && <span className="text-xs opacity-80">+1 point</span>}
            </div>
          </Button>
          <Button
            size="lg"
            className="h-24 text-xl"
            onClick={() => handlePoint(2)}
            variant={match.servingTeam === 2 ? "default" : "outline"}
          >
            <div className="flex flex-col items-center gap-1">
              <span>{localTeam2Name} Wins Point</span>
              {match.servingTeam === 2 && <span className="text-xs opacity-80">+1 point</span>}
            </div>
          </Button>
        </div>
      )}

      {isGameOver && (
        <Card className="border-4 border-green-400 bg-yellow-50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <TrophyIcon className="mb-2 size-12 text-green-500" />
            <div className="text-2xl font-bold text-primary-foreground">
              {team1Wins ? localTeam1Name : localTeam2Name} Wins!
            </div>
            <div className="text-primary-foreground">
              Final Score: {match.team1Score} - {match.team2Score}
            </div>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => navigate({ to: "/app/games" })}
            >
              Back to Matches
            </Button>
          </CardContent>
        </Card>
      )}

      {(isInProgress || isScheduled) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Match Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="targetScore">Winning Score</Label>
              <Input
                id="targetScore"
                type="number"
                value={match.targetScore}
                onChange={(e) => handleTargetScoreChange(e.target.value)}
                className="w-20"
                min={1}
                disabled={isGameOver}
              />
              <span className="text-sm text-muted-foreground">(Win by 2)</span>
            </div>
          </CardContent>
        </Card>
      )}

      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {points.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">No points scored yet</div>
              ) : (
                points.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{points.length - idx}.</span>
                      <span className={entry.pointWinner === 1 ? "font-semibold text-primary" : ""}>
                        {localTeam1Name}: {entry.team1Score}
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className={entry.pointWinner === 2 ? "font-semibold text-primary" : ""}>
                        {localTeam2Name}: {entry.team2Score}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserIcon className="size-3" />
                      {entry.servingTeam === 1 ? localTeam1Name : localTeam2Name} (
                      {entry.serverNumber})
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
