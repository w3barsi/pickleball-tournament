import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { RotateCcwIcon, TrophyIcon, UserIcon, HistoryIcon } from "lucide-react";
import { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  team1Score: number;
  team2Score: number;
  servingTeam: 1 | 2;
  serverNumber: 1 | 2;
  isFirstServe: boolean;
  pointWinner: 1 | 2;
  timestamp: number;
}

interface GameState {
  team1Score: number;
  team2Score: number;
  servingTeam: 1 | 2;
  serverNumber: 1 | 2;
  isFirstServe: boolean;
  targetScore: number;
  isGameOver: boolean;
  winner: 1 | 2 | null;
  history: HistoryEntry[];
}

const initialState: GameState = {
  team1Score: 0,
  team2Score: 0,
  servingTeam: 1,
  serverNumber: 2,
  isFirstServe: true,
  targetScore: 11,
  isGameOver: false,
  winner: null,
  history: [],
};

export const Route = createFileRoute("/_auth/app/scorer")({
  component: RouteComponent,
});

function RouteComponent() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [showHistory, setShowHistory] = useState(false);

  const getScoreAnnouncement = useCallback(() => {
    const servingScore = gameState.servingTeam === 1 ? gameState.team1Score : gameState.team2Score;
    const receivingScore =
      gameState.servingTeam === 1 ? gameState.team2Score : gameState.team1Score;
    return `${servingScore}-${receivingScore}-${gameState.serverNumber}`;
  }, [gameState]);

  const checkWinCondition = useCallback(
    (team1Score: number, team2Score: number, target: number) => {
      if (team1Score >= target && team1Score >= team2Score + 2) {
        return 1 as const;
      }
      if (team2Score >= target && team2Score >= team1Score + 2) {
        return 2 as const;
      }
      return null;
    },
    [],
  );

  const handlePoint = useCallback(
    (winningTeam: 1 | 2) => {
      if (gameState.isGameOver) return;

      setGameState((prev) => {
        const newHistory: HistoryEntry = {
          team1Score: prev.team1Score,
          team2Score: prev.team2Score,
          servingTeam: prev.servingTeam,
          serverNumber: prev.serverNumber,
          isFirstServe: prev.isFirstServe,
          pointWinner: winningTeam,
          timestamp: Date.now(),
        };

        let newState = { ...prev, history: [...prev.history, newHistory] };

        if (winningTeam === prev.servingTeam) {
          if (prev.servingTeam === 1) {
            newState.team1Score += 1;
          } else {
            newState.team2Score += 1;
          }

          const winner = checkWinCondition(
            newState.team1Score,
            newState.team2Score,
            prev.targetScore,
          );
          if (winner) {
            newState.isGameOver = true;
            newState.winner = winner;
          }

          newState.isFirstServe = false;
        } else {
          if (prev.isFirstServe) {
            newState.servingTeam = prev.servingTeam === 1 ? 2 : 1;
            newState.serverNumber = 2;
            newState.isFirstServe = false;
          } else {
            if (prev.serverNumber === 1) {
              newState.serverNumber = 2;
            } else {
              newState.servingTeam = prev.servingTeam === 1 ? 2 : 1;
              newState.serverNumber = 1;
            }
          }
        }

        return newState;
      });
    },
    [gameState.isGameOver, checkWinCondition],
  );

  const handleUndo = useCallback(() => {
    setGameState((prev) => {
      if (prev.history.length === 0) return prev;

      const lastEntry = prev.history[prev.history.length - 1];
      const newHistory = prev.history.slice(0, -1);

      return {
        ...prev,
        team1Score: lastEntry.team1Score,
        team2Score: lastEntry.team2Score,
        servingTeam: lastEntry.servingTeam,
        serverNumber: lastEntry.serverNumber,
        isFirstServe: lastEntry.isFirstServe,
        isGameOver: false,
        winner: null,
        history: newHistory,
      };
    });
  }, []);

  const handleReset = useCallback(() => {
    setGameState(initialState);
  }, []);

  const handleTargetScoreChange = useCallback(
    (value: string) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 1) {
        setGameState((prev) => ({
          ...prev,
          targetScore: num,
          isGameOver: false,
          winner: checkWinCondition(prev.team1Score, prev.team2Score, num),
        }));
      }
    },
    [checkWinCondition],
  );

  return (
    <div className="mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pickleball Scorer</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-1"
          >
            <HistoryIcon className="size-4" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={handleUndo} className="gap-1">
            <RotateCcwIcon className="size-4" />
            Undo
          </Button>
          <Button variant="destructive" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      <Card
        className={cn(
          "text-primary-foreground",
          gameState.servingTeam === 1 ? "bg-orange-400" : "bg-blue-400",
        )}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-sm opacity-80">Score Call</div>
          <div className="text-5xl font-bold tracking-wider">{getScoreAnnouncement()}</div>
          <div className="mt-2 text-sm opacity-80">
            {gameState.servingTeam === 1 ? team1Name : team2Name} serving
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card
          className={`relative overflow-hidden border-2 border-transparent transition-all ${
            gameState.winner === 1
              ? "border-4 border-green-400"
              : gameState.servingTeam === 1
                ? "border-primary"
                : ""
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {gameState.servingTeam === 1 && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-green-800/10 bg-ballgreen text-xs font-bold">
                  {gameState.serverNumber}
                </div>
              )}
              <Input
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                className="h-8 border-0 bg-transparent p-0 text-lg font-semibold focus-visible:ring-0"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-7xl font-bold">{gameState.team1Score}</div>
            </div>
          </CardContent>
          {gameState.winner === 1 && (
            <div className="absolute top-2 right-2">
              <TrophyIcon className="size-8 text-green-400" />
            </div>
          )}
        </Card>

        <Card
          className={`relative overflow-hidden border-2 border-transparent transition-all ${
            gameState.winner === 1
              ? "border-4 border-green-400"
              : gameState.servingTeam === 2
                ? "border-primary"
                : ""
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {gameState.servingTeam === 2 && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-green-800/10 bg-ballgreen text-xs font-bold">
                  {gameState.serverNumber}
                </div>
              )}
              <Input
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                className="h-8 border-0 bg-transparent p-0 text-lg font-semibold focus-visible:ring-0"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-7xl font-bold">{gameState.team2Score}</div>
            </div>
          </CardContent>
          {gameState.winner === 2 && (
            <div className="absolute top-2 right-2">
              <TrophyIcon className="size-8 text-yellow-400" />
            </div>
          )}
        </Card>
      </div>

      {!gameState.isGameOver && (
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            className="h-24 text-xl"
            onClick={() => handlePoint(1)}
            variant={gameState.servingTeam === 1 ? "default" : "outline"}
          >
            <div className="flex flex-col items-center gap-1">
              <span>{team1Name} Wins Point</span>
              {gameState.servingTeam === 1 && <span className="text-xs opacity-80">+1 point</span>}
            </div>
          </Button>
          <Button
            size="lg"
            className="h-24 text-xl"
            onClick={() => handlePoint(2)}
            variant={gameState.servingTeam === 2 ? "default" : "outline"}
          >
            <div className="flex flex-col items-center gap-1">
              <span>{team2Name} Wins Point</span>
              {gameState.servingTeam === 2 && <span className="text-xs opacity-80">+1 point</span>}
            </div>
          </Button>
        </div>
      )}

      {gameState.isGameOver && (
        <Card className="border-4 border-green-400 bg-yellow-50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <TrophyIcon className="mb-2 size-12 text-green-500" />
            <div className="text-2xl font-bold text-primary-foreground">
              {gameState.winner === 1 ? team1Name : team2Name} Wins!
            </div>
            <div className="text-primary-foreground">
              Final Score: {gameState.team1Score} - {gameState.team2Score}
            </div>
            <Button className="mt-4" variant="secondary" onClick={handleReset}>
              Start New Game
            </Button>
          </CardContent>
        </Card>
      )}

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
              value={gameState.targetScore}
              onChange={(e) => handleTargetScoreChange(e.target.value)}
              className="w-20"
              min={1}
            />
            <span className="text-sm text-muted-foreground">(Win by 2)</span>
          </div>
        </CardContent>
      </Card>

      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {gameState.history.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">No points scored yet</div>
              ) : (
                [...gameState.history].reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {gameState.history.length - idx}.
                      </span>
                      <span className={entry.pointWinner === 1 ? "font-semibold text-primary" : ""}>
                        {team1Name}: {entry.team1Score}
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className={entry.pointWinner === 2 ? "font-semibold text-primary" : ""}>
                        {team2Name}: {entry.team2Score}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserIcon className="size-3" />
                      {entry.servingTeam === 1 ? team1Name : team2Name} ({entry.serverNumber})
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
