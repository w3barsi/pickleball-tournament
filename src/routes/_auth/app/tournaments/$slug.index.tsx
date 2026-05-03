import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Loader2Icon,
  UsersIcon,
  SwordsIcon,
  TrophyIcon,
  LayoutGridIcon,
  RadioIcon,
  ClockIcon,
  PlayIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CalendarIcon,
} from "lucide-react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { TournamentSettingsDialog } from "@/components/tournaments/tournament-settings-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/app/tournaments/$slug/")({
  component: TournamentDetailPage,
  loader: async ({ params, context }) => {
    const tournament = await context.queryClient.ensureQueryData(
      convexQuery(api.tournaments.getBySlug, { slug: params.slug }),
    );
    if (tournament) {
      await Promise.all([
        context.queryClient.ensureQueryData(
          convexQuery(api.brackets.listByTournament, { tournamentId: tournament._id }),
        ),
        context.queryClient.ensureQueryData(
          convexQuery(api.categoryParticipants.listByTournament, {
            tournamentId: tournament._id,
          }),
        ),
      ]);
    }
  },
});

function getMatchStatusBadge(status: string, isLive?: boolean | null) {
  if (isLive) {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
        <RadioIcon className="mr-1 size-3" />
        Live
      </Badge>
    );
  }
  switch (status) {
    case "inProgress":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          <PlayIcon className="mr-1 size-3" />
          Live
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2Icon className="mr-1 size-3" />
          Completed
        </Badge>
      );
    case "abandoned":
      return <Badge variant="destructive">Abandoned</Badge>;
    default:
      return (
        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
          <ClockIcon className="mr-1 size-3" />
          Scheduled
        </Badge>
      );
  }
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

function getMatchScore(match: {
  matchSets: { winnerTeam?: 1 | 2 | null }[];
  status: string;
  winnerParticipantId?: Id<"categoryParticipants"> | null;
}) {
  if (match.matchSets.length > 0) {
    const p1Wins = match.matchSets.filter((s) => s.winnerTeam === 1).length;
    const p2Wins = match.matchSets.filter((s) => s.winnerTeam === 2).length;
    return `${p1Wins} - ${p2Wins}`;
  }
  if (match.status === "completed" && match.winnerParticipantId) {
    return "W - L";
  }
  return "—";
}

