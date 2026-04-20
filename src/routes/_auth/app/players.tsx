import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { UserIcon, Trash2Icon, UsersIcon } from "lucide-react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { Heading } from "@/components/heading";
import { CreatePlayerDialog } from "@/components/players/create-player-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/app/players")({
  component: PlayersPage,
  loader: async (ctx) => {
    await ctx.context.queryClient.ensureQueryData(convexQuery(api.players.listAll, {}));
  },
});

function PlayersPage() {
  const { data: players } = useQuery(convexQuery(api.players.listAll, {}));
  const deletePlayer = useMutation(api.players.remove);

  const handleDelete = async (playerId: Id<"player">) => {
    if (!confirm("Are you sure you want to delete this player?")) return;
    await deletePlayer({ playerId });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
      <Card className="border-tournament-blue overflow-hidden border-4 py-0">
        <CardHeader className="border-tournament-blue bg-tournament-blue border-b-4 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="text-tournament-lime size-5" />
              <h2 className="text-lg font-black tracking-wide text-white uppercase">All Players</h2>
            </div>
            <span className="bg-tournament-lime text-tournament-blue rounded-full px-3 py-1 text-xs font-black">
              {players?.length || 0} Total
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {!players || players.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <UserIcon className="size-8 text-slate-400" />
              </div>
              <p className="text-lg font-bold text-slate-700">No players yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first player to get started
              </p>
              <CreatePlayerDialog />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {players.map((player) => (
                <div
                  key={player._id}
                  className="group hover:border-tournament-blue relative flex items-center gap-4 rounded-xl border-2 border-slate-100 bg-slate-50 p-4 transition-all hover:shadow-md"
                >
                  {/* Avatar */}
                  <div className="bg-tournament-blue flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black text-white">
                    {getInitials(player.firstName, player.lastName)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-tournament-blue truncate font-bold">
                      {player.firstName} {player.lastName}
                    </p>
                    {player.nickname && (
                      <p className="truncate text-sm text-slate-500">
                        &ldquo;{player.nickname}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(player._id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    title="Delete player"
                  >
                    <Trash2Icon className="size-4 text-slate-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
