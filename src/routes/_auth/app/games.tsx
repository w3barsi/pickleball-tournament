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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-sm">
            <TrophyIcon className="size-3.5" />
            Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-sm">
            <PlayIcon className="size-3.5" />
            In Progress
          </span>
        );
      case "abandoned":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-sm">
            <XCircleIcon className="size-3.5" />
            Abandoned
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Games</h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Manage your pickleball matches
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2 bg-foreground text-background hover:bg-foreground/90">
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
        <div className="py-16 text-center">
          <div className="inline-flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-muted">
            <PlayIcon className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">Loading games...</p>
        </div>
      ) : games.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm">
              <TrophyIcon className="size-8 text-muted-foreground" />
            </div>
            <p className="mt-6 text-lg font-semibold text-foreground">No games yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start tracking your pickleball matches
            </p>
            <Button
              className="mt-6 gap-2 bg-foreground text-background hover:bg-foreground/90"
              onClick={() => setIsCreateOpen(true)}
            >
              <PlusIcon className="size-4" />
              Create your first game
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {games.map((game) => (
            <Card
              key={game._id}
              className={`overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${
                game.status === "completed"
                  ? "border-emerald-500/30 bg-emerald-50/30 dark:border-emerald-500/20 dark:bg-emerald-950/20"
                  : game.status === "in_progress"
                    ? "border-indigo-500/40 bg-indigo-50/20 shadow-md dark:border-indigo-500/30 dark:bg-indigo-950/20"
                    : "border-border bg-card"
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg font-bold tracking-tight">
                        {game.team1Name} <span className="mx-1 text-muted-foreground">vs</span>{" "}
                        {game.team2Name}
                      </CardTitle>
                      {game.isLive && game.status !== "completed" && (
                        <div className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(game.status)}
                      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Target: {game.targetScore} pts (win by 2)
                      </span>
                    </div>
                  </div>
                  {game.status === "completed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setGameToDelete(game._id)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  to="/app/g/$id"
                  params={{ id: game._id }}
                  className="group flex items-center justify-between rounded-xl border-2 border-border bg-background p-5 transition-all duration-200 hover:border-foreground/20 hover:bg-muted"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        {game.team1Name}
                      </div>
                      <div
                        className={`mt-1 text-5xl font-black tracking-tight ${
                          game.status === "completed" && game.winner === 1
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {game.team1Score}
                      </div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <span className="text-xl font-black text-muted-foreground">VS</span>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        {game.team2Name}
                      </div>
                      <div
                        className={`mt-1 text-5xl font-black tracking-tight ${
                          game.status === "completed" && game.winner === 2
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {game.team2Score}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {game.status === "completed" ? (
                      <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <TrophyIcon className="size-5" />
                        <span className="hidden sm:inline">
                          {game.winner === 1 ? game.team1Name : game.team2Name} won
                        </span>
                        <span className="sm:hidden">Winner</span>
                      </span>
                    ) : game.status === "in_progress" ? (
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                        Continue
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        View details
                        <span className="ml-1 transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </span>
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
        <AlertDialogContent className="border-2 border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold text-destructive">
              <Trash2Icon className="size-5" />
              Delete Game
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this completed game? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => setGameToDelete(null)} className="font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="text-destructive-foreground bg-destructive font-bold hover:bg-destructive/90"
            >
              Delete Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
