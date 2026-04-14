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

interface DeleteGameAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteGameAlertDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteGameAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-red-600">
        <AlertDialogHeader className="bg-red-600">
          <AlertDialogTitle>
            <Trash2Icon className="size-7" />
            DELETE GAME
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          Are you sure you want to delete this completed game? This action cannot be undone.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-2 border-slate-300 font-bold uppercase">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 font-black tracking-wide uppercase hover:bg-red-700"
          >
            Delete Game
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
