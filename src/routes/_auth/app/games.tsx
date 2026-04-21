// @ts-nocheck
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { PlusIcon, Trash2Icon, TrophyIcon, PlayIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";

import { CreateMatchDialog } from "@/components/games/create-match-dialog";
import { DeleteMatchAlertDialog } from "@/components/games/delete-match-alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/app/games")({
  component: MatchesPage,
});

function MatchesPage() {
  const { data: matches } = useQuery(convexQuery(api.scoring.listAllMatches, {}));
  const createMatch = useMutation(api.scoring.createMatch);
  const deleteMatch = useMutation(api.scoring.deleteMatch);
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<Id<"matches"> | null>(null);

  const handleCreate = async (data: {
    bracketId: Id<"brackets">;
    participant1Id: Id<"categoryParticipants">;
    participant2Id: Id<"categoryParticipants">;
    targetScore: number;
  }) => {
    const matchId = await createMatch(data);
    setIsCreateOpen(false);
    navigate({ to: "/app/g/$id", params: { id: matchId } });
  };

  const handleDelete = async () => {
    if (matchToDelete) {
      await deleteMatch({ matchId: matchToDelete });
      setMatchToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="bg-tournament-lime text-tournament-blue inline-flex items-center gap-1.5 rounded-full border-2 border-white px-4 py-1.5 text-xs font-black tracking-wider uppercase">
            <TrophyIcon className="size-3.5" />
            COMPLETED
          </span>
        );
      case "inProgress":
        return (
          <span className="border-tournament-lime text-tournament-blue inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-4 py-1.5 text-xs font-black tracking-wider uppercase">
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
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-300 bg-slate-100 px-4 py-1.5 text-xs font-black tracking-wider text-slate-600 uppercase">
            SCHEDULED
          </span>
        );
      default:
        return null;
    }
  };

  const getTeamDisplay = (
    match: typeof matches extends (infer T)[] ? T : never,
    teamNum: 1 | 2,
  ) => {
    // For now, just show participant IDs shortened
    // In the future, this should fetch participant names from the categoryParticipants table
    const participantId = teamNum === 1 ? match.participant1Id : match.participant2Id;
    return `Team ${teamNum}`;
  };

  const isWinner = (match: typeof matches extends (infer T)[] ? T : never, teamNum: 1 | 2) => {
    if (!match.winnerParticipantId) return false;
    return teamNum === 1
      ? match.winnerParticipantId === match.participant1Id
      : match.winnerParticipantId === match.participant2Id;
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-tournament-blue relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-12">
        {/* Decorative circles */}
        <div className="bg-tournament-lime pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white opacity-15" />
        <div className="bg-tournament-lime pointer-events-none absolute right-20 bottom-10 h-16 w-16 rounded-full opacity-10" />

        <div className="relative z-10 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <h1 className="text-tournament-lime text-5xl leading-none font-black tracking-tight uppercase italic [text-shadow:3px_3px_0px_rgba(0,0,0,0.25)] sm:text-6xl lg:text-7xl">
              MATCHES
            </h1>
            <p className="mt-3 text-sm font-bold tracking-[0.2em] text-white/90 uppercase">
              Pickleball Match Tracker
            </p>
          </div>
          <CreateMatchDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onCreate={handleCreate}
          />
        </div>
      </div>

      {/* Matches List */}
      {matches === undefined ? (
        <div className="py-16 text-center">
          <div className="bg-tournament-blue/20 mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full">
            <PlayIcon className="text-tournament-blue size-10" />
          </div>
          <p className="text-tournament-blue mt-6 text-xl font-black tracking-wide uppercase">
            Loading Matches...
          </p>
        </div>
      ) : matches.length === 0 ? (
        <Card className="border-tournament-blue/40 overflow-hidden border-4 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-tournament-blue flex h-20 w-20 items-center justify-center rounded-full">
              <TrophyIcon className="text-tournament-lime size-10" />
            </div>
            <p className="text-tournament-blue mt-6 text-2xl font-black tracking-tight uppercase">
              No Matches Yet
            </p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              Start tracking your pickleball matches
            </p>
            <Button
              className="border-tournament-blue bg-tournament-lime text-tournament-blue mt-6 gap-2 rounded-full border-4 px-6 py-5 font-black tracking-wide uppercase"
              onClick={() => setIsCreateOpen(true)}
            >
              <PlusIcon className="size-5" />
              Create First Match
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {matches.map((match) => (
            <Card
              key={match._id}
              className={`overflow-hidden border-4 py-0 transition-all duration-300 hover:shadow-2xl ${
                match.status === "completed"
                  ? "border-tournament-lime"
                  : match.status === "inProgress"
                    ? "border-tournament-blue"
                    : "border-slate-200"
              }`}
            >
              {/* Card Header Bar */}
              <div
                className={`flex items-center justify-between px-5 py-3 ${
                  match.status === "completed"
                    ? "bg-tournament-lime"
                    : match.status === "inProgress"
                      ? "bg-tournament-blue"
                      : "bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getStatusBadge(match.status)}
                  {match.isLive && match.status !== "completed" && (
                    <div className="relative flex h-3 w-3">
                      <span className="bg-tournament-lime absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
                    </div>
                  )}
                </div>
                {match.status === "completed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-red-500 hover:text-white"
                    onClick={() => setMatchToDelete(match._id)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                )}
              </div>

              <CardContent className="p-5">
                <Link to="/app/g/$id" params={{ id: match._id }} className="group block">
                  {/* Match Title */}
                  <div className="mb-4 text-center">
                    <h3 className="text-lg font-bold tracking-wide text-slate-700 uppercase">
                      {getTeamDisplay(match, 1)}{" "}
                      <span className="text-tournament-blue mx-2 font-black">VS</span>{" "}
                      {getTeamDisplay(match, 2)}
                    </h3>
                    <p className="mt-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      Target: {match.targetScore} points (win by 2)
                    </p>
                  </div>

                  {/* Score Board */}
                  <div className="flex items-center justify-center gap-4 rounded-2xl bg-slate-50 p-6">
                    {/* Team 1 Score */}
                    <div className="text-center">
                      <div
                        className={`rounded-xl px-6 py-4 ${
                          isWinner(match, 1)
                            ? "border-tournament-blue bg-tournament-lime"
                            : "border-slate-200 bg-white"
                        } border-3`}
                      >
                        <span
                          className={`block text-6xl leading-none font-black ${
                            isWinner(match, 1) ? "text-tournament-blue" : "text-slate-800"
                          }`}
                        >
                          {match.team1Score}
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="bg-tournament-blue flex h-14 w-14 items-center justify-center rounded-full text-xl font-black text-white">
                      -
                    </div>

                    {/* Team 2 Score */}
                    <div className="text-center">
                      <div
                        className={`rounded-xl px-6 py-4 ${
                          isWinner(match, 2)
                            ? "border-tournament-blue bg-tournament-lime"
                            : "border-slate-200 bg-white"
                        } border-3`}
                      >
                        <span
                          className={`block text-6xl leading-none font-black ${
                            isWinner(match, 2) ? "text-tournament-blue" : "text-slate-800"
                          }`}
                        >
                          {match.team2Score}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Hint */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-center">
                    {match.status === "completed" ? (
                      <span className="text-tournament-blue flex items-center gap-2 text-lg font-black uppercase">
                        <TrophyIcon className="text-tournament-lime size-5" />
                        {isWinner(match, 1)
                          ? getTeamDisplay(match, 1)
                          : getTeamDisplay(match, 2)}{" "}
                        WINS
                      </span>
                    ) : match.status === "inProgress" ? (
                      <span className="text-tournament-blue flex items-center gap-2 text-lg font-black uppercase">
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
      <DeleteMatchAlertDialog
        open={!!matchToDelete}
        onOpenChange={() => setMatchToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
