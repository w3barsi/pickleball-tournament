import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Loader2Icon, SettingsIcon, Trash2Icon, UserIcon, UsersIcon } from "lucide-react";
import { useState } from "react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { InviteManagerForm } from "@/components/tournaments/invite-manager-form";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/hooks";

export const Route = createFileRoute("/_auth/app/tournaments/$slug/")({
  component: TournamentDetailPage,
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.tournaments.getBySlug, { slug: params.slug }),
    );
  },
});

function TournamentDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
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

  const removeManager = useMutation(api.tournaments.removeManager);
  const deleteTournament = useMutation(api.tournaments.remove);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!tournament) {
    return (
      <div className="py-20 text-center">
        <Loader2Icon className="mx-auto size-10 animate-spin text-slate-400" />
        <p className="mt-4 text-lg font-bold text-slate-500">Loading tournament...</p>
      </div>
    );
  }

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
      <HeaderCard>
        <div>
          <HeaderCardHeading>{tournament.name}</HeaderCardHeading>
          <HeaderCardDescription>{`Organized by ${tournament.organizerName}`}</HeaderCardDescription>
        </div>
        {canEdit && (
          <Dialog
            open={isSettingsOpen}
            onOpenChange={(open) => {
              setIsSettingsOpen(open);
              setDeleteConfirmText("");
            }}
          >
            <DialogTrigger
              render={
                <Button variant="secondary" size="icon" className="rounded-full">
                  <SettingsIcon className="size-5" />
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UsersIcon className="size-5" />
                  Tournament Managers
                </DialogTitle>
                <DialogDescription>Manage who can edit this tournament.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
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
                <InviteManagerForm tournamentId={tournament._id} />

                {/* Danger Zone */}
                <div className="-mx-4 -my-6 mt-4 flex flex-col gap-2 rounded-b-xl bg-destructive/10 p-4">
                  <div>
                    <h4 className="text-sm font-semibold text-red-600">Danger Zone</h4>
                  </div>

                  <div className="flex flex-col gap-2 pb-2">
                    <p className="text-sm text-muted-foreground">
                      Please type <span className="font-semibold">{tournament.name}</span> to
                      confirm.
                    </p>
                    <Input
                      className="bg-primary-foreground"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={`Type "${tournament.name}" to confirm`}
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger
                      disabled={deleteConfirmText !== tournament.name}
                      render={
                        <Button variant="destructive" className="w-full rounded-md">
                          <Trash2Icon className="mr-2 size-4" />
                          Delete Tournament
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you really sure you want to delete this tournament? This action cannot
                          be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={isDeleting}
                          onClick={async () => {
                            setIsDeleting(true);
                            try {
                              await deleteTournament({ tournamentId: tournament._id });
                              setDeleteConfirmText("");
                              setIsSettingsOpen(false);
                              navigate({ to: "/app/tournaments" });
                            } finally {
                              setIsDeleting(false);
                            }
                          }}
                        >
                          {isDeleting ? <Loader2Icon className="size-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </HeaderCard>

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
