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
import { Card, CardContent } from "@/components/ui/card";
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
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white bg-tournament-lime px-4 py-1.5 text-xs font-black tracking-wider text-tournament-blue uppercase">
            <TrophyIcon className="size-3.5" />
            COMPLETED
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-tournament-lime bg-white px-4 py-1.5 text-xs font-black tracking-wider text-tournament-blue uppercase">
            <PlayIcon className="size-3.5" />
            LIVE
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-tournament-lime bg-white px-4 py-1.5 text-xs font-black tracking-wider text-tournament-blue uppercase">
            <PlayIcon className="size-3.5" />
            LIVE
          </span>
        );
      case "abandoned":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-400 bg-slate-700 px-4 py-1.5 text-xs font-black tracking-wider text-white uppercase">
            <XCircleIcon className="size-3.5" />
            ABANDONED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-tournament-blue px-6 py-10 sm:px-10 sm:py-12">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-tournament-lime opacity-20" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white opacity-15" />
        <div className="pointer-events-none absolute right-20 bottom-10 h-16 w-16 rounded-full bg-tournament-lime opacity-10" />

        <div className="relative z-10 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <h1 className="text-5xl leading-none font-black tracking-tight text-tournament-lime uppercase italic [text-shadow:3px_3px_0px_rgba(0,0,0,0.25)] sm:text-6xl lg:text-7xl">
              GAMES
            </h1>
            <p className="mt-3 text-sm font-bold tracking-[0.2em] text-white/90 uppercase">
              Pickleball Match Tracker
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger
              render={
                <Button className="group gap-2 rounded-full border-4 border-white bg-tournament-lime px-8 py-6 text-lg font-black tracking-wide text-tournament-blue uppercase shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
                  <PlusIcon className="size-6 transition-transform group-hover:rotate-90" />
                  NEW GAME
                </Button>
              }
            />
            <DialogContent className="border-4 border-tournament-blue sm:max-w-md">
              <DialogHeader className="-mx-6 -mt-6 mb-4 bg-tournament-blue px-6 py-4">
                <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase italic">
                  CREATE MATCH
                </DialogTitle>
                <DialogDescription className="text-sm font-semibold text-white/80">
                  Set up your pickleball doubles game
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="team1"
                    className="text-sm font-bold tracking-wider text-tournament-blue uppercase"
                  >
                    Team 1 Name
                  </Label>
                  <Input
                    id="team1"
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    placeholder="Team 1"
                    className="border-2 border-tournament-blue font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="team2"
                    className="text-sm font-bold tracking-wider text-tournament-blue uppercase"
                  >
                    Team 2 Name
                  </Label>
                  <Input
                    id="team2"
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    placeholder="Team 2"
                    className="border-2 border-tournament-blue font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="targetScore"
                    className="text-sm font-bold tracking-wider text-tournament-blue uppercase"
                  >
                    Winning Score
                  </Label>
                  <Input
                    id="targetScore"
                    type="number"
                    value={targetScore}
                    onChange={(e) => setTargetScore(parseInt(e.target.value) || 11)}
                    min={1}
                    className="border-2 border-tournament-blue text-xl font-black"
                  />
                  <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Win by 2 points
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="border-2 font-bold uppercase"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  className="gap-2 bg-tournament-lime font-black tracking-wide text-tournament-blue uppercase"
                >
                  <TrophyIcon className="size-4" />
                  Create Game
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Games List */}
      {games === undefined ? (
        <div className="py-16 text-center">
          <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-tournament-blue/20">
            <PlayIcon className="size-10 text-tournament-blue" />
          </div>
          <p className="mt-6 text-xl font-black tracking-wide text-tournament-blue uppercase">
            Loading Games...
          </p>
        </div>
      ) : games.length === 0 ? (
        <Card className="overflow-hidden border-4 border-dashed border-tournament-blue/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-tournament-blue">
              <TrophyIcon className="size-10 text-tournament-lime" />
            </div>
            <p className="mt-6 text-2xl font-black tracking-tight text-tournament-blue uppercase">
              No Games Yet
            </p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              Start tracking your pickleball matches
            </p>
            <Button
              className="mt-6 gap-2 rounded-full border-4 border-tournament-blue bg-tournament-lime px-6 py-5 font-black tracking-wide text-tournament-blue uppercase"
              onClick={() => setIsCreateOpen(true)}
            >
              <PlusIcon className="size-5" />
              Create First Game
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {games.map((game) => (
            <Card
              key={game._id}
              className={`overflow-hidden border-4 py-0 transition-all duration-300 hover:shadow-2xl ${
                game.status === "completed"
                  ? "border-tournament-lime"
                  : game.status === "in_progress"
                    ? "border-tournament-blue"
                    : "border-slate-200"
              }`}
            >
              {/* Card Header Bar */}
              <div
                className={`flex items-center justify-between px-5 py-3 ${
                  game.status === "completed"
                    ? "bg-tournament-lime"
                    : game.status === "in_progress"
                      ? "bg-tournament-blue"
                      : "bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getStatusBadge(game.status)}
                  {game.isLive && game.status !== "completed" && (
                    <div className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tournament-lime opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
                    </div>
                  )}
                </div>
                {game.status === "completed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-red-500 hover:text-white"
                    onClick={() => setGameToDelete(game._id)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                )}
              </div>

              <CardContent className="p-5">
                <Link to="/app/g/$id" params={{ id: game._id }} className="group block">
                  {/* Match Title */}
                  <div className="mb-4 text-center">
                    <h3 className="text-lg font-bold tracking-wide text-slate-700 uppercase">
                      {game.team1Name}{" "}
                      <span className="mx-2 font-black text-tournament-blue">VS</span>{" "}
                      {game.team2Name}
                    </h3>
                    <p className="mt-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      Target: {game.targetScore} points (win by 2)
                    </p>
                  </div>

                  {/* Score Board */}
                  <div className="flex items-center justify-center gap-4 rounded-2xl bg-slate-50 p-6">
                    {/* Team 1 Score */}
                    <div className="text-center">
                      <div
                        className={`rounded-xl px-6 py-4 ${
                          game.status === "completed" && game.winner === 1
                            ? "border-tournament-blue bg-tournament-lime"
                            : "border-slate-200 bg-white"
                        } border-3`}
                      >
                        <span
                          className={`block text-6xl leading-none font-black ${
                            game.status === "completed" && game.winner === 1
                              ? "text-tournament-blue"
                              : "text-slate-800"
                          }`}
                        >
                          {game.team1Score}
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-tournament-blue text-xl font-black text-white">
                      -
                    </div>

                    {/* Team 2 Score */}
                    <div className="text-center">
                      <div
                        className={`rounded-xl px-6 py-4 ${
                          game.status === "completed" && game.winner === 2
                            ? "border-tournament-blue bg-tournament-lime"
                            : "border-slate-200 bg-white"
                        } border-3`}
                      >
                        <span
                          className={`block text-6xl leading-none font-black ${
                            game.status === "completed" && game.winner === 2
                              ? "text-tournament-blue"
                              : "text-slate-800"
                          }`}
                        >
                          {game.team2Score}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Hint */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-center">
                    {game.status === "completed" ? (
                      <span className="flex items-center gap-2 text-lg font-black text-tournament-blue uppercase">
                        <TrophyIcon className="size-5 text-tournament-lime" />
                        {game.winner === 1 ? game.team1Name : game.team2Name} WINS
                      </span>
                    ) : game.status === "in_progress" ? (
                      <span className="flex items-center gap-2 text-lg font-black text-tournament-blue uppercase">
                        CONTINUE MATCH
                        <span className="transition-transform group-hover:translate-x-2">→</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-lg font-black text-slate-500 uppercase">
                        VIEW DETAILS
                        <span className="transition-transform group-hover:translate-x-2">→</span>
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
        <AlertDialogContent
          className="overflow-hidden border-4 p-0"
          style={{ borderColor: "#dc2626" }}
        >
          <AlertDialogHeader className="bg-red-600 p-6">
            <AlertDialogTitle className="flex items-center gap-3 text-2xl font-black text-white uppercase italic">
              <Trash2Icon className="size-7" />
              DELETE GAME
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="px-6 py-4">
            <AlertDialogDescription className="text-base font-semibold text-slate-700">
              Are you sure you want to delete this completed game? This action cannot be undone.
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="gap-3 px-6 pb-6">
            <AlertDialogCancel className="border-2 border-slate-300 font-bold uppercase">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 font-black tracking-wide uppercase hover:bg-red-700"
            >
              Delete Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
