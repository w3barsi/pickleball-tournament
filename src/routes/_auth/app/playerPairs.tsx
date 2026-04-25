import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { UserPlusIcon, Trash2Icon, UsersIcon, FlagIcon } from "lucide-react";
import { useState } from "react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { CreatePlayerPairDialog } from "@/components/player-pairs/create-player-pair-dialog";
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

export const Route = createFileRoute("/_auth/app/playerPairs")({
  component: PlayerPairsPage,
  loader: async (ctx) => {
    await ctx.context.queryClient.ensureQueryData(convexQuery(api.playerPairs.listAll, {}));
  },
});

function PlayerPairsPage() {
  const { isAdmin } = useRouteContext({ from: "/_auth/app" });
  const { data: pairs } = useQuery(convexQuery(api.playerPairs.listAll, {}));
  const deletePair = useMutation(api.playerPairs.remove);
  const [pairToDelete, setPairToDelete] = useState<Id<"playerPair"> | null>(null);
  const [pairToRequestDelete, setPairToRequestDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = async () => {
    if (!pairToDelete) return;
    await deletePair({ pairId: pairToDelete });
    setPairToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderCard>
        <div>
          <HeaderCardHeading>Player Pairs</HeaderCardHeading>
          <HeaderCardDescription>
            Manage doubles teams and track pair statistics
          </HeaderCardDescription>
        </div>

        <CreatePlayerPairDialog />
      </HeaderCard>

      {/* Pairs Grid */}
      <Card className="overflow-hidden">
        <CardHeader className="">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-5" />
              <h2 className="text-lg font-semibold tracking-wide">All Pairs</h2>
            </div>
            <span className="rounded-full px-3 py-1 text-xs font-medium">
              {pairs?.length || 0} Total
            </span>
          </div>
        </CardHeader>
        <CardContent className="">
          {!pairs || pairs.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <UserPlusIcon className="size-8" />
              </div>
              <p className="text-lg font-bold">No pairs yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first player pair to get started
              </p>
              <div className="mt-4">
                <CreatePlayerPairDialog />
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Player 1</TableHead>
                  <TableHead>Player 2</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="text-right">Losses</TableHead>
                  <TableHead className="w-15"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pairs.map((pair) => (
                  <TableRow key={pair._id}>
                    <TableCell className="font-medium">{pair.teamName || "—"}</TableCell>
                    <TableCell>{pair.playerOneName}</TableCell>
                    <TableCell>{pair.playerTwoName}</TableCell>
                    <TableCell className="text-right">{pair.wins}</TableCell>
                    <TableCell className="text-right">{pair.losses}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Button
                          onClick={() => setPairToDelete(pair._id)}
                          variant="ghost"
                          size="icon-lg"
                          title="Delete pair"
                        >
                          <Trash2Icon />
                        </Button>
                      ) : (
                        <Button
                          onClick={() =>
                            setPairToRequestDelete({
                              id: pair._id,
                              name:
                                pair.teamName || `${pair.playerOneName} & ${pair.playerTwoName}`,
                            })
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

      <AlertDialog open={!!pairToDelete} onOpenChange={() => setPairToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pair</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pair? This action cannot be undone.
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
        targetType="playerPair"
        targetId={pairToRequestDelete?.id ?? ""}
        targetName={pairToRequestDelete?.name ?? ""}
        open={!!pairToRequestDelete}
        onOpenChange={(open) => {
          if (!open) setPairToRequestDelete(null);
        }}
      />
    </div>
  );
}
