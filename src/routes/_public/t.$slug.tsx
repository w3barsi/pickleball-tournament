import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronRightIcon,
  CircleIcon,
  MapPinIcon,
  SwordsIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const Route = createFileRoute("/_public/t/$slug")({
  component: TournamentDetailPage,
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(
      convexQuery(api.public.tournaments.getDetails, { slug: params.slug }),
    );

    if (!data) throw notFound();

    return data;
  },
  notFoundComponent: () => <div>Tournament not found</div>,
});

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-slate-100 font-normal text-slate-600 hover:bg-slate-100">
          Completed
        </Badge>
      );
    case "inProgress":
      return (
        <Badge className="bg-amber-50 font-normal text-amber-600 hover:bg-amber-50">
          In Progress
        </Badge>
      );
    default:
      return (
        <Badge className="bg-emerald-50 font-normal text-emerald-600 hover:bg-emerald-50">
          Upcoming
        </Badge>
      );
  }
}

function getStatusAccent(status: string) {
  switch (status) {
    case "completed":
      return "bg-slate-500";
    case "inProgress":
      return "bg-amber-500";
    default:
      return "bg-emerald-500";
  }
}

function formatDateRange(start: number, end?: number | undefined) {
  const startDate = new Date(start);
  const startStr = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (!end) return startStr;
  const endDate = new Date(end);
  const endStr = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startStr} — ${endStr}`;
}

function formatBracketFormat(format: string) {
  switch (format) {
    case "roundRobin":
      return "Round Robin";
    case "singleElimination":
      return "Single Elimination";
    default:
      return format;
  }
}

function TournamentDetailPage() {
  const { slug } = Route.useParams();
  const { data } = useQuery(convexQuery(api.public.tournaments.getDetails, { slug }));

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-tournament-blue border-t-transparent" />
      </div>
    );
  }

  const { tournament, categories, players } = data;
  const totalBrackets = categories.reduce((sum, c) => sum + c.brackets.length, 0);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1a3a2a] px-4 py-16 text-white md:px-6 md:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-1/4 -right-1/4 h-[50vw] w-[50vw] rounded-full opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(circle, #4ade80 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-1/4 -left-1/4 h-[40vw] w-[40vw] rounded-full opacity-15 blur-3xl"
            style={{
              background: "radial-gradient(circle, #a3e635 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="size-4" />
            All Tournaments
          </Link>

          <div
            className={`mb-4 inline-block h-1 w-16 rounded-full ${getStatusAccent(tournament.status)}`}
          />

          <h1 className="font-heading text-4xl leading-[1.05] font-black tracking-tight md:text-5xl lg:text-6xl">
            {tournament.name}
          </h1>

          {tournament.description && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/70">
              {tournament.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <CalendarIcon className="size-4 shrink-0" />
              {formatDateRange(tournament.date, tournament.endDate)}
            </span>
            {tournament.venueName && (
              <span className="flex items-center gap-2">
                <MapPinIcon className="size-4 shrink-0" />
                {tournament.venueName}
                {tournament.venueAddress && `, ${tournament.venueAddress}`}
              </span>
            )}
            <span className="flex items-center gap-2">
              <UsersIcon className="size-4 shrink-0" />
              {tournament.organizerName}
            </span>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b bg-background px-4 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 py-5">
          <div className="flex items-center gap-3">{getStatusBadge(tournament.status)}</div>
          <div className="hidden h-8 w-px bg-border md:block" />
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <SwordsIcon className="size-4 text-muted-foreground" />
              <span className="font-semibold">{categories.length}</span>
              <span className="text-muted-foreground">Categories</span>
            </div>
            <div className="flex items-center gap-2">
              <TrophyIcon className="size-4 text-muted-foreground" />
              <span className="font-semibold">{totalBrackets}</span>
              <span className="text-muted-foreground">Brackets</span>
            </div>
            <div className="flex items-center gap-2">
              <UsersIcon className="size-4 text-muted-foreground" />
              <span className="font-semibold">{players.length}</span>
              <span className="text-muted-foreground">Players</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left: Categories & Brackets */}
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Categories & Brackets
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Competition divisions and bracket configurations
              </p>
            </div>

            {categories.length === 0 ? (
              <div className="rounded-2xl border border-dashed py-16 text-center">
                <CircleIcon className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No categories have been set up yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {categories.map(({ category, brackets }) => (
                  <CategorySection key={category._id} category={category} brackets={brackets} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Players sidebar */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">Players</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {players.length} registered across all categories
              </p>
            </div>

            {players.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No players registered yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
                {players.map((player) => (
                  <PlayerChip key={player._id} player={player} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  category,
  brackets,
}: {
  category: {
    name: string;
    type: string;
    rating: string;
    category: string;
    maxParticipants?: number;
  };
  brackets: Array<{
    name: string;
    label?: string;
    format: string;
    status: string;
    maxParticipants?: number;
    numberOfSets: number;
    pointsPerGame: number;
    winByTwo: boolean;
    participantCount: number;
    matchCount: number;
  }>;
}) {
  const typeLabel = category.type === "singles" ? "Singles" : "Doubles";
  const ratingLabel = category.rating.charAt(0).toUpperCase() + category.rating.slice(1);
  const categoryLabel = category.category.charAt(0).toUpperCase() + category.category.slice(1);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-bold">{category.name}</h3>
              {category.maxParticipants && (
                <Badge variant="outline" className="text-xs">
                  Max {category.maxParticipants}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium">
                {typeLabel}
              </span>
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium">
                {ratingLabel}
              </span>
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium">
                {categoryLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <UsersIcon className="size-3.5" />
              {brackets.reduce((s, b) => s + b.participantCount, 0)} entrants
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {brackets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No brackets in this category yet.</p>
        ) : (
          brackets.map((bracket) => (
            <div
              key={bracket.name + bracket.format}
              className="group flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 transition-colors hover:bg-muted/60 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-sm font-semibold">{bracket.name}</span>
                  {bracket.label && (
                    <span className="text-xs text-muted-foreground">{bracket.label}</span>
                  )}
                  <BracketStatusDot status={bracket.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SpecPill icon={<SwordsIcon className="size-3" />}>
                    {formatBracketFormat(bracket.format)}
                  </SpecPill>
                  <SpecPill icon={<TrophyIcon className="size-3" />}>
                    {bracket.numberOfSets} sets
                  </SpecPill>
                  <SpecPill icon={<CircleIcon className="size-3" />}>
                    Race to {bracket.pointsPerGame}
                  </SpecPill>
                  {bracket.winByTwo && (
                    <SpecPill icon={<ChevronRightIcon className="size-3" />}>Win by 2</SpecPill>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground sm:text-right">
                <div>
                  <div className="font-semibold text-foreground">{bracket.participantCount}</div>
                  <div>Players</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <div className="font-semibold text-foreground">{bracket.matchCount}</div>
                  <div>Matches</div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function BracketStatusDot({ status }: { status: string }) {
  const color =
    status === "completed"
      ? "bg-slate-400"
      : status === "inProgress"
        ? "bg-amber-400"
        : "bg-emerald-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} title={status} />;
}

function SpecPill({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
      {icon}
      {children}
    </span>
  );
}

function PlayerChip({
  player,
}: {
  player: {
    _id: string;
    fullName: string;
    nickname?: string;
    photoUrl?: string;
  };
}) {
  const initials = player.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-card p-2.5 transition-colors hover:bg-muted/50">
      {player.photoUrl ? (
        <img
          src={player.photoUrl}
          alt={player.fullName}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tournament-blue/10 text-xs font-bold text-tournament-blue">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm leading-tight font-medium">{player.fullName}</p>
        {player.nickname && (
          <p className="truncate text-xs text-muted-foreground">{player.nickname}</p>
        )}
      </div>
    </div>
  );
}
