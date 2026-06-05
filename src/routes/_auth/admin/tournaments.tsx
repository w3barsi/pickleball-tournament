import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Doc } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { CalendarIcon, Loader2Icon, StarIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminEditTournamentDialog } from "@/components/admin/edit-tournament-dialog";
import { DeleteTournamentAlertDialog } from "@/components/tournaments/delete-tournament-alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_auth/admin/tournaments")({
  component: TournamentsPage,
  loader: async (ctx) => {
    await ctx.context.queryClient.ensureQueryData(convexQuery(api.admin.tournaments.list, {}));
  },
});

function TournamentsPage() {
  const { data: tournaments, isLoading } = useQuery(convexQuery(api.admin.tournaments.list, {}));
  const setFeatured = useMutation(api.admin.tournaments.setFeatured);
  const unsetFeatured = useMutation(api.admin.tournaments.unsetFeatured);
  const remove = useMutation(api.admin.tournaments.remove);

  const [deletingTournament, setDeletingTournament] = useState<Doc<"tournaments"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settingFeaturedId, setSettingFeaturedId] = useState<string | null>(null);

  const handleSetFeatured = async (tournamentId: string) => {
    setSettingFeaturedId(tournamentId);
    try {
      await setFeatured({ tournamentId: tournamentId as any });
      toast.success("Tournament set as featured event");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set featured event");
    } finally {
      setSettingFeaturedId(null);
    }
  };

  const handleUnsetFeatured = async (tournamentId: string) => {
    setSettingFeaturedId(tournamentId);
    try {
      await unsetFeatured({ tournamentId: tournamentId as any });
      toast.success("Tournament unfeatured");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unfeature tournament");
    } finally {
      setSettingFeaturedId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingTournament) return;
    setIsDeleting(true);
    try {
      await remove({ tournamentId: deletingTournament._id });
      toast.success("Tournament deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete tournament");
    } finally {
      setIsDeleting(false);
      setDeletingTournament(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Tournaments</h1>
        <p className="text-muted-foreground">
          View, edit, and manage all tournaments across the platform.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Public</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2Icon className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : !tournaments || tournaments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No tournaments found.
                </TableCell>
              </TableRow>
            ) : (
              tournaments.map((tournament) => (
                <TableRow key={tournament._id}>
                  <TableCell className="font-medium">{tournament.name}</TableCell>
                  <TableCell className="text-muted-foreground">{tournament.slug}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm">
                      <CalendarIcon className="size-3.5 text-muted-foreground" />
                      {formatDate(tournament.date)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(tournament.status)}</TableCell>
                  <TableCell>
                    {tournament.isPublic ? (
                      <Badge variant="outline" className="font-normal">
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {tournament.isFeaturedEvent ? (
                      <StarIcon className="size-4 fill-amber-400 text-amber-400" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <AdminEditTournamentDialog tournament={tournament} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          tournament.isFeaturedEvent
                            ? handleUnsetFeatured(tournament._id)
                            : handleSetFeatured(tournament._id)
                        }
                        disabled={settingFeaturedId === tournament._id}
                      >
                        {settingFeaturedId === tournament._id ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : tournament.isFeaturedEvent ? (
                          <StarIcon className="size-4 fill-amber-400 text-amber-400" />
                        ) : (
                          <StarIcon className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingTournament(tournament)}
                      >
                        <Trash2Icon className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteTournamentAlertDialog
        open={deletingTournament !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingTournament(null);
        }}
        onConfirm={handleDelete}
        tournamentName={deletingTournament?.name}
      />
    </div>
  );
}

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
