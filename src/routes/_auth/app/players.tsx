import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { UserIcon, Trash2Icon, UsersIcon, FlagIcon } from "lucide-react";
import { useState } from "react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { CreatePlayerDialog } from "@/components/players/create-player-dialog";
import { RequestDeletionDialog } from "@/components/request-deletion-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthSuspense } from "@/lib/auth/hooks";

export const Route = createFileRoute("/_auth/app/players")({
  component: PlayersPage,
  loader: async (ctx) => {
    await ctx.context.queryClient.ensureQueryData(convexQuery(api.players.listAll, {}));
  },
});

function PlayersPage() {
  const { isAdmin } = useAuthSuspense();
  const { data: players } = useQuery(convexQuery(api.players.listAll, {}));
  const deletePlayer = useMutation(api.players.remove);
  const [playerToDelete, setPlayerToDelete] = useState<Id<"player"> | null>(null);
  const [playerToRequestDelete, setPlayerToRequestDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = async () => {
    if (!playerToDelete) return;
    await deletePlayer({ playerId: playerToDelete });
    setPlayerToDelete(null);
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderCard>
        <div>
          <HeaderCardHeading>Players</HeaderCardHeading>
          <HeaderCardDescription>
            Manage tournaments, track matches, and score games in real-time
          </HeaderCardDescription>
        </div>

        <CreatePlayerDialog />
      </HeaderCard>
      {/* Players Grid */}
      <Card className="overflow-hidden">
        <CardHeader className="">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-5" />
              <h2 className="text-lg font-semibold tracking-wide">All Players</h2>
            </div>
            <span className="rounded-full px-3 py-1 text-xs font-medium">
              {players?.length || 0} Total
            </span>
          </div>
        </CardHeader>
        <CardContent className="">
          {!players || players.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <UserIcon className="size-8" />
              </div>
              <p className="text-lg font-bold">No players yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first player to get started
              </p>
              <CreatePlayerDialog />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-15"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Nickname</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-15"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player._id}>
                    <TableCell>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                        {getInitials(player.fullName)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{player.fullName}</TableCell>
                    <TableCell>{player.nickname ? `"${player.nickname}"` : "—"}</TableCell>
                    <TableCell>
                      {new Date(player._creationTime).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Button
                          onClick={() => setPlayerToDelete(player._id)}
                          variant="ghost"
                          size="icon-lg"
                          title="Delete player"
                        >
                          <Trash2Icon />
                        </Button>
                      ) : (
                        <Button
                          onClick={() =>
                            setPlayerToRequestDelete({ id: player._id, name: player.fullName })
                          }
                          variant="ghost"
                          size="icon-lg"
                          title="Request deletion"
                        >
                          <FlagIcon />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!playerToDelete} onOpenChange={() => setPlayerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this player? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RequestDeletionDialog
        targetType="player"
        targetId={playerToRequestDelete?.id ?? ""}
        targetName={playerToRequestDelete?.name ?? ""}
        open={!!playerToRequestDelete}
        onOpenChange={(open) => {
          if (!open) setPlayerToRequestDelete(null);
        }}
      />
    </div>
  );
}
