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
      <AlertDialogContent
        className="overflow-hidden border-4 p-0"
        style={{ borderColor: "#dc2626" }}
      >
        <AlertDialogHeader className="bg-red-600 p-6">
          <AlertDialogTitle className="flex items-center gap-3 text-2xl font-black text-white uppercase italic">
            <Trash2Icon className="size-7" />
            DELETE GAME
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="px-6 py-4">
          <AlertDialogDescription className="text-base font-semibold text-slate-700">
            Are you sure you want to delete this completed game? This action cannot be undone.
          </AlertDialogDescription>
        </div>
        <AlertDialogFooter className="gap-3 px-6 pb-6">
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
