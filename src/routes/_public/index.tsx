import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarIcon, ChevronRightIcon, MapPinIcon, TrophyIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

  const featured = tournaments?.find((t) => t.isFeaturedEvent === true);
  const remaining = tournaments?.filter((t) => t._id !== featured?._id) || [];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1a3a2a] px-4 pt-8 pb-16 text-white md:px-6 md:pt-10 md:pb-20">
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
              Are forged
            </h1>

            <p className="max-w-md text-lg leading-relaxed text-white/70">
              Discover and follow pickleball tournaments. Real-time scores, brackets, and live match
              updates — all in one place.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                size="xl"
                variant="green"
                render={<a href="#tournaments" />}
                nativeButton={false}
              >
                Browse Tournaments
                <ChevronRightIcon className="size-4" />
              </Button>
              <Button
                size="xl"
                variant="ghost-border"
                render={<a href="#featured-event" />}
                nativeButton={false}
              >
                View Featured
              </Button>
            </div>

            <Separator className="bg-white/10" />
            {/* Statsstrip */}
            <div className="flex gap-8">
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
        <section id="featured-event" className="relative mx-4 -mt-8 scroll-mt-[15vh] md:mx-6">
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
                <Button
                  className="px-6"
                  nativeButton={false}
                  render={<Link to="/tournaments/$slug" params={{ slug: featured.slug }} />}
                >
                  View Tournament
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tournament Grid */}
      <section id="tournaments" className="scroll-mt-[15vh] px-4 py-16 md:px-6 md:py-24">
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
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] animate-pulse rounded-2xl bg-muted"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : tournaments.length === 0 ? (
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
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {remaining.map((tournament) => (
                <TournamentCard key={tournament._id} tournament={tournament} />
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
                Find Your Next Tournament
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/70">
                Discover upcoming pickleball events, follow live matches, and never miss a
                championship moment.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button
                  variant="green"
                  nativeButton={false}
                  render={<a href="#tournaments" />}
                  size="xl"
                >
                  Browse Events
                  <ChevronRightIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost-border"
                  size="xl"
                  nativeButton={false}
                  render={<Link to="/login" />}
                >
                  Sign In
                </Button>
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

const PLACEHOLDER_IMAGE = "https://drive.darcygraphix.com/8fc5bdd6-81e2-4479-9ac9-0791d7efae15";

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
