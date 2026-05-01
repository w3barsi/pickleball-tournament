import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Doc, Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  RotateCcwIcon,
  TrophyIcon,
  UserIcon,
  HistoryIcon,
  ArrowLeftIcon,
  RadioIcon,
  PlayIcon,
  FlagIcon,
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/app/g/$id")({
  component: ScorerPage,
  loader: async (ctx) => {
    const matchId = ctx.params.id as Id<"matches">;
    await ctx.context.queryClient.ensureQueryData(
      convexQuery(api.scoring.getMatchForScorer, { matchId }),
    );
  },
});

function getParticipantName(
  participant:
    | {
        player?: { fullName: string } | null;
        pair?: { teamName?: string } | null;
        playerOne?: { fullName: string } | null;
        playerTwo?: { fullName: string } | null;
      }
    | null
    | undefined,
  categoryType: "singles" | "doubles",
) {
  if (!participant) return "TBD";
  if (categoryType === "singles") {
    return participant.player?.fullName ?? "Unknown";
  }
  if (participant.pair?.teamName) {
    return `${participant.pair.teamName} (${participant.playerOne?.fullName ?? "Unknown"} / ${participant.playerTwo?.fullName ?? "Unknown"})`;
  }
  return `${participant.playerOne?.fullName.split(" ").at(-1) ?? "Unknown"} / ${participant.playerTwo?.fullName.split(" ").at(-1) ?? "Unknown"}`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

interface ComputedState {
  team1Score: number;
  team2Score: number;
  servingTeam: 1 | 2;
  serverNumber: 1 | 2;
  isFirstServe: boolean;
  isGameOver: boolean;
  winner: 1 | 2 | null;
}

function computeSetState(
  points: Array<{ pointWinner: 1 | 2 }>,
  targetScore: number,
  winByTwo: boolean,
): ComputedState {
  let state: ComputedState = {
    team1Score: 0,
    team2Score: 0,
    servingTeam: 1,
    serverNumber: 2,
    isFirstServe: true,
    isGameOver: false,
    winner: null,
  };

  for (const point of points) {
    if (state.isGameOver) break;

    if (point.pointWinner === state.servingTeam) {
      if (state.servingTeam === 1) {
        state.team1Score += 1;
      } else {
        state.team2Score += 1;
      }

      const t1Wins =
        state.team1Score >= targetScore && (!winByTwo || state.team1Score >= state.team2Score + 2);
      const t2Wins =
        state.team2Score >= targetScore && (!winByTwo || state.team2Score >= state.team1Score + 2);

      if (t1Wins) {
        state.isGameOver = true;
        state.winner = 1;
      } else if (t2Wins) {
        state.isGameOver = true;
        state.winner = 2;
      }

      state.isFirstServe = false;
    } else {
      if (state.isFirstServe) {
        state.servingTeam = state.servingTeam === 1 ? 2 : 1;
        state.serverNumber = 2;
        state.isFirstServe = false;
      } else {
        if (state.serverNumber === 1) {
          state.serverNumber = 2;
        } else {
          state.servingTeam = state.servingTeam === 1 ? 2 : 1;
          state.serverNumber = 1;
        }
      }
    }
  }

  return state;
}

// ─── Component ─────────────────────────────────────────────────────────────

function ScorerPage() {
  const { id } = Route.useParams();
  const matchId = id as Id<"matches">;
  const navigate = useNavigate();

  const [viewSetNumber, setViewSetNumber] = useState<number | null>(null);

  const queryArgs = viewSetNumber !== null ? { matchId, viewSetNumber } : { matchId };

  const { data: matchData, isLoading } = useQuery(
    convexQuery(
      api.scoring.getMatchForScorer,
      queryArgs as { matchId: Id<"matches">; viewSetNumber?: number },
    ),
  );

  const startMatchMutation = useMutation(api.scoring.startMatch);
  const setMatchLiveMutation = useMutation(api.scoring.setMatchLive);
  const forfeitMatchMutation = useMutation(api.scoring.forfeitMatch);
  const confirmSetCompleteMutation = useMutation(api.scoring.confirmSetComplete);

  const recordPoint = useMutation(api.scoring.recordPoint).withOptimisticUpdate(
    (localStore, args) => {
      const queryKey = viewSetNumber !== null ? { matchId, viewSetNumber } : { matchId };
      const current = localStore.getQuery(api.scoring.getMatchForScorer, queryKey);
      if (!current?.match || !current.currentSet || !current.computedState) return;

      const pointWinner = args.pointWinner as 1 | 2;
      const state = current.computedState;

      const newPoint: Doc<"pickleballPoints"> = {
        _id: "__optimistic__" as Id<"pickleballPoints">,
        _creationTime: Date.now(),
        matchSetId: current.currentSet._id,
        team1Score: state.team1Score,
        team2Score: state.team2Score,
        servingTeam: state.servingTeam,
        serverNumber: state.serverNumber,
        isFirstServe: state.isFirstServe,
        pointWinner,
        sequenceNumber: current.currentSetPoints.length,
        timestamp: Date.now(),
        deletedAt: undefined,
      };

      const newPoints = [...current.currentSetPoints, newPoint];
      const newState = computeSetState(
        newPoints.map((p) => ({ pointWinner: p.pointWinner })),
        current.currentSet.targetScore,
        current.match.winByTwo,
      );

      localStore.setQuery(api.scoring.getMatchForScorer, queryKey, {
        ...current,
        currentSetPoints: newPoints,
        computedState: newState,
      });
    },
  );

  const undoPoint = useMutation(api.scoring.undoLastPoint).withOptimisticUpdate((localStore) => {
    const queryKey = viewSetNumber !== null ? { matchId, viewSetNumber } : { matchId };
    const current = localStore.getQuery(api.scoring.getMatchForScorer, queryKey);
    if (!current?.currentSetPoints.length || !current.currentSet) return;

    const newPoints = current.currentSetPoints.slice(0, -1);
    const newState = computeSetState(
      newPoints.map((p) => ({ pointWinner: p.pointWinner })),
      current.currentSet.targetScore,
      current.match.winByTwo,
    );

    localStore.setQuery(api.scoring.getMatchForScorer, queryKey, {
      ...current,
      currentSetPoints: newPoints,
      computedState: newState,
    });
  });

  const [showHistory, setShowHistory] = useState(false);
  const [showForfeitChoice, setShowForfeitChoice] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState<1 | 2 | null>(null);

  const match = matchData?.match;
  const participant1 = matchData?.participant1;
  const participant2 = matchData?.participant2;
  const categoryType = matchData?.categoryType ?? "singles";
  const allSets = matchData?.allSets ?? [];
  const currentSet = matchData?.currentSet;
  const activeSet = matchData?.activeSet;
  const currentSetPoints = matchData?.currentSetPoints ?? [];
  const computedState = matchData?.computedState;
  const isViewingActiveSet = currentSet?._id === activeSet?._id;

  const team1Name = getParticipantName(participant1, categoryType);
  const team2Name = getParticipantName(participant2, categoryType);

  const isGameOver = match?.status === "completed";
  const isInProgress = match?.status === "inProgress";
  const isScheduled = match?.status === "scheduled";
  const isAbandoned = match?.status === "abandoned";

  const team1SetWins = allSets.filter((s) => s.winnerTeam === 1).length;
  const team2SetWins = allSets.filter((s) => s.winnerTeam === 2).length;

  const totalSets = match?.numberOfSets ?? 3;

  const getScoreAnnouncement = useCallback(() => {
    if (!computedState) return "";
    const servingScore =
      computedState.servingTeam === 1 ? computedState.team1Score : computedState.team2Score;
    const receivingScore =
      computedState.servingTeam === 1 ? computedState.team2Score : computedState.team1Score;
    return `${servingScore}-${receivingScore}-${computedState.serverNumber}`;
  }, [computedState]);

  const handlePoint = useCallback(
    async (winningTeam: 1 | 2) => {
      if (!isInProgress) return;
      try {
        await recordPoint({ matchId, pointWinner: winningTeam });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to record point");
      }
    },
    [matchId, isInProgress, recordPoint],
  );

  const handleUndo = useCallback(async () => {
    if (currentSetPoints.length === 0) return;
    try {
      await undoPoint({
        matchId,
        setId: isViewingActiveSet ? undefined : currentSet?._id,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to undo");
    }
  }, [matchId, currentSetPoints.length, undoPoint, isViewingActiveSet, currentSet?._id]);

  const handleStartMatch = useCallback(async () => {
    try {
      await startMatchMutation({ matchId });
      toast.success("Match started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start match");
    }
  }, [matchId, startMatchMutation]);

  const handleGoLive = useCallback(async () => {
    try {
      await setMatchLiveMutation({ matchId });
      toast.success(match?.isLive ? "Match is live" : "Match set to live");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set live");
    }
  }, [matchId, match?.isLive, setMatchLiveMutation]);

  const handleForfeit = useCallback(
    async (team: 1 | 2) => {
      try {
        await forfeitMatchMutation({ matchId, forfeitedBy: team });
        setShowForfeitConfirm(null);
        toast.success("Match forfeited");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to forfeit");
      }
    },
    [matchId, forfeitMatchMutation],
  );

  const handleConfirmSetComplete = useCallback(async () => {
    try {
      await confirmSetCompleteMutation({ matchId });
      setViewSetNumber(null);
      toast.success("Set confirmed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm set");
    }
  }, [matchId, confirmSetCompleteMutation]);

  if (isLoading || !match) {
    return <div className="py-12 text-center text-muted-foreground">Loading match...</div>;
  }

  const team1Wins = match.winnerParticipantId === match.participant1Id;
  const team2Wins = match.winnerParticipantId === match.participant2Id;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          render={
            <Link to="/app/tournaments" className="flex items-center gap-1">
              <ArrowLeftIcon className="size-4" />
              Tournaments
            </Link>
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">
            {team1Name} <span className="text-muted-foreground">vs</span> {team2Name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Set {currentSet?.setNumber ?? 1} of {totalSets} · {match.pointsPerGame} points
            {match.winByTwo ? " (win by 2)" : " (win at target)"}
            {!isViewingActiveSet && <span className="ml-1 text-amber-600">(viewing)</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(isInProgress || isGameOver || isAbandoned) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={currentSetPoints.length === 0}
              className="gap-1"
            >
              <RotateCcwIcon className="size-4" />
              Undo
            </Button>
          )}
          <Button
            variant={match.isLive ? "default" : "outline"}
            size="sm"
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
          {isInProgress && isViewingActiveSet && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForfeitChoice(true)}
              className="gap-1 text-amber-600"
            >
              <FlagIcon className="size-3" />
              Forfeit
            </Button>
          )}
        </div>
      </div>

      {/* Set Progress */}
      {allSets.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{team1Name}</span>
            <div className="flex gap-1">
              {Array.from({ length: totalSets }).map((_, i) => {
                const set = allSets.find((s) => s.setNumber === i + 1);
                const isViewed = set?.setNumber === currentSet?.setNumber;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!set}
                    onClick={() => setViewSetNumber(set?.setNumber ?? null)}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                      set?.winnerTeam === 1
                        ? "bg-green-500 text-white"
                        : set?.winnerTeam === 2
                          ? "bg-slate-200 text-slate-400"
                          : set?.status === "inProgress"
                            ? "bg-primary text-primary-foreground"
                            : "bg-slate-100 text-slate-400",
                      isViewed && "ring-2 ring-amber-500 ring-offset-1",
                      set && "cursor-pointer hover:opacity-80",
                    )}
                  >
                    {set?.winnerTeam === 1 ? "W" : set?.winnerTeam === 2 ? "L" : i + 1}
                  </button>
                );
              })}
            </div>
            <span className="font-semibold">{team2Name}</span>
          </div>
        </div>
      )}

      {/* Scheduled State */}
      {isScheduled && (
        <Card className="border-2 border-dashed bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-lg font-bold text-primary uppercase">Match Scheduled</p>
            <p className="text-sm text-muted-foreground">Start the match to begin scoring</p>
            <Button className="mt-4 gap-2" onClick={handleStartMatch}>
              <PlayIcon className="size-4" />
              Start Match
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Score Call Banner */}
      {(isInProgress || isGameOver || isAbandoned) && computedState && (
        <Card
          className={cn(
            "text-primary-foreground",
            computedState.servingTeam === 1 ? "bg-orange-400" : "bg-blue-400",
          )}
        >
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-sm opacity-80">Score Call</div>
            <div className="text-5xl font-bold tracking-wider">{getScoreAnnouncement()}</div>
            <div className="mt-2 text-sm opacity-80">
              {computedState.servingTeam === 1 ? team1Name : team2Name} serving
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Score Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className={cn(
            "relative overflow-hidden border-2 border-transparent transition-all",
            team1Wins
              ? "border-4 border-green-400"
              : computedState?.servingTeam === 1
                ? "border-primary"
                : "",
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {computedState?.servingTeam === 1 && !isGameOver && !isAbandoned && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                  {computedState.serverNumber}
                </div>
              )}
              <span className="text-lg leading-tight font-semibold">{team1Name}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-7xl font-bold">{computedState?.team1Score ?? 0}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {team1SetWins} set{team1SetWins !== 1 ? "s" : ""} won
              </div>
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
              : computedState?.servingTeam === 2
                ? "border-primary"
                : "",
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {computedState?.servingTeam === 2 && !isGameOver && !isAbandoned && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                  {computedState.serverNumber}
                </div>
              )}
              <span className="text-lg leading-tight font-semibold">{team2Name}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-7xl font-bold">{computedState?.team2Score ?? 0}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {team2SetWins} set{team2SetWins !== 1 ? "s" : ""} won
              </div>
            </div>
          </CardContent>
          {team2Wins && (
            <div className="absolute top-2 right-2">
              <TrophyIcon className="size-8 text-yellow-400" />
            </div>
          )}
        </Card>
      </div>

      {/* Point Buttons */}
      {isInProgress && isViewingActiveSet && !computedState?.isGameOver && (
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            className="h-24 text-xl"
            onClick={() => handlePoint(1)}
            variant={computedState?.servingTeam === 1 ? "default" : "outline"}
          >
            <div className="flex flex-col items-center gap-1">
              <span>{team1Name} Wins Point</span>
              {computedState?.servingTeam === 1 && (
                <span className="text-xs opacity-80">+1 point</span>
              )}
            </div>
          </Button>
          <Button
            size="lg"
            className="h-24 text-xl"
            onClick={() => handlePoint(2)}
            variant={computedState?.servingTeam === 2 ? "default" : "outline"}
          >
            <div className="flex flex-col items-center gap-1">
              <span>{team2Name} Wins Point</span>
              {computedState?.servingTeam === 2 && (
                <span className="text-xs opacity-80">+1 point</span>
              )}
            </div>
          </Button>
        </div>
      )}

      {/* Set Complete Confirmation */}
      {isInProgress && isViewingActiveSet && computedState?.isGameOver && computedState.winner && (
        <Card className="border-4 border-green-400 bg-green-50">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
            <TrophyIcon className="size-12 text-green-500" />
            <div className="text-2xl font-bold">Set {currentSet?.setNumber} Complete!</div>
            <div className="text-muted-foreground">
              {computedState.winner === 1 ? team1Name : team2Name} wins the set{" "}
              {computedState.team1Score}-{computedState.team2Score}
            </div>
            <Button className="mt-2 gap-2" onClick={handleConfirmSetComplete}>
              <PlayIcon className="size-4" />
              Confirm & Start Next Set
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Game Over / Abandoned */}
      {(isGameOver || isAbandoned) && (
        <Card className="border-4 border-green-400 bg-yellow-50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <TrophyIcon className="mb-2 size-12 text-green-500" />
            <div className="text-2xl font-bold">{team1Wins ? team1Name : team2Name} Wins!</div>
            <div className="text-muted-foreground">
              Final Score: {team1SetWins} - {team2SetWins}
            </div>
            {allSets.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                {allSets
                  .map((s) => `Set ${s.setNumber}: ${s.team1Score}-${s.team2Score}`)
                  .join(" · ")}
              </div>
            )}
            <Button
              className="mt-4"
              variant="secondary"
              render={<Link to="/app/tournaments">Back to Tournaments</Link>}
            />
          </CardContent>
        </Card>
      )}

      {/* History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {currentSetPoints.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">No points scored yet</div>
              ) : (
                [...currentSetPoints].reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {currentSetPoints.length - idx}.
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

      {/* Forfeit Team Choice */}
      {showForfeitChoice && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col items-center gap-3 py-6">
            <p className="font-semibold text-amber-800">Which team is forfeiting?</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForfeitConfirm(1);
                  setShowForfeitChoice(false);
                }}
              >
                {team1Name}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForfeitConfirm(2);
                  setShowForfeitChoice(false);
                }}
              >
                {team2Name}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowForfeitChoice(false)}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Forfeit Confirmation */}
      {showForfeitConfirm && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col items-center gap-3 py-6">
            <p className="font-semibold text-amber-800">
              Forfeit match for {showForfeitConfirm === 1 ? team1Name : team2Name}?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForfeitConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleForfeit(showForfeitConfirm)}>
                Confirm Forfeit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
