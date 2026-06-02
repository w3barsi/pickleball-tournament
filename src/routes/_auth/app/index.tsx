import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TrophyIcon, PlusIcon, ChevronRightIcon, CalendarIcon, UsersIcon } from "lucide-react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/app/")({
  component: AppIndex,
});

function AppIndex() {
  const { data: tournaments } = useQuery(convexQuery(api.app.tournaments.listAll, {}));

  const upcomingTournaments = tournaments?.filter((t) => t.status === "upcoming") || [];

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

        <Button
          nativeButton={false}
          render={
            <Link to="/app/tournaments">
              <TrophyIcon />
              VIEW TOURNAMENTS
            </Link>
          }
        />
      </HeaderCard>

      {/* Tournaments Card */}
      <div className="grid gap-2 md:grid-cols-2">
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
                  nativeButton={false}
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
                    className="group flex items-center justify-between rounded-lg border bg-muted/50 p-2 transition-colors hover:bg-muted"
                  >
                    <div>
                      <p>{tournament.name}</p>
                      <div className="flex flex-col gap-1 text-muted-foreground">
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
                    nativeButton={false}
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
      </div>
    </div>
  );
}
