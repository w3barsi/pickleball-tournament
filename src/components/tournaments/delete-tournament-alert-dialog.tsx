import { Trash2Icon } from "lucide-react";

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

interface DeleteTournamentAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  tournamentName?: string;
}

export function DeleteTournamentAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  tournamentName,
}: DeleteTournamentAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
          <AlertDialogDescription className="">
            Are you sure you want to delete{" "}
            <span className="">{tournamentName || "this tournament"}</span>? This action cannot be
            undone and will permanently delete all categories, brackets, participants, and matches
            associated with this tournament.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="">
          <AlertDialogCancel
            render={
              <Button variant="outline" className="">
                Cancel
              </Button>
            }
          />
          <AlertDialogAction
            className="gap-2 bg-red-600 tracking-wide text-white uppercase hover:bg-red-700"
            onClick={onConfirm}
          >
            <Trash2Icon className="size-4" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
