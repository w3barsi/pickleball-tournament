"use client";

import { UserPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmCreatePlayersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingNames: string[];
  confirmLabel?: string;
  onConfirm: () => void;
}

export function ConfirmCreatePlayersDialog({
  open,
  onOpenChange,
  missingNames,
  confirmLabel,
  onConfirm,
}: ConfirmCreatePlayersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserPlusIcon className="size-5 text-muted-foreground" />
            <DialogTitle>Create Missing Players</DialogTitle>
          </div>
          <DialogDescription>
            The following {missingNames.length === 1 ? "player doesn't" : "players don't"} exist yet
            and will be created before forming the pair.
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-1 rounded-lg bg-muted/50 px-6 py-3 text-sm">
          {missingNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={onConfirm}>{confirmLabel ?? "Create Players & Pair"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