function formatDate(ts: number | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TournamentDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: tournament } = useQuery(convexQuery(api.tournaments.getBySlug, { slug }));
  const { data: matches } = useQuery(
    convexQuery(
      api.matches.listByTournament,
      tournament ? { tournamentId: tournament._id } : "skip",
    ),
  );
  const { data: categories } = useQuery(
    convexQuery(
      api.categories.listByTournament,
      tournament ? { tournamentId: tournament._id } : "skip",
    ),
  );
  const { data: brackets } = useQuery(
    convexQuery(
      api.brackets.listByTournament,
      tournament ? { tournamentId: tournament._id } : "skip",
    ),
  );
  const { data: categoryParticipants } = useQuery(
    convexQuery(
      api.categoryParticipants.listByTournament,
      tournament ? { tournamentId: tournament._id } : "skip",
    ),
  );

  if (!tournament) {
    return (
      <div className="py-20 text-center">
        <Loader2Icon className="mx-auto size-10 animate-spin text-slate-400" />
        <p className="mt-4 text-lg font-bold text-slate-500">Loading tournament...</p>
      </div>
    );
  }

  const liveMatches = matches?.filter((m) => m.isLive || m.status === "inProgress") ?? [];
  const completedMatches = matches?.filter((m) => m.status === "completed") ?? [];

  const totalParticipants =
    categoryParticipants?.reduce((sum, cp) => sum + cp.participants.length, 0) ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <HeaderCard>
        <div>
          <HeaderCardHeading>{tournament.name}</HeaderCardHeading>
          <HeaderCardDescription>{`Organized by ${tournament.organizerName}`}</HeaderCardDescription>
        </div>
        <TournamentSettingsDialog tournamentId={tournament._id} tournamentName={tournament.name} />
      </HeaderCard>

      {/* Tournament Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CalendarIcon className="text-tournament-lime size-5" />
            <CardTitle className="text-sm font-medium">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-black">
              {formatDate(tournament.date)}
              {tournament.endDate ? ` - ${formatDate(tournament.endDate)}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {tournament.venueName ?? "No venue set"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <LayoutGridIcon className="text-tournament-lime size-5" />
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{categories?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">{brackets?.length ?? 0} brackets total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <SwordsIcon className="text-tournament-lime size-5" />
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{matches?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">
              {liveMatches.length > 0 ? (
                <span className="font-medium text-red-600">{liveMatches.length} live</span>
              ) : (
                `${completedMatches.length} completed`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <UsersIcon className="text-tournament-lime size-5" />
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{totalParticipants}</p>
            <p className="text-sm text-muted-foreground">
              across {categories?.length ?? 0} categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <RadioIcon className="size-5 text-red-500" />
            <h2 className="text-lg font-bold">Live Matches</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {liveMatches.map((match) => (
              <Card
                key={match._id}
                className="cursor-pointer border-red-200 transition-shadow hover:shadow-md"
                onClick={() =>
                  navigate({ to: "/app/matches/$matchId", params: { matchId: match._id } })
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {match.category?.name ?? "Category"} · {match.bracket?.name ?? "Bracket"}
                    </CardTitle>
                    {getMatchStatusBadge(match.status, match.isLive)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {getParticipantName(match.participant1, match.category?.type ?? "singles")}
                    </span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span className="text-right font-medium">
                      {getParticipantName(match.participant2, match.category?.type ?? "singles")}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 font-mono text-2xl font-bold">
                    <span>{getMatchScore(match)}</span>
                  </div>
                  {match.courtNumber && (
                    <p className="text-center text-xs text-muted-foreground">
                      Court {match.courtNumber}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Matches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Matches</h2>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={
              <Link to="/app/tournaments/$slug/categories" params={{ slug }}>
                View all categories
              </Link>
            }
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>

        {matches === undefined ? (
          <div className="py-12 text-center">
            <Loader2Icon className="mx-auto size-8 animate-spin text-slate-400" />
            <p className="mt-2 text-muted-foreground">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <SwordsIcon className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 text-lg font-bold">No matches yet</p>
              <p className="text-sm text-muted-foreground">
                Create categories and brackets to start adding matches
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Recent completed + upcoming scheduled */}
            {matches
              .filter((m) => m.status === "completed" || m.status === "scheduled")
              .slice(0, 10)
              .map((match) => {
                const isP1Winner = match.winnerParticipantId === match.participant1?._id;
                const isP2Winner = match.winnerParticipantId === match.participant2?._id;
                return (
                  <Card
                    key={match._id}
                    className="cursor-pointer transition-shadow hover:shadow-sm"
                    onClick={() =>
                      navigate({ to: "/app/matches/$matchId", params: { matchId: match._id } })
                    }
                  >
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="w-24 shrink-0">
                        {getMatchStatusBadge(match.status, match.isLive)}
                      </div>
                      <div className="flex flex-1 items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">
                            {match.category?.name ?? "Category"} ·{" "}
                            {match.bracket?.name ?? "Bracket"}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={isP1Winner ? "font-semibold text-green-700" : ""}>
                              {getParticipantName(
                                match.participant1,
                                match.category?.type ?? "singles",
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">vs</span>
                            <span className={isP2Winner ? "font-semibold text-green-700" : ""}>
                              {getParticipantName(
                                match.participant2,
                                match.category?.type ?? "singles",
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-mono text-lg font-semibold">{getMatchScore(match)}</p>
                          {match.courtNumber && (
                            <p className="text-xs text-muted-foreground">
                              Court {match.courtNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

            {matches.length > 10 && (
              <p className="text-center text-sm text-muted-foreground">
                +{matches.length - 10} more matches
              </p>
            )}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Categories</h2>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={
              <Link to="/app/tournaments/$slug/categories" params={{ slug }}>
                View all
              </Link>
            }
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>

        {categories === undefined ? (
          <div className="py-12 text-center">
            <Loader2Icon className="mx-auto size-8 animate-spin text-slate-400" />
            <p className="mt-2 text-muted-foreground">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <TrophyIcon className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 text-lg font-bold">No categories yet</p>
              <p className="text-sm text-muted-foreground">Create a category to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((category) => {
              const categoryBrackets =
                brackets?.filter((b) => b.category._id === category._id) ?? [];
              return (
                <Card key={category._id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">{category.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={
                          <Link
                            to="/app/tournaments/$slug/categories/$categoryId"
                            params={{ slug, categoryId: category._id }}
                          >
                            View
                          </Link>
                        }
                      >
                        <ChevronRightIcon className="size-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {categoryBrackets.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No brackets yet</p>
                    ) : (
                      <div className="space-y-2">
                        {categoryBrackets.map((bracket) => (
                          <Button
                            key={bracket._id}
                            variant="outline"
                            className="h-auto w-full justify-between px-3 py-2"
                            nativeButton={false}
                            render={
                              <Link
                                to="/app/brackets/$bracketId"
                                params={{ bracketId: bracket._id }}
                              />
                            }
                          >
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium">{bracket.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Stage {bracket.stage} ·{" "}
                                {bracket.format === "roundRobin"
                                  ? "Round Robin"
                                  : "Single Elimination"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <UsersIcon className="size-3" />
                                {bracket.participantCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <SwordsIcon className="size-3" />
                                {bracket.matchCount}
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Participants by Category */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Participants</h2>

        {categoryParticipants === undefined ? (
          <div className="py-12 text-center">
            <Loader2Icon className="mx-auto size-8 animate-spin text-slate-400" />
            <p className="mt-2 text-muted-foreground">Loading participants...</p>
          </div>
        ) : categoryParticipants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UsersIcon className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 text-lg font-bold">No participants yet</p>
              <p className="text-sm text-muted-foreground">
                Register participants in each category
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {categoryParticipants.map(({ category, participants }) => (
              <Card key={category._id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{category.name}</CardTitle>
                    <Badge variant="secondary">{participants.length} registered</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {participants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No participants registered yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {participants.slice(0, 20).map((p) => {
                        const name =
                          category.type === "singles"
                            ? ((p as { player?: { fullName: string } | null }).player?.fullName ??
                              "Unknown")
                            : (() => {
                                const dp = p as {
                                  pair?: { teamName?: string } | null;
                                  playerOne?: { fullName: string } | null;
                                  playerTwo?: { fullName: string } | null;
                                };
                                if (dp.pair?.teamName) {
                                  return dp.pair.teamName;
                                }
                                return `${dp.playerOne?.fullName ?? "Unknown"} / ${dp.playerTwo?.fullName ?? "Unknown"}`;
                              })();
                        return (
                          <Badge
                            key={p._id}
                            variant="outline"
                            className="px-2 py-1 text-sm font-normal"
                          >
                            {name}
                          </Badge>
                        );
                      })}
                      {participants.length > 20 && (
                        <Badge variant="secondary" className="px-2 py-1 text-sm">
                          +{participants.length - 20} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
