import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarIcon, ChevronRightIcon, MapPinIcon, TrophyIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export const Route = createFileRoute("/_public/")({
  component: HomePage,
  loader: async (ctx) => {
    await ctx.context.queryClient.ensureQueryData(convexQuery(api.public.tournaments.list, {}));
  },
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

function HomePage() {
  const { data: tournaments } = useQuery(convexQuery(api.public.tournaments.list, {}));

  const upcoming = tournaments?.filter((t) => t.status === "upcoming") || [];
  const inProgress = tournaments?.filter((t) => t.status === "inProgress") || [];
  const completed = tournaments?.filter((t) => t.status === "completed") || [];

  const featured = inProgress[0] ?? upcoming[0] ?? completed[0];
  const remaining = tournaments?.filter((t) => t._id !== featured?._id) || [];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1a3a2a] px-4 py-20 text-white md:px-6 md:py-28">
        {/* Animated mesh background */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-1/4 -left-1/4 h-[60vw] w-[60vw] rounded-full opacity-30 blur-3xl"
            style={{
              background: "radial-gradient(circle, #4ade80 0%, transparent 70%)",
              animation: "float-1 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -right-1/4 -bottom-1/4 h-[50vw] w-[50vw] rounded-full opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(circle, #a3e635 0%, transparent 70%)",
              animation: "float-2 10s ease-in-out infinite",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 h-[40vw] w-[40vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-3xl"
            style={{
              background: "radial-gradient(circle, #22c55e 0%, transparent 70%)",
              animation: "float-3 12s ease-in-out infinite",
            }}
          />
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="flex flex-col items-start gap-6 md:max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-400" />
              </span>
              Live Tournament Tracking
            </div>

            <h1 className="font-heading text-5xl leading-[0.95] font-black tracking-tight uppercase md:text-7xl lg:text-8xl">
              Where
              <br />
              <span className="text-lime-400 italic">Champions</span>
              <br />
              Are Made
            </h1>

            <p className="max-w-md text-lg leading-relaxed text-white/70">
              Discover and follow pickleball tournaments. Real-time scores, brackets, and live match
              updates — all in one place.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-6 py-3 text-sm font-bold text-[#1a3a2a] transition-transform hover:scale-105 active:scale-95"
              >
                Host a Tournament
                <ChevronRightIcon className="size-4" />
              </Link>
              <a
                href="#tournaments"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                Browse Events
              </a>
            </div>

            {/* Stats strip */}
            <div className="mt-8 flex gap-8 border-t border-white/10 pt-6">
              <div>
                <div className="font-heading text-2xl font-black">{upcoming.length}</div>
                <div className="text-xs tracking-wider text-white/50 uppercase">Upcoming</div>
              </div>
              <div>
                <div className="font-heading text-2xl font-black">{inProgress.length}</div>
                <div className="text-xs tracking-wider text-white/50 uppercase">Live Now</div>
              </div>
              <div>
                <div className="font-heading text-2xl font-black">{completed.length}</div>
                <div className="text-xs tracking-wider text-white/50 uppercase">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tournament */}
      {featured && (
        <section className="relative mx-4 -mt-8 md:mx-6">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-foreground/10">
              <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(featured.status)}
                    <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      Featured Event
                    </span>
                  </div>
                  <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
                    {featured.name}
                  </h2>
                  <p className="max-w-xl text-muted-foreground">
                    {featured.description ||
                      "Join us for an exciting pickleball tournament experience."}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon className="size-4" />
                      {formatDateRange(featured.date, featured.endDate)}
                    </span>
                    {featured.venueName && (
                      <span className="flex items-center gap-1.5">
                        <MapPinIcon className="size-4" />
                        {featured.venueName}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <UsersIcon className="size-4" />
                      {featured.organizerName}
                    </span>
                  </div>
                </div>
                <Link to="/tournaments/$slug" params={{ slug: featured.slug }} className="shrink-0">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform hover:scale-105">
                    View Tournament
                    <ChevronRightIcon className="size-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tournament Grid */}
      <section id="tournaments" className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-heading text-3xl font-black tracking-tight md:text-4xl">
                Tournaments
              </h2>
              <p className="mt-2 text-muted-foreground">
                Discover public pickleball events near you
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrophyIcon className="size-4" />
              {tournaments?.length || 0} events found
            </div>
          </div>

          {tournaments === undefined ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-muted"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : remaining.length === 0 && !featured ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <TrophyIcon className="size-7 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold">No tournaments yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Check back soon for upcoming pickleball events, or sign in to create your own.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {remaining.map((tournament) => (
                <TournamentListItem key={tournament._id} tournament={tournament} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30 px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-[#1a3a2a] px-6 py-16 text-center text-white md:px-12 md:py-24">
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute top-0 right-0 h-[30vw] w-[30vw] rounded-full opacity-20 blur-3xl"
                style={{
                  background: "radial-gradient(circle, #4ade80 0%, transparent 70%)",
                }}
              />
              <div
                className="absolute bottom-0 left-0 h-[25vw] w-[25vw] rounded-full opacity-15 blur-3xl"
                style={{
                  background: "radial-gradient(circle, #a3e635 0%, transparent 70%)",
                }}
              />
            </div>

            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="font-heading text-3xl font-black tracking-tight md:text-5xl">
                Ready to Compete?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/70">
                Create your own tournament, manage registrations, and track matches in real-time.
                It&apos;s free to get started.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-8 py-3 text-sm font-bold text-[#1a3a2a] transition-transform hover:scale-105 active:scale-95"
                >
                  Start Your Tournament
                  <ChevronRightIcon className="size-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
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
        @keyframes float-3 {
          0%, 100% { transform: translate(-50%, -50%); }
          50% { transform: translate(-45%, -55%); }
        }
      `}</style>
    </div>
  );
}

function TournamentListItem({
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
  };
}) {
  return (
    <Link to="/tournaments/$slug" params={{ slug: tournament.slug }}>
      <div className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all duration-200 hover:bg-muted/40 sm:gap-6 sm:p-5">
        {/* Status accent strip */}
        <div
          className={`hidden h-12 w-1 shrink-0 rounded-full sm:block ${getStatusAccent(tournament.status)}`}
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-tournament-blue sm:text-lg">
              {tournament.name}
            </h3>
            {getStatusBadge(tournament.status)}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
              {formatDateRange(tournament.date, tournament.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <UsersIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
              {tournament.organizerName}
            </span>
            {tournament.venueName && (
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
                {tournament.venueName}
              </span>
            )}
          </div>

          {tournament.description && (
            <p className="mt-2 line-clamp-1 text-sm text-muted-foreground/80">
              {tournament.description}
            </p>
          )}
        </div>

        {/* Arrow */}
        <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
