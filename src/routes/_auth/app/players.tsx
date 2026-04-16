import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { UserIcon, Trash2Icon, UsersIcon } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-tournament-blue uppercase italic">
            Players
          </h1>
          <p className="text-sm text-muted-foreground">Manage players and view their stats</p>
        </div>
        <CreatePlayerDialog />
      </div>
      {/* Players Grid */}
      <Card className="overflow-hidden border-4 border-tournament-blue py-0">
        <CardHeader className="border-b-4 border-tournament-blue bg-tournament-blue px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-5 text-tournament-lime" />
              <h2 className="text-lg font-black tracking-wide text-white uppercase">All Players</h2>
            </div>
            <span className="rounded-full bg-tournament-lime px-3 py-1 text-xs font-black text-tournament-blue">
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
                  className="group relative flex items-center gap-4 rounded-xl border-2 border-slate-100 bg-slate-50 p-4 transition-all hover:border-tournament-blue hover:shadow-md"
                >
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tournament-blue text-lg font-black text-white">
                    {getInitials(player.firstName, player.lastName)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-tournament-blue">
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
