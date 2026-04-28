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
import { DeleteTournamentAlertDialog } from "@/components/tournaments/delete-tournament-alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/app/tournaments/")({
  component: TournamentsPage,
});

function TournamentsPage() {
  const { data: tournaments } = useQuery(convexQuery(api.tournaments.listAll, {}));
  const createTournament = useMutation(api.tournaments.create);
  const deleteTournament = useMutation(api.tournaments.remove);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<{
    id: Id<"tournaments">;
    name: string;
  } | null>(null);

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

  const handleDelete = async () => {
    if (tournamentToDelete) {
      await deleteTournament({ tournamentId: tournamentToDelete.id });
      setTournamentToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white bg-slate-500 px-3 py-1 text-xs font-black tracking-wider text-white uppercase">
            <TrophyIcon className="size-3" />
            Completed
          </span>
        );
      case "inProgress":
        return (
          <span className="border-tournament-lime bg-tournament-lime text-tournament-blue inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-black tracking-wider uppercase">
            <span className="relative flex h-2 w-2">
              <span className="bg-tournament-blue absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-tournament-blue relative inline-flex h-2 w-2 rounded-full" />
            </span>
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-neutral-300 bg-neutral-100 px-3 py-1 text-xs font-black tracking-wider text-neutral-600 uppercase">
            Upcoming
          </span>
        );
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
            <Card
              key={tournament._id}
              className="group overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              {/* Card Header Bar */}
              <div className="bg-tournament-blue flex items-center justify-between px-5 py-3">
                {getStatusBadge(tournament.status)}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-red-500 hover:text-white"
                  onClick={() =>
                    setTournamentToDelete({
                      id: tournament._id,
                      name: tournament.name,
                    })
                  }
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>

              <CardContent className="p-5">
                <Link
                  to="/app/tournaments/$slug"
                  params={{ slug: tournament.slug }}
                  className="block"
                >
                  {/* Tournament Name */}
                  <h3 className="text-tournament-blue group-hover:text-tournament-blue/80 mb-3 text-xl font-black tracking-tight uppercase transition-colors">
                    {tournament.name}
                  </h3>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="text-tournament-lime size-4" />
                      <span className="font-semibold">{formatDate(tournament.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UsersIcon className="text-tournament-lime size-4" />
                      <span className="font-semibold">Organizer: {tournament.organizerName}</span>
                    </div>
                  </div>

                  {tournament.description && (
                    <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                      {tournament.description}
                    </p>
                  )}

                  {/* Action Hint */}
                  <div className="text-tournament-blue mt-5 flex items-center gap-2 text-sm font-black tracking-wide uppercase">
                    VIEW DETAILS
                    <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteTournamentAlertDialog
        open={!!tournamentToDelete}
        onOpenChange={() => setTournamentToDelete(null)}
        onConfirm={handleDelete}
        tournamentName={tournamentToDelete?.name}
      />
    </div>
  );
}
