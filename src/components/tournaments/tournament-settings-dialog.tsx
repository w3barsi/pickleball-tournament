import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Loader2Icon, SettingsIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

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

interface TournamentSettingsDialogProps {
  tournamentId: Id<"tournaments">;
  tournamentName: string;
}

export function TournamentSettingsDialog({
  tournamentId,
  tournamentName,
}: TournamentSettingsDialogProps) {
  const navigate = useNavigate();

  const deleteTournament = useMutation(api.tournaments.remove);

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) setDeleteConfirmText("");
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
          <DialogTitle>Tournament Settings</DialogTitle>
          <DialogDescription>Configure your tournament.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Danger Zone */}
          <div className="-mx-4 -my-6 mt-4 flex flex-col gap-2 rounded-b-xl bg-destructive/10 p-4">
            <div>
              <h4 className="text-sm font-semibold text-red-600">Danger Zone</h4>
            </div>

            <div className="flex flex-col gap-2 pb-2">
              <p className="text-sm text-muted-foreground">
                Please type "<span className="font-semibold">{tournamentName}</span>" to confirm.
              </p>
              <Input
                className="bg-primary-foreground"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`Type "${tournamentName}" to confirm`}
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                disabled={deleteConfirmText !== tournamentName}
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
                    Are you really sure you want to delete this tournament? This action cannot be
                    undone.
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
                        await deleteTournament({ tournamentId });
                        setDeleteConfirmText("");
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
  );
}
