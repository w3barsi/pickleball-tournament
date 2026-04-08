import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { PlusIcon, Trash2Icon, TrophyIcon, PlayIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_auth/app/games")({
  component: GamesPage,
});

function GamesPage() {
  const { data: games } = useQuery(convexQuery(api.scoring.listAllGames, {}));
  const createGame = useMutation(api.scoring.createGame);
  const deleteGame = useMutation(api.scoring.deleteGame);
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Id<"pickleballGames"> | null>(null);

  // Form state
  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [targetScore, setTargetScore] = useState(11);

  const handleCreate = async () => {
    const gameId = await createGame({
      team1Name: team1Name || "Team 1",
      team2Name: team2Name || "Team 2",
      targetScore: targetScore || 11,
    });
    setIsCreateOpen(false);
    navigate({ to: "/app/g/$id", params: { id: gameId } });
  };

  const handleDelete = async () => {
    if (gameToDelete) {
      await deleteGame({ gameId: gameToDelete });
      setGameToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            <TrophyIcon className="size-3" />
            Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
            <PlayIcon className="size-3" />
            In Progress
          </span>
        );
      case "abandoned":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
            <XCircleIcon className="size-3" />
            Abandoned
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Games</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2">
                <PlusIcon className="size-4" />
                New Game
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Game</DialogTitle>
              <DialogDescription>Set up a new pickleball doubles match.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="team1">Team 1 Name</Label>
                <Input
                  id="team1"
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  placeholder="Team 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team2">Team 2 Name</Label>
                <Input
                  id="team2"
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  placeholder="Team 2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetScore">Winning Score</Label>
                <Input
                  id="targetScore"
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(parseInt(e.target.value) || 11)}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">Win by 2 points</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Game</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {games === undefined ? (
        <div className="py-12 text-center text-muted-foreground">Loading games...</div>
      ) : games.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No games yet</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setIsCreateOpen(true)}>
              <PlusIcon className="size-4" />
              Create your first game
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => (
            <Card
              key={game._id}
              className={`transition-colors hover:bg-muted/50 ${
                game.status === "completed"
                  ? "border-green-200 bg-green-50/50"
                  : game.status === "in_progress"
                    ? "border-blue-200"
                    : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">
                        {game.team1Name} vs {game.team2Name}
                      </CardTitle>
                      {getStatusBadge(game.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Target: {game.targetScore} points (win by 2)
                    </p>
                  </div>
                  {game.isLive && game.status !== "completed" && (
                    <div className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                    </div>
                  )}
                  {game.status === "completed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setGameToDelete(game._id)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Link
                  to="/app/g/$id"
                  params={{ id: game._id }}
                  className="flex items-center justify-between rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">{game.team1Name}</div>
                      <div className="text-3xl font-bold">{game.team1Score}</div>
                    </div>
                    <div className="text-xl text-muted-foreground">-</div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">{game.team2Name}</div>
                      <div className="text-3xl font-bold">{game.team2Score}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {game.status === "completed" ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <TrophyIcon className="size-4" />
                        {game.winner === 1 ? game.team1Name : game.team2Name} won
                      </span>
                    ) : game.status === "in_progress" ? (
                      <span>Continue game →</span>
                    ) : (
                      <span>View details →</span>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!gameToDelete} onOpenChange={() => setGameToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this completed game? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGameToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
