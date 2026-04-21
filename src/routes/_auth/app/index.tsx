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

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
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
      <HeaderCard>
        <div>
          <HeaderCardHeading>PICKLEBALL TOURNAMENT</HeaderCardHeading>
          <HeaderCardDescription>
            Manage tournaments, track matches, and score games in real-time
          </HeaderCardDescription>
        </div>

        <div className="flex flex-col gap-3 px-4">
          <Button
            render={
              <Link to="/app/tournaments">
                <TrophyIcon />
                VIEW TOURNAMENTS
              </Link>
            }
          />

          <Button
            variant="outline"
            size="lg"
            render={
              <Link to="/app/games">
                <GamepadIcon className="size-5" />
                VIEW MATCHES
              </Link>
            }
          />
        </div>
      </HeaderCard>

      {/* Quick Stats / Overview */}
      <div className="grid gap-2 md:grid-cols-2">
        {/* Tournaments Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrophyIcon className="size-5" />
                <h2 className="text-lg font-semibold">Tournaments</h2>
              </div>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                {tournaments?.length || 0} Total
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingTournaments.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No upcoming tournaments</p>
                <Button
                  variant="outline"
                  className="mt-3"
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
                    to="/app/tournaments/$slug"
                    params={{ slug: tournament.slug }}
                    className="group flex items-center justify-between rounded-xl border bg-muted/50 p-3 transition-colors hover:bg-muted"
                  >
                    <div>
                      <p className="">{tournament.name}</p>
                      <div className="items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="size-3" />
                          {formatDate(tournament.date)}
                        </span>
                        <span className="flex items-center gap-2">
                          <UsersIcon className="size-3" />
                          {tournament.organizerName}
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </Link>
                ))}
                {upcomingTournaments.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full"
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GamepadIcon className="size-5" />
                <h2 className="text-lg font-semibold">Live Matches</h2>
              </div>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                {liveMatches.length} Live
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {liveMatches.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No matches in progress</p>
                <Button
                  variant="outline"
                  className="mt-3"
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
                    className="group flex items-center justify-between rounded-xl border bg-muted/50 p-3 transition-colors hover:bg-muted"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                        </span>
                        <p className="font-medium">Match in Progress</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Score: {match.team1Score} - {match.team2Score}
                      </p>
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </Link>
                ))}
                {liveMatches.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full"
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
