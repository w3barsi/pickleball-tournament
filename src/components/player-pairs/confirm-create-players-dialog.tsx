"use client";

import { api } from "@convex/_generated/api.js";
import { useMutation } from "convex/react";
import { UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

interface PendingPlayers {
  teamName?: string;
  player1: { name: string; id: string | null };
  player2: { name: string; id: string | null };
}

interface ConfirmCreatePlayersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: PendingPlayers;
  onConfirm: (playerOneId: string, playerTwoId: string) => Promise<void>;
}

export function ConfirmCreatePlayersDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: ConfirmCreatePlayersDialogProps) {
  const createPlayer = useMutation(api.app.players.create);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const missingNames: string[] = [];
  if (!pending.player1.id) missingNames.push(pending.player1.name);
  if (!pending.player2.id) missingNames.push(pending.player2.name);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const createdIds: Record<string, string> = {};

      await Promise.all(
        missingNames.map(async (name) => {
          const id = await createPlayer({ fullName: name, nickname: "" });
          createdIds[name] = id;
        }),
      );

      const playerOneId = pending.player1.id ?? createdIds[pending.player1.name];
      const playerTwoId = pending.player2.id ?? createdIds[pending.player2.name];

      if (!playerOneId || !playerTwoId) {
        throw new Error("Failed to resolve player IDs");
      }

      await onConfirm(playerOneId, playerTwoId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create players");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <DialogClose
            disabled={isSubmitting}
            render={
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            }
          />
          <Button disabled={isSubmitting} onClick={handleConfirm}>
            {isSubmitting ? "Creating..." : "Create Players & Pair"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
