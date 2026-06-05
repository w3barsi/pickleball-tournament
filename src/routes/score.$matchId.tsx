import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeftIcon, MapPinIcon, TrophyIcon } from "lucide-react";

export const Route = createFileRoute("/score/$matchId")({
  component: ScorePage,
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(
      convexQuery(api.public.games.getMatchDetails, { matchId: params.matchId as Id<"matches"> }),
    );

    if (!data) throw notFound();

    return data;
  },
  notFoundComponent: () => <div>Match not found</div>,
});

function ScorePage() {
  const { matchId } = Route.useParams();
  const { data } = useQuery(
    convexQuery(api.public.games.getMatchDetails, { matchId: matchId as Id<"matches"> }),
  );

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a3a2a]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-lime-400 border-t-transparent" />
      </div>
    );
  }

  const {
    match,
    bracket,
    category,
    tournament,
    participant1,
    participant2,
    categoryType,
    allSets,
    currentSet,
    team1SetWins,
    team2SetWins,
    numberOfSets,
  } = data;

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a3a2a]">
        <p className="text-white/60">Tournament not found</p>
      </div>
    );
  }

  const team1Name = getParticipantName(participant1, categoryType);
  const team2Name = getParticipantName(participant2, categoryType);

  const team1CurrentScore = currentSet?.team1Score ?? 0;
  const team2CurrentScore = currentSet?.team2Score ?? 0;
  const targetScore = currentSet?.targetScore ?? bracket?.pointsPerGame ?? 11;
  const currentSetNumber = currentSet?.setNumber ?? allSets.length ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#1a3a2a] text-white">
      {/* Subtle top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
        <Link
          to="/tournaments/$slug"
          params={{ slug: tournament.slug }}
          className="inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeftIcon className="size-4" />
          <span className="hidden sm:inline">Back to tournament</span>
        </Link>

        <div className="flex items-center gap-3 text-sm text-white/40">
          {tournament.venueName && (
            <span className="hidden items-center gap-1 sm:flex">
              <MapPinIcon className="size-3.5" />
              {tournament.venueName}
            </span>
          )}
          {match.courtNumber !== undefined && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="size-3.5" />
              Court {match.courtNumber}
            </span>
          )}
        </div>
      </div>

      {/* Main scoreboard */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 md:px-8">
        {/* Tournament & category info */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center md:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-400" />
            </span>
            Live Match
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            {tournament.name}
          </h1>
          {category && bracket && (
            <p className="text-sm text-white/50">
              {category.name} — {bracket.name}
              {bracket.label && ` (${bracket.label})`}
            </p>
          )}
        </div>

        {/* Scoreboard */}
        <div className="w-full max-w-5xl">
          {/* Teams row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
            {/* Team 1 */}
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="max-w-full text-lg leading-tight font-semibold md:text-2xl lg:text-3xl">
                {team1Name}
              </span>
              <span className="text-sm text-white/50 md:text-base">({team1SetWins} sets)</span>
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
              <span className="text-sm text-white/50 md:text-base">({team2SetWins} sets)</span>
            </div>
          </div>

          {/* Scores row */}
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:mt-10 md:gap-8">
            {/* Team 1 score */}
            <div className="flex flex-col items-end">
              <span className="font-heading text-7xl leading-none font-black tracking-tight text-lime-400 md:text-9xl lg:text-[12rem]">
                {team1CurrentScore}
              </span>
            </div>

            {/* Separator */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-px bg-white/20 md:h-24" />
            </div>

            {/* Team 2 score */}
            <div className="flex flex-col items-start">
              <span className="font-heading text-7xl leading-none font-black tracking-tight text-white md:text-9xl lg:text-[12rem]">
                {team2CurrentScore}
              </span>
            </div>
          </div>

          {/* Set info */}
          <div className="mt-6 flex justify-center md:mt-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm backdrop-blur-sm md:px-6 md:py-2.5 md:text-base">
              <TrophyIcon className="size-4 text-lime-400" />
              Set {currentSetNumber} of {numberOfSets}
              <span className="text-white/40">—</span>
              <span className="text-white/60">Race to {targetScore}</span>
            </div>
          </div>

          {/* Set history */}
          {allSets.length > 0 && (
            <div className="mt-8 flex justify-center md:mt-12">
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
    return `${participant.pair.teamName} (${participant.playerOne?.fullName ?? "Unknown"} / ${participant.playerTwo?.fullName ?? "Unknown"})`;
  }
  return `${participant.playerOne?.fullName ?? "Unknown"} / ${participant.playerTwo?.fullName ?? "Unknown"}`;
}
