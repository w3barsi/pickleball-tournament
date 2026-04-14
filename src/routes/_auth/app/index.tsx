import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrophyIcon,
  GamepadIcon,
  PlusIcon,
  ChevronRightIcon,
  CalendarIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/app/")({
  component: AppIndex,
});

function AppIndex() {
  const { data: tournaments } = useQuery(convexQuery(api.tournaments.listAll, {}));
  const { data: matches } = useQuery(convexQuery(api.scoring.listAllMatches, {}));

  const upcomingTournaments = tournaments?.filter((t) => t.status === "upcoming") || [];
  const liveMatches = matches?.filter((m) => m.status === "inProgress") || [];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-tournament-blue px-6 py-12 sm:px-10 sm:py-16">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-tournament-lime opacity-20" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white opacity-15" />

        <div className="relative z-10 text-center sm:text-left">
          <h1 className="text-4xl leading-none font-black tracking-tight text-tournament-lime uppercase italic [text-shadow:3px_3px_0px_rgba(0,0,0,0.25)] sm:text-5xl lg:text-6xl">
            PICKLEBALL
            <br />
            TOURNAMENT
          </h1>
          <p className="mt-4 text-base font-bold tracking-[0.15em] text-white/90 uppercase sm:text-lg">
            Manage tournaments, track matches, and score games in real-time
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              className="group gap-2 rounded-full border-4 border-white bg-tournament-lime px-6 py-5 text-base font-black tracking-wide text-tournament-blue uppercase shadow-xl transition-all hover:scale-105 hover:text-white"
              render={
                <Link to="/app/tournaments">
                  <TrophyIcon className="size-5" />
                  VIEW TOURNAMENTS
                  <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              }
            />
            <Button
              variant="outline"
              className="gap-2 rounded-full border-4 border-white bg-transparent px-6 py-5 text-base font-black tracking-wide text-white uppercase hover:bg-white hover:text-tournament-blue"
              render={
                <Link to="/app/games">
                  <GamepadIcon className="size-5" />
                  VIEW MATCHES
                </Link>
              }
            />
          </div>
        </div>
      </div>

      {/* Quick Stats / Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tournaments Card */}
        <Card className="overflow-hidden border-4 border-tournament-blue py-0">
          <CardHeader className="border-b-4 border-tournament-blue bg-tournament-blue px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrophyIcon className="size-5 text-tournament-lime" />
                <h2 className="text-lg font-black tracking-wide text-white uppercase">
                  Tournaments
                </h2>
              </div>
              <span className="rounded-full bg-tournament-lime px-3 py-1 text-xs font-black text-tournament-blue">
                {tournaments?.length || 0} Total
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {upcomingTournaments.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No upcoming tournaments</p>
                <Button
                  variant="outline"
                  className="mt-3 gap-2 border-2 border-tournament-blue font-bold"
                  render={
                    <Link to="/app/tournaments">
                      <PlusIcon className="size-4" />
                      Create Tournament
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTournaments.slice(0, 3).map((tournament) => (
                  <Link
                    key={tournament._id}
                    to="/app/tournaments/$id"
                    params={{ id: tournament._id }}
                    className="group flex items-center justify-between rounded-xl border-2 border-slate-100 bg-slate-50 p-3 transition-all hover:border-tournament-lime"
                  >
                    <div>
                      <p className="font-bold text-tournament-blue">{tournament.name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="size-3" />
                          {formatDate(tournament.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="size-3" />
                          {tournament.organizerName}
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon className="size-4 text-slate-300 transition-colors group-hover:text-tournament-lime" />
                  </Link>
                ))}
                {upcomingTournaments.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full font-bold text-tournament-blue"
                    render={
                      <Link to="/app/tournaments">
                        View All {upcomingTournaments.length} Upcoming
                      </Link>
                    }
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Matches Card */}
        <Card className="overflow-hidden border-4 border-tournament-lime py-0">
          <CardHeader className="border-b-4 border-tournament-lime bg-tournament-lime px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GamepadIcon className="size-5 text-tournament-blue" />
                <h2 className="text-lg font-black tracking-wide text-tournament-blue uppercase">
                  Live Matches
                </h2>
              </div>
              <span className="rounded-full bg-tournament-blue px-3 py-1 text-xs font-black text-white">
                {liveMatches.length} Live
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {liveMatches.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No matches in progress</p>
                <Button
                  variant="outline"
                  className="mt-3 gap-2 border-2 border-tournament-lime font-bold"
                  render={
                    <Link to="/app/games">
                      <PlusIcon className="size-4" />
                      Start Match
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {liveMatches.slice(0, 3).map((match) => (
                  <Link
                    key={match._id}
                    to="/app/g/$id"
                    params={{ id: match._id }}
                    className="group flex items-center justify-between rounded-xl border-2 border-slate-100 bg-slate-50 p-3 transition-all hover:border-tournament-blue"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                        </span>
                        <p className="font-bold text-tournament-blue">Match in Progress</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        Score: {match.team1Score} - {match.team2Score}
                      </p>
                    </div>
                    <ChevronRightIcon className="size-4 text-slate-300 transition-colors group-hover:text-tournament-blue" />
                  </Link>
                ))}
                {liveMatches.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full font-bold text-tournament-blue"
                    render={<Link to="/app/games">View All {liveMatches.length} Live Matches</Link>}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
