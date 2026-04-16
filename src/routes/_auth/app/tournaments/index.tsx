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

import { HeaderCard } from "@/components/header-card";
import { Heading } from "@/components/heading";
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
    description?: string;
    organizerName: string;
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
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-tournament-lime bg-tournament-lime px-3 py-1 text-xs font-black tracking-wider text-tournament-blue uppercase">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tournament-blue opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-tournament-blue" />
            </span>
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-300 bg-slate-100 px-3 py-1 text-xs font-black tracking-wider text-slate-600 uppercase">
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
    <div className="space-y-8">
      {/* Hero Header */}

      <HeaderCard>
        <div className="relative z-10 flex w-full flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center sm:text-left">
            <Heading>TOURNAMENTS</Heading>
            <p className="mt-3 text-sm font-bold tracking-[0.2em] text-white/90 uppercase">
              Manage Your Pickleball Events
            </p>
          </div>
          <CreateTournamentDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onCreate={handleCreate}
          />
        </div>
      </HeaderCard>

      {/* Tournaments List */}
      {tournaments === undefined ? (
        <div className="py-16 text-center">
          <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-tournament-blue/20">
            <TrophyIcon className="size-10 text-tournament-blue" />
          </div>
          <p className="mt-6 text-xl font-black tracking-wide text-tournament-blue uppercase">
            Loading Tournaments...
          </p>
        </div>
      ) : tournaments.length === 0 ? (
        <Card className="overflow-hidden border-4 border-dashed border-tournament-blue/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-tournament-blue">
              <TrophyIcon className="size-10 text-tournament-lime" />
            </div>
            <p className="mt-6 text-2xl font-black tracking-tight text-tournament-blue uppercase">
              No Tournaments Yet
            </p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              Create your first pickleball tournament to get started
            </p>
            <Button
              className="mt-6 gap-2 rounded-full border-4 border-tournament-blue bg-tournament-lime px-6 py-5 font-black tracking-wide text-tournament-blue uppercase"
              onClick={() => setIsCreateOpen(true)}
            >
              <PlusIcon className="size-5" />
              Create First Tournament
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card
              key={tournament._id}
              className="group overflow-hidden border-4 border-slate-200 py-0 transition-all duration-300 hover:border-tournament-lime hover:shadow-xl"
            >
              {/* Card Header Bar */}
              <div className="flex items-center justify-between bg-tournament-blue px-5 py-3">
                {getStatusBadge(tournament.status)}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white hover:bg-red-500 hover:text-white"
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
                  <h3 className="mb-3 text-xl font-black tracking-tight text-tournament-blue uppercase transition-colors group-hover:text-tournament-blue/80">
                    {tournament.name}
                  </h3>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <CalendarIcon className="size-4 text-tournament-lime" />
                      <span className="font-semibold">{formatDate(tournament.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <UsersIcon className="size-4 text-tournament-lime" />
                      <span className="font-semibold">Organizer: {tournament.organizerName}</span>
                    </div>
                  </div>

                  {tournament.description && (
                    <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                      {tournament.description}
                    </p>
                  )}

                  {/* Action Hint */}
                  <div className="mt-5 flex items-center gap-2 text-sm font-black tracking-wide text-tournament-blue uppercase">
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
