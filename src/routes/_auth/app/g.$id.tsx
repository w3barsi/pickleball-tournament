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
} from "lucide-react";
import { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/app/g/$id")({
  component: GameDetailPage,
});

function GameDetailPage() {
  const { id } = Route.useParams();
  const gameId = id as Id<"pickleballGames">;
  const navigate = useNavigate();

  const gameData = useQuery(convexQuery(api.scoring.getGameWithHistory, { gameId }));

  const recordPointMutation = useMutation(api.scoring.recordPoint);
  const undoPointMutation = useMutation(api.scoring.undoLastPoint);
  const updateTeamNamesMutation = useMutation(api.scoring.updateTeamNames);
  const updateTargetScoreMutation = useMutation(api.scoring.updateTargetScore);
  const setGameLiveMutation = useMutation(api.scoring.setGameLive);

  const [showHistory, setShowHistory] = useState(false);

  // Local state for team names (optimistic)
  const [localTeam1Name, setLocalTeam1Name] = useState("");
  const [localTeam2Name, setLocalTeam2Name] = useState("");

  // Sync local state with server data
  const game = gameData.data?.game;
  const points = gameData.data?.points ?? [];

  // Update local names when data loads
  if (game && !localTeam1Name && !localTeam2Name) {
    setLocalTeam1Name(game.team1Name);
    setLocalTeam2Name(game.team2Name);
  }

  const recordPoint = recordPointMutation.withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.scoring.getGameWithHistory, { gameId });
    if (!current?.game) return;

    const game = current.game;
    const pointWinner = args.pointWinner as 1 | 2;

    // Calculate new state
    let newState = { ...game };

    if (pointWinner === game.servingTeam) {
      if (game.servingTeam === 1) {
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
        newState.winner = 1;
      } else if (
        newState.team2Score >= newState.targetScore &&
        newState.team2Score >= newState.team1Score + 2
      ) {
        newState.status = "completed";
        newState.winner = 2;
      }

      newState.isFirstServe = false;
    } else {
      if (game.isFirstServe) {
        newState.servingTeam = game.servingTeam === 1 ? 2 : 1;
        newState.serverNumber = 2;
        newState.isFirstServe = false;
      } else {
        if (game.serverNumber === 1) {
          newState.serverNumber = 2;
        } else {
          newState.servingTeam = game.servingTeam === 1 ? 2 : 1;
          newState.serverNumber = 1;
        }
      }
    }

    localStore.setQuery(
      api.scoring.getGameWithHistory,
      { gameId },
      {
        ...current,
        game: newState,
      },
    );
  });

  const undoPoint = undoPointMutation.withOptimisticUpdate((localStore) => {
    const current = localStore.getQuery(api.scoring.getGameWithHistory, { gameId });
    if (!current?.game || current.points.length === 0) return;

    const lastPoint = current.points[0];
    const newState = {
      ...current.game,
      team1Score: lastPoint.team1Score,
      team2Score: lastPoint.team2Score,
      servingTeam: lastPoint.servingTeam,
      serverNumber: lastPoint.serverNumber,
      isFirstServe: lastPoint.isFirstServe,
      status: "in_progress" as const,
      winner: undefined,
    };

    localStore.setQuery(
      api.scoring.getGameWithHistory,
      { gameId },
      {
        game: newState,
        points: current.points.slice(1),
      },
    );
  });

  const handlePoint = useCallback(
    async (winningTeam: 1 | 2) => {
      if (game?.status !== "in_progress") return;
      await recordPoint({ gameId, pointWinner: winningTeam });
    },
    [gameId, game?.status, recordPoint],
  );

  const handleUndo = useCallback(async () => {
    if (points.length === 0) return;
    await undoPoint({ gameId });
  }, [gameId, points.length, undoPoint]);

  const handleTeam1NameChange = useCallback(
    (value: string) => {
      setLocalTeam1Name(value);
      // Debounced save
      const timeoutId = setTimeout(() => {
        updateTeamNamesMutation({ gameId, team1Name: value });
      }, 500);
      return () => clearTimeout(timeoutId);
    },
    [gameId, updateTeamNamesMutation],
  );

  const handleTeam2NameChange = useCallback(
    (value: string) => {
      setLocalTeam2Name(value);
      const timeoutId = setTimeout(() => {
        updateTeamNamesMutation({ gameId, team2Name: value });
      }, 500);
      return () => clearTimeout(timeoutId);
    },
    [gameId, updateTeamNamesMutation],
  );

  const handleTargetScoreChange = useCallback(
    (value: string) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 1) {
        updateTargetScoreMutation({ gameId, targetScore: num });
      }
    },
    [gameId, updateTargetScoreMutation],
  );

  const getScoreAnnouncement = useCallback(() => {
    if (!game) return "";
    const servingScore = game.servingTeam === 1 ? game.team1Score : game.team2Score;
    const receivingScore = game.servingTeam === 1 ? game.team2Score : game.team1Score;
    return `${servingScore}-${receivingScore}-${game.serverNumber}`;
  }, [game]);

  if (!game) {
    return <div className="py-12 text-center text-muted-foreground">Loading game...</div>;
  }

  const isGameOver = game.status === "completed";
  const isInProgress = game.status === "in_progress";

  const handleGoLive = useCallback(async () => {
    await setGameLiveMutation({ gameId });
  }, [gameId, setGameLiveMutation]);

  return (
    <div className="mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/app/games" })}
          className="gap-1"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Games
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
              size="sm"
              onClick={handleUndo}
              disabled={points.length === 0}
              className="gap-1"
            >
              <RotateCcwIcon className="size-4" />
              Undo
            </Button>
          )}
          <Button
            variant={game.isLive ? "default" : "outline"}
            size="sm"
            onClick={handleGoLive}
            className="gap-1"
          >
            <RadioIcon className="size-4" />
            {game.isLive ? "Live" : "Go Live"}
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

      <Card
        className={cn(
          "text-primary-foreground",
          game.servingTeam === 1 ? "bg-orange-400" : "bg-blue-400",
        )}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-sm opacity-80">Score Call</div>
          <div className="text-5xl font-bold tracking-wider">{getScoreAnnouncement()}</div>
          <div className="mt-2 text-sm opacity-80">
            {game.servingTeam === 1 ? localTeam1Name : localTeam2Name} serving
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card
          className={cn(
            "relative overflow-hidden border-2 border-transparent transition-all",
            game.winner === 1
              ? "border-4 border-green-400"
              : game.servingTeam === 1
                ? "border-primary"
                : "",
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {game.servingTeam === 1 && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-green-800/10 bg-ballgreen text-xs font-bold">
                  {game.serverNumber}
                </div>
              )}
              <Input
                value={localTeam1Name}
                onChange={(e) => handleTeam1NameChange(e.target.value)}
                disabled={!isInProgress}
                className="h-8 border-0 bg-transparent p-0 text-lg font-semibold focus-visible:ring-0"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-7xl font-bold">{game.team1Score}</div>
            </div>
          </CardContent>
          {game.winner === 1 && (
            <div className="absolute top-2 right-2">
              <TrophyIcon className="size-8 text-green-400" />
            </div>
          )}
        </Card>

        <Card
          className={cn(
            "relative overflow-hidden border-2 border-transparent transition-all",
            game.winner === 2
              ? "border-4 border-green-400"
              : game.servingTeam === 2
                ? "border-primary"
                : "",
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {game.servingTeam === 2 && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-green-800/10 bg-ballgreen text-xs font-bold">
                  {game.serverNumber}
                </div>
              )}
              <Input
                value={localTeam2Name}
                onChange={(e) => handleTeam2NameChange(e.target.value)}
                disabled={!isInProgress}
                className="h-8 border-0 bg-transparent p-0 text-lg font-semibold focus-visible:ring-0"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-7xl font-bold">{game.team2Score}</div>
            </div>
          </CardContent>
          {game.winner === 2 && (
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
            variant={game.servingTeam === 1 ? "default" : "outline"}
          >
            <div className="flex flex-col items-center gap-1">
              <span>{localTeam1Name} Wins Point</span>
              {game.servingTeam === 1 && <span className="text-xs opacity-80">+1 point</span>}
            </div>
          </Button>
          <Button
            size="lg"
            className="h-24 text-xl"
            onClick={() => handlePoint(2)}
            variant={game.servingTeam === 2 ? "default" : "outline"}
          >
            <div className="flex flex-col items-center gap-1">
              <span>{localTeam2Name} Wins Point</span>
              {game.servingTeam === 2 && <span className="text-xs opacity-80">+1 point</span>}
            </div>
          </Button>
        </div>
      )}

      {isGameOver && (
        <Card className="border-4 border-green-400 bg-yellow-50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <TrophyIcon className="mb-2 size-12 text-green-500" />
            <div className="text-2xl font-bold text-primary-foreground">
              {game.winner === 1 ? localTeam1Name : localTeam2Name} Wins!
            </div>
            <div className="text-primary-foreground">
              Final Score: {game.team1Score} - {game.team2Score}
            </div>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => navigate({ to: "/app/games" })}
            >
              Back to Games
            </Button>
          </CardContent>
        </Card>
      )}

      {isInProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Game Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="targetScore">Winning Score</Label>
              <Input
                id="targetScore"
                type="number"
                value={game.targetScore}
                onChange={(e) => handleTargetScoreChange(e.target.value)}
                className="w-20"
                min={1}
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
