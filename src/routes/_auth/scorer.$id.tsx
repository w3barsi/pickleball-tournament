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
  MoreHorizontalIcon,
  XIcon,
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_auth/scorer/$id")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search.setNumber;
    let setNumber: number | undefined;
    if (raw !== undefined) {
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        setNumber = num;
      }
    }
    return { setNumber };
  },
  component: ScorerPage,
  loader: async ({ params, context }) => {
    const matchId = params.id as Id<"matches">;
    await context.queryClient.ensureQueryData(
      convexQuery(api.app.scoring.getMatchForScorer, { matchId }),
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
  const { setNumber } = Route.useSearch();

  const queryArgs: { matchId: Id<"matches">; viewSetNumber?: number } = { matchId };
  if (setNumber !== undefined) {
    queryArgs.viewSetNumber = setNumber;
  }

  const { data: matchData, isLoading } = useQuery(
    convexQuery(api.app.scoring.getMatchForScorer, queryArgs),
  );

  const setMatchLiveMutation = useMutation(api.app.scoring.setMatchLive).withOptimisticUpdate(
    (localStore, args) => {
      const localQueryKey = { ...queryArgs };
      const current = localStore.getQuery(api.app.scoring.getMatchForScorer, localQueryKey);
      if (!current?.match) return;

      localStore.setQuery(api.app.scoring.getMatchForScorer, localQueryKey, {
        ...current,
        match: {
          ...current.match,
          isLive: args.isLive,
        },
      });
    },
  );
  const forfeitMatchMutation = useMutation(api.app.scoring.forfeitMatch);
  const confirmSetCompleteMutation = useMutation(api.app.scoring.confirmSetComplete);
  const cancelSetMutation = useMutation(api.app.scoring.cancelSet);

  const recordPoint = useMutation(api.app.scoring.recordPoint).withOptimisticUpdate(
    (localStore, args) => {
      const localQueryKey = { ...queryArgs };
      const current = localStore.getQuery(api.app.scoring.getMatchForScorer, localQueryKey);
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
      };

      const newPoints = [...current.currentSetPoints, newPoint];
      const newState = computeSetState(
        newPoints.map((p) => ({ pointWinner: p.pointWinner })),
        current.currentSet.targetScore,
        current.bracket?.winByTwo ?? true,
      );

      localStore.setQuery(api.app.scoring.getMatchForScorer, localQueryKey, {
        ...current,
        currentSetPoints: newPoints,
        computedState: newState,
      });
    },
  );

  const undoPoint = useMutation(api.app.scoring.undoLastPoint).withOptimisticUpdate(
    (localStore) => {
      const localQueryKey = { ...queryArgs };
      const current = localStore.getQuery(api.app.scoring.getMatchForScorer, localQueryKey);
      if (!current?.currentSetPoints.length || !current.currentSet) return;

      const newPoints = current.currentSetPoints.slice(0, -1);
      const newState = computeSetState(
        newPoints.map((p) => ({ pointWinner: p.pointWinner })),
        current.currentSet.targetScore,
        current.bracket?.winByTwo ?? true,
      );

      localStore.setQuery(api.app.scoring.getMatchForScorer, localQueryKey, {
        ...current,
        currentSetPoints: newPoints,
        computedState: newState,
      });
    },
  );

  const [showHistory, setShowHistory] = useState(false);
  const [showForfeitChoice, setShowForfeitChoice] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState<1 | 2 | null>(null);

  const match = matchData?.match;
  const bracket = matchData?.bracket;
  const tournament = matchData?.tournament;
  const category = matchData?.category;
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

  const totalSets = bracket?.numberOfSets ?? 3;

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

  const handleGoLive = useCallback(async () => {
    try {
      await setMatchLiveMutation({ matchId, isLive: !match?.isLive });
      toast.success(match?.isLive ? "Match is no longer live" : "Match is now live");
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
      toast.success("Set confirmed");
      navigate({
        to: "/app/tournaments/$slug/categories/$categoryId/matches/$matchId",
        params: {
          slug: tournament?.slug ?? "",
          categoryId: category?._id ?? "",
          matchId,
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm set");
    }
  }, [matchId, confirmSetCompleteMutation, navigate, tournament, category]);

  if (isLoading || !match) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a3a2a]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-lime-400 border-t-transparent" />
      </div>
    );
  }

  const team1Wins = match.winnerParticipantId === match.participant1Id;
  const team2Wins = match.winnerParticipantId === match.participant2Id;

  return (
    <div className="flex min-h-screen flex-col bg-[#1a3a2a] text-white">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
        <Link
          to="/app/tournaments/$slug/categories/$categoryId/matches/$matchId"
          params={{
            slug: tournament?.slug ?? "",
            categoryId: category?._id ?? "",
            matchId,
          }}
          className="inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeftIcon className="size-4" />
          <span className="hidden sm:inline">Back to Match</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {(isInProgress || isGameOver || isAbandoned) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={currentSetPoints.length === 0}
              className="gap-1 border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <RotateCcwIcon className="size-4" />
              Undo
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleGoLive}
            className={`gap-1 ${
              match.isLive
                ? "border-lime-400/30 bg-lime-400/10 text-lime-400 hover:border-lime-400/50 hover:bg-lime-400/20"
                : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
            }`}
            variant="outline"
          >
            <RadioIcon className="size-3" />
            {match.isLive ? "Live" : "Go Live"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-1 border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <HistoryIcon className="size-4" />
            History
          </Button>
          {isInProgress && isViewingActiveSet && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="border-white/10 bg-[#1a3a2a] text-white">
                <DropdownMenuItem
                  onClick={() => setShowForfeitChoice(true)}
                  className="text-amber-400 hover:bg-white/10 focus:bg-white/10 focus:text-amber-400"
                >
                  <FlagIcon className="size-4" />
                  Forfeit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await cancelSetMutation({ matchId });
                      toast.success("Set cancelled");
                      navigate({
                        to: "/app/tournaments/$slug/categories/$categoryId/matches/$matchId",
                        params: {
                          slug: tournament?.slug ?? "",
                          categoryId: category?._id ?? "",
                          matchId,
                        },
                      });
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to cancel set");
                    }
                  }}
                  className="hover:bg-white/10 focus:bg-white/10 focus:text-white"
                >
                  <XIcon className="size-4" />
                  Cancel Set
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col items-center px-4 py-4 md:px-8">
        <div className="w-full max-w-5xl space-y-6">
          {/* Tournament & Match Info */}
          <div className="flex flex-col items-center gap-2 text-center">
            {isInProgress && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-400" />
                </span>
                Live Match
              </div>
            )}
            {isScheduled && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/50 backdrop-blur-sm">
                Match Scheduled
              </div>
            )}
            {isGameOver && (
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-1.5 text-sm text-lime-400 backdrop-blur-sm">
                <TrophyIcon className="size-4" />
                Match Complete
              </div>
            )}
            {isAbandoned && (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm text-amber-400 backdrop-blur-sm">
                <FlagIcon className="size-4" />
                Match Abandoned
              </div>
            )}
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
              {tournament?.name}
            </h1>
            {category && bracket && (
              <p className="text-sm text-white/50">
                {category.name} — {bracket.name}
                {bracket.label && ` (${bracket.label})`}
                {!isViewingActiveSet && (
                  <span className="ml-2 text-amber-400">(viewing history)</span>
                )}
              </p>
            )}
          </div>

          {/* Scheduled State */}
          {isScheduled && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-12 text-center">
              <p className="text-lg font-bold text-white/80 uppercase">Match Scheduled</p>
              <p className="mt-2 text-sm text-white/50">
                Start the match from the match page to begin scoring
              </p>
              <Link
                to="/app/tournaments/$slug/categories/$categoryId/matches/$matchId"
                params={{
                  slug: tournament?.slug ?? "",
                  categoryId: category?._id ?? "",
                  matchId,
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeftIcon className="size-4" />
                Go to Match Page
              </Link>
            </div>
          )}

          {/* Score Call Banner */}
          {(isInProgress || isGameOver || isAbandoned) && computedState && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-6 text-center">
              <div className="text-sm text-white/40">Score Call</div>
              <div className="mt-1 font-heading text-4xl font-bold tracking-wider text-lime-400 md:text-5xl">
                {getScoreAnnouncement()}
              </div>
              <div className="mt-2 text-sm text-white/50">
                {computedState.servingTeam === 1 ? team1Name : team2Name} serving
              </div>
            </div>
          )}

          {/* Teams & Scores */}
          {(isInProgress || isGameOver || isAbandoned) && (
            <>
              {/* Teams row */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
                {/* Team 1 */}
                <div className="flex flex-col items-end gap-2 text-right">
                  <span className="max-w-full text-lg leading-tight font-semibold md:text-2xl lg:text-3xl">
                    {team1Name}
                  </span>
                  <span className="text-sm text-white/50 md:text-base">
                    ({team1SetWins} set{team1SetWins !== 1 ? "s" : ""})
                  </span>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold tracking-wider text-white/30 uppercase md:text-sm">
                    VS
                  </span>
                </div>

                {/* Team 2 */}
                <div className="flex flex-col items-start gap-2 text-left">
                  <span className="max-w-full text-lg leading-tight font-semibold md:text-2xl lg:text-3xl">
                    {team2Name}
                  </span>
                  <span className="text-sm text-white/50 md:text-base">
                    ({team2SetWins} set{team2SetWins !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>

              {/* Scores row */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
                {/* Team 1 score */}
                <div className="flex flex-col items-end">
                  <span
                    className={`font-heading text-7xl leading-none font-black tracking-tight md:text-9xl lg:text-[12rem] ${
                      computedState?.isGameOver && computedState?.winner === 1
                        ? "text-lime-400"
                        : "text-white"
                    }`}
                  >
                    {computedState?.team1Score ?? 0}
                  </span>
                  {computedState?.servingTeam === 1 && !isGameOver && !isAbandoned && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-xs font-bold text-lime-400">
                      <span className="flex size-4 items-center justify-center rounded-full bg-lime-400 text-[10px] text-[#1a3a2a]">
                        {computedState.serverNumber}
                      </span>
                      Serving
                    </div>
                  )}
                </div>

                {/* Separator */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-px bg-white/20 md:h-24" />
                </div>

                {/* Team 2 score */}
                <div className="flex flex-col items-start">
                  <span
                    className={`font-heading text-7xl leading-none font-black tracking-tight md:text-9xl lg:text-[12rem] ${
                      computedState?.isGameOver && computedState?.winner === 2
                        ? "text-lime-400"
                        : "text-white"
                    }`}
                  >
                    {computedState?.team2Score ?? 0}
                  </span>
                  {computedState?.servingTeam === 2 && !isGameOver && !isAbandoned && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-xs font-bold text-lime-400">
                      <span className="flex size-4 items-center justify-center rounded-full bg-lime-400 text-[10px] text-[#1a3a2a]">
                        {computedState.serverNumber}
                      </span>
                      Serving
                    </div>
                  )}
                </div>
              </div>

              {/* Set info */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm backdrop-blur-sm md:px-6 md:py-2.5 md:text-base">
                  <TrophyIcon className="size-4 text-lime-400" />
                  Set {currentSet?.setNumber ?? 1} of {totalSets}
                  <span className="text-white/40">—</span>
                  <span className="text-white/60">
                    Race to {bracket?.pointsPerGame ?? 11}
                    {bracket?.winByTwo ? " (win by 2)" : " (win at target)"}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Set Complete Confirmation */}
          {isInProgress &&
            isViewingActiveSet &&
            computedState?.isGameOver &&
            computedState.winner && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-lime-400/30 bg-lime-400/10 py-8 text-center">
                <TrophyIcon className="size-12 text-lime-400" />
                <div className="font-heading text-2xl font-bold text-white">
                  Set {currentSet?.setNumber} Complete!
                </div>
                <div className="text-white/60">
                  {computedState.winner === 1 ? team1Name : team2Name} wins the set{" "}
                  {computedState.team1Score}-{computedState.team2Score}
                </div>
                <Button
                  className="mt-2 gap-2 border-lime-400/30 bg-lime-400 text-[#1a3a2a] hover:border-lime-400 hover:bg-lime-300"
                  onClick={handleConfirmSetComplete}
                >
                  <PlayIcon className="size-4" />
                  Confirm & Return to Match
                </Button>
              </div>
            )}

          {/* Game Over / Abandoned */}
          {(isGameOver || isAbandoned) && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-lime-400/30 bg-lime-400/10 py-8 text-center">
              <TrophyIcon className="mb-2 size-12 text-lime-400" />
              <div className="font-heading text-2xl font-bold text-white">
                {team1Wins ? team1Name : team2Name} Wins!
              </div>
              <div className="text-white/60">
                Final Score: {team1SetWins} - {team2SetWins}
              </div>
              {allSets.length > 0 && (
                <div className="mt-2 text-sm text-white/40">
                  {allSets
                    .map((s) => `Set ${s.setNumber}: ${s.team1Score}-${s.team2Score}`)
                    .join(" · ")}
                </div>
              )}
              <Button
                className="mt-4 border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
                variant="outline"
                render={<Link to="/app/tournaments">Back to Tournaments</Link>}
              />
            </div>
          )}

          {/* Point Buttons */}
          {isInProgress && isViewingActiveSet && !computedState?.isGameOver && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-24 border-white/10 bg-white/5 text-xl text-white hover:border-lime-400/50 hover:bg-lime-400/10 hover:text-lime-400"
                onClick={() => handlePoint(1)}
                variant="outline"
              >
                <div className="flex flex-col items-center gap-1">
                  <span>{team1Name} Wins Point</span>
                  {computedState?.servingTeam === 1 && (
                    <span className="text-xs text-white/60">+1 point</span>
                  )}
                </div>
              </Button>
              <Button
                size="lg"
                className="h-24 border-white/10 bg-white/5 text-xl text-white hover:border-lime-400/50 hover:bg-lime-400/10 hover:text-lime-400"
                onClick={() => handlePoint(2)}
                variant="outline"
              >
                <div className="flex flex-col items-center gap-1">
                  <span>{team2Name} Wins Point</span>
                  {computedState?.servingTeam === 2 && (
                    <span className="text-xs text-white/60">+1 point</span>
                  )}
                </div>
              </Button>
            </div>
          )}

          {/* Set History */}
          {allSets.length > 0 && (
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-semibold tracking-wider text-white/30 uppercase">
                Set History
              </span>
              <div className="flex items-center gap-2">
                {allSets.map((set) => (
                  <div
                    key={set.setNumber}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 md:px-4 md:py-3 ${
                      set.status === "inProgress"
                        ? "border-lime-400/30 bg-lime-400/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <span className="text-xs text-white/40 md:text-sm">Set {set.setNumber}</span>
                    <div className="flex items-center gap-1.5 text-sm font-bold md:text-base">
                      <span className={set.winnerTeam === 1 ? "text-lime-400" : "text-white/60"}>
                        {set.team1Score}
                      </span>
                      <span className="text-white/20">-</span>
                      <span className={set.winnerTeam === 2 ? "text-lime-400" : "text-white/60"}>
                        {set.team2Score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {showHistory && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 text-sm font-semibold tracking-wider text-white/30 uppercase">
                Score History
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {currentSetPoints.length === 0 ? (
                  <div className="py-4 text-center text-white/40">No points scored yet</div>
                ) : (
                  [...currentSetPoints].reverse().map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white/40">{currentSetPoints.length - idx}.</span>
                        <span
                          className={
                            entry.pointWinner === 1
                              ? "font-semibold text-lime-400"
                              : "text-white/60"
                          }
                        >
                          {team1Name}: {entry.team1Score}
                        </span>
                        <span className="text-white/20">-</span>
                        <span
                          className={
                            entry.pointWinner === 2
                              ? "font-semibold text-lime-400"
                              : "text-white/60"
                          }
                        >
                          {team2Name}: {entry.team2Score}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <UserIcon className="size-3" />
                        {entry.servingTeam === 1 ? team1Name : team2Name} ({entry.serverNumber})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Forfeit Team Choice */}
          {showForfeitChoice && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 py-6 text-center">
              <p className="font-semibold text-amber-400">Which team is forfeiting?</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForfeitConfirm(1);
                    setShowForfeitChoice(false);
                  }}
                  className="border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
                >
                  {team1Name}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForfeitConfirm(2);
                    setShowForfeitChoice(false);
                  }}
                  className="border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
                >
                  {team2Name}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForfeitChoice(false)}
                className="text-white/50 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Forfeit Confirmation */}
          {showForfeitConfirm && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 py-6 text-center">
              <p className="font-semibold text-amber-400">
                Forfeit match for {showForfeitConfirm === 1 ? team1Name : team2Name}?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForfeitConfirm(null)}
                  className="border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleForfeit(showForfeitConfirm)}
                  className="bg-amber-500 text-white hover:bg-amber-600"
                >
                  Confirm Forfeit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="relative z-10 flex items-center justify-center gap-4 border-t border-white/10 px-4 py-4 text-xs text-white/30 md:px-8">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime-400" />
          </span>
          Live updates
        </span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">Scores refresh automatically</span>
      </div>
    </div>
  );
}
