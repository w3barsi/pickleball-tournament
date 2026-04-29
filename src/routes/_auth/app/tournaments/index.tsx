import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  PlusIcon,
  Trash2Icon,
  TrophyIcon,
  CalendarIcon,
  UsersIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useState } from "react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { CreateTournamentDialog } from "@/components/tournaments/create-tournament-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/app/tournaments/")({
  component: TournamentsPage,
});

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-slate-50 font-normal text-slate-600 hover:bg-slate-50">
          Completed
        </Badge>
      );
    case "inProgress":
      return (
        <Badge className="bg-blue-50 font-normal text-blue-600 hover:bg-blue-50">In Progress</Badge>
      );
    default:
      return (
        <Badge className="bg-green-50 font-normal text-green-600 hover:bg-green-50">Upcoming</Badge>
      );
  }
}

function TournamentCard({
  tournament,
  deleteTournament,
  formatDate,
}: {
  tournament: {
    _id: Id<"tournaments">;
    name: string;
    slug: string;
    status: string;
    date: number;
    organizerName: string;
    description?: string;
  };
  deleteTournament: (args: { tournamentId: Id<"tournaments"> }) => void;
  formatDate: (timestamp: number) => string;
}) {
  return (
    <Link to="/app/tournaments/$slug" params={{ slug: tournament.slug }}>
      <Card className="group hover:-translate-y-0.2 overflow-hidden transition-all duration-300 hover:shadow">
        <CardContent className="">
          <div className="flex items-center justify-between pb-2">
            {getStatusBadge(tournament.status)}
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" size="icon" onClick={(e) => e.stopPropagation()} />
                }
              >
                <Trash2Icon className="size-4" />
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{" "}
                    <span className="font-semibold">{tournament.name}</span>? This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTournament({ tournamentId: tournament._id });
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <h3 className="group-hover:text-tournament-blue mb-4 text-lg font-medium tracking-tight text-foreground transition-colors">
            {tournament.name}
          </h3>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="size-4 text-muted-foreground/70" />
              <span>{formatDate(tournament.date)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <UsersIcon className="size-4 text-muted-foreground/70" />
              <span>Organizer: {tournament.organizerName}</span>
            </div>
            {tournament.description && <p className="line-clamp-2">{tournament.description}</p>}
          </div>
        </CardContent>
        <CardFooter className="gap-1">
          View details
          <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
        </CardFooter>
      </Card>
    </Link>
  );
}

function TournamentsPage() {
  const { data: tournaments } = useQuery(convexQuery(api.tournaments.listAll, {}));
  const createTournament = useMutation(api.tournaments.create);
  const deleteTournament = useMutation(api.tournaments.remove);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreate = async (data: {
    name: string;
    slug: string;
    date: number;
    endDate?: number;
    description?: string;
    organizerName: string;
    venueName?: string;
    venueAddress?: string;
    registrationDeadline?: number;
    isPublic?: boolean;
  }) => {
    try {
      await createTournament(data);
      return {};
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("already exists")) {
        return {
          error: "A tournament with this slug already exists. Please choose a different slug.",
        };
      }
      return { error: `Failed to create tournament: ${message}` };
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}

      <HeaderCard>
        <div className="text-center sm:text-left">
          <HeaderCardHeading>TOURNAMENTS</HeaderCardHeading>
          <HeaderCardDescription>Manage Your Pickleball Events</HeaderCardDescription>
        </div>
        <CreateTournamentDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreate={handleCreate}
        />
      </HeaderCard>

      {/* Tournaments List */}
      {tournaments === undefined ? (
        <div className="py-16 text-center">
          <div className="bg-tournament-blue/20 mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full">
            <TrophyIcon className="text-tournament-blue size-10" />
          </div>
          <p className="text-tournament-blue mt-6 text-xl font-black tracking-wide uppercase">
            Loading Tournaments...
          </p>
        </div>
      ) : tournaments.length === 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <TrophyIcon className="size-8" />
            </div>
            <p className="text-lg font-bold">No tournaments yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first tournament to get started
            </p>
            <Button className="mt-4" variant="secondary" onClick={() => setIsCreateOpen(true)}>
              <PlusIcon className="size-4" />
              Create Tournament
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament._id}
              tournament={tournament}
              deleteTournament={deleteTournament}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
