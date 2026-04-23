import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Loader2Icon, PlusIcon, Trash2Icon, UserIcon, UsersIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/hooks";

export const Route = createFileRoute("/_auth/app/tournaments/$slug")({
  component: TournamentDetailPage,
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.tournaments.getBySlug, { slug: params.slug }),
    );
  },
});

function TournamentDetailPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const { data: tournament } = useQuery(convexQuery(api.tournaments.getBySlug, { slug }));
  const { data: managers } = useQuery(
    convexQuery(
      api.tournaments.listManagers,
      tournament ? { tournamentId: tournament._id } : "skip",
    ),
  );
  const { data: canEdit } = useQuery(
    convexQuery(api.tournaments.canEdit, tournament ? { tournamentId: tournament._id } : "skip"),
  );

  const inviteManager = useMutation(api.tournaments.inviteManager);
  const removeManager = useMutation(api.tournaments.removeManager);

  const [inviteUserId, setInviteUserId] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  if (!tournament) {
    return (
      <div className="py-20 text-center">
        <Loader2Icon className="mx-auto size-10 animate-spin text-slate-400" />
        <p className="mt-4 text-lg font-bold text-slate-500">Loading tournament...</p>
      </div>
    );
  }

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteUserId.trim() || !canEdit) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      await inviteManager({
        tournamentId: tournament._id,
        userId: inviteUserId.trim(),
      });
      setInviteUserId("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to invite manager";
      setInviteError(message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveManager = async (targetUserId: string) => {
    if (!canEdit) return;
    try {
      await removeManager({
        tournamentId: tournament._id,
        userId: targetUserId,
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-tournament-blue relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-12">
        <div className="bg-tournament-lime pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20" />

        <div className="relative z-10">
          <h1 className="text-tournament-lime text-4xl leading-none font-black tracking-tight uppercase italic [text-shadow:3px_3px_0px_rgba(0,0,0,0.25)] sm:text-5xl">
            {tournament.name}
          </h1>
          <p className="mt-3 text-sm font-bold tracking-[0.2em] text-white/90 uppercase">
            {`Organized by ${tournament.organizerName}`}
          </p>
        </div>
      </div>

      {/* Managers Section */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UsersIcon className="size-5" />
              Tournament Managers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manager List */}
            <div className="space-y-2">
              {managers?.length === 0 && (
                <p className="text-sm text-muted-foreground">No managers found.</p>
              )}
              {managers?.map((manager) => (
                <div
                  key={manager._id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <UserIcon className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">{manager.userId}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {manager.role}
                        {manager.userId === user?._id && " (you)"}
                      </p>
                    </div>
                  </div>
                  {manager.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleRemoveManager(manager.userId)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInvite} className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <label htmlFor="invite-user-id" className="text-sm font-medium">
                  Invite Manager
                </label>
                <Input
                  id="invite-user-id"
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  placeholder="Paste user's Convex ID..."
                  disabled={isInviting}
                />
              </div>
              <Button type="submit" disabled={isInviting || !inviteUserId.trim()}>
                {isInviting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <PlusIcon className="size-4" />
                )}
                Invite
              </Button>
            </form>
            {inviteError && <p className="text-sm font-semibold text-red-600">{inviteError}</p>}
          </CardContent>
        </Card>
      )}

      {/* Placeholder for tournament content */}
      <div className="rounded-2xl border-4 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
        <p className="text-xl text-neutral-500">Tournament Details Coming Soon</p>
        <p className="mt-2 text-sm text-neutral-400">
          This page will show categories, brackets, and matches for this tournament.
        </p>
      </div>
    </div>
  );
}
