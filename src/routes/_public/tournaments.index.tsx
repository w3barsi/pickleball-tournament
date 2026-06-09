import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarIcon,
  ChevronRightIcon,
  MapPinIcon,
  SearchIcon,
  TrophyIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_public/tournaments/")({
  component: TournamentsPage,
  loader: async (ctx) => {
    await ctx.context.queryClient.ensureQueryData(convexQuery(api.public.tournaments.list, {}));
  },
});

const PLACEHOLDER_IMAGE = "https://drive.darcygraphix.com/8fc5bdd6-81e2-4479-9ac9-0791d7efae15";

type FilterTab = "all" | "upcoming" | "inProgress" | "completed";

function TournamentsPage() {
  const { data: tournaments } = useQuery(convexQuery(api.public.tournaments.list, {}));
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const all = tournaments ?? [];

  const filtered = all.filter((t) => {
    const matchesFilter = activeFilter === "all" || t.status === activeFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.venueName?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
      t.organizerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingCount = all.filter((t) => t.status === "upcoming").length;
  const inProgressCount = all.filter((t) => t.status === "inProgress").length;
  const completedCount = all.filter((t) => t.status === "completed").length;

  return (
    <div className="flex flex-col">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-[#1a3a2a] px-4 pt-8 pb-12 text-white md:px-6 md:pt-10 md:pb-16">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-1/4 right-0 h-[45vw] w-[45vw] rounded-full opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(circle, #4ade80 0%, transparent 70%)",
              animation: "float-1 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -bottom-1/4 left-0 h-[40vw] w-[40vw] rounded-full opacity-15 blur-3xl"
            style={{
              background: "radial-gradient(circle, #a3e635 0%, transparent 70%)",
              animation: "float-2 10s ease-in-out infinite",
            }}
          />
          {/* Noise texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <Button
            variant="ghost-border"
            className="border-0"
            nativeButton={false}
            render={
              <Link to="/">
                <ChevronRightIcon className="size-4 rotate-180" />
                Home
              </Link>
            }
          />

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-heading text-4xl leading-[0.95] font-black tracking-tight uppercase md:text-5xl lg:text-6xl">
                All <span className="text-lime-400 italic">Tournaments</span>
              </h1>
              <p className="mt-3 max-w-lg text-lg leading-relaxed text-white/60">
                Browse every pickleball event — from upcoming registrations to live matches and past
                champions.
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="font-heading text-2xl font-black md:text-3xl">{all.length}</div>
                <div className="text-xs tracking-wider text-white/50 uppercase">Total</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <div className="font-heading text-2xl font-black text-amber-400 md:text-3xl">
                  {inProgressCount}
                </div>
                <div className="text-xs tracking-wider text-white/50 uppercase">Live</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <div className="font-heading text-2xl font-black text-emerald-400 md:text-3xl">
                  {upcomingCount}
                </div>
                <div className="text-xs tracking-wider text-white/50 uppercase">Upcoming</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Controls Bar */}
      <section className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 md:py-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <FilterTabButton
              active={activeFilter === "all"}
              count={all.length}
              label="All"
              onClick={() => setActiveFilter("all")}
            />
            <FilterTabButton
              active={activeFilter === "upcoming"}
              count={upcomingCount}
              label="Upcoming"
              onClick={() => setActiveFilter("upcoming")}
              accent="emerald"
            />
            <FilterTabButton
              active={activeFilter === "inProgress"}
              count={inProgressCount}
              label="In Progress"
              onClick={() => setActiveFilter("inProgress")}
              accent="amber"
            />
            <FilterTabButton
              active={activeFilter === "completed"}
              count={completedCount}
              label="Completed"
              onClick={() => setActiveFilter("completed")}
              accent="slate"
            />
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border bg-muted/50 py-2 pr-9 pl-9 text-sm transition-colors outline-none focus:border-lime-400/50 focus:bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Tournament Grid */}
      <section className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          {/* Results count */}
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
              <span className="font-semibold text-foreground">{all.length}</span> events
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrophyIcon className="size-4" />
              {filtered.length} results
            </div>
          </div>

          {tournaments === undefined ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] animate-pulse rounded-2xl bg-muted"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <TrophyIcon className="size-7 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold">No tournaments found</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : "Check back soon for upcoming pickleball events."}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((tournament) => (
                <TournamentCard key={tournament._id} tournament={tournament} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CSS Animations */}
      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 15px); }
        }
      `}</style>
    </div>
  );
}

/* ---------- Filter Tab Button ---------- */

function FilterTabButton({
  active,
  count,
  label,
  onClick,
  accent,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
  accent?: "emerald" | "amber" | "slate";
}) {
  const accentClasses =
    accent === "emerald"
      ? "data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-700 data-[active=true]:border-emerald-200"
      : accent === "amber"
        ? "data-[active=true]:bg-amber-50 data-[active=true]:text-amber-700 data-[active=true]:border-amber-200"
        : accent === "slate"
          ? "data-[active=true]:bg-slate-100 data-[active=true]:text-slate-700 data-[active=true]:border-slate-200"
          : "data-[active=true]:bg-lime-50 data-[active=true]:text-[#1a3a2a] data-[active=true]:border-lime-200";

  return (
    <button
      onClick={onClick}
      data-active={active}
      className={`relative inline-flex items-center gap-2 rounded-full border border-transparent px-3.5 py-1.5 text-sm font-medium transition-all ${
        active
          ? `${accentClasses} shadow-sm`
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
      <span
        className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
          active
            ? accent === "emerald"
              ? "bg-emerald-200 text-emerald-800"
              : accent === "amber"
                ? "bg-amber-200 text-amber-800"
                : accent === "slate"
                  ? "bg-slate-200 text-slate-800"
                  : "bg-lime-200 text-[#1a3a2a]"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* ---------- Tournament Card ---------- */

function TournamentCard({
  tournament,
}: {
  tournament: {
    _id: Id<"tournaments">;
    name: string;
    slug: string;
    status: string;
    date: number;
    endDate?: number;
    organizerName: string;
    venueName?: string;
    description?: string;
    bannerImageUrl?: string;
  };
}) {
  const imageUrl = tournament.bannerImageUrl || PLACEHOLDER_IMAGE;

  return (
    <Link to="/tournaments/$slug" params={{ slug: tournament.slug }}>
      <div className="group relative isolate aspect-[4/3] overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
        {/* Background image */}
        <img
          src={imageUrl}
          alt={tournament.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Top status badge */}
        <div className="absolute top-4 left-4 z-10">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm ${
              tournament.status === "completed"
                ? "bg-slate-500/80"
                : tournament.status === "inProgress"
                  ? "bg-amber-500/80"
                  : "bg-emerald-500/80"
            }`}
          >
            {tournament.status === "inProgress"
              ? "In Progress"
              : tournament.status === "completed"
                ? "Completed"
                : "Upcoming"}
          </span>
        </div>

        {/* Bottom content */}
        <div className="absolute right-0 bottom-0 left-0 z-10 p-5">
          <h3 className="font-heading text-lg leading-tight font-bold text-white">
            {tournament.name}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 shrink-0 text-white/70" />
              {formatDateRange(tournament.date, tournament.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <UsersIcon className="size-3.5 shrink-0 text-white/70" />
              {tournament.organizerName}
            </span>
            {tournament.venueName && (
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 shrink-0 text-white/70" />
                {tournament.venueName}
              </span>
            )}
          </div>

          {tournament.description && (
            <p className="mt-2 line-clamp-2 text-sm text-white/70">{tournament.description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ---------- Helpers ---------- */

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
