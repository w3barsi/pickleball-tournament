"use client";

import { api } from "@convex/_generated/api.js";
import { useMutation } from "convex/react";
import { UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
  const createPlayer = useMutation(api.players.create);
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <UserPlusIcon className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle>Create Missing Players</AlertDialogTitle>
          <AlertDialogDescription>
            The following {missingNames.length === 1 ? "player doesn't" : "players don't"} exist yet
            and will be created before forming the pair.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="list-disc space-y-1 rounded-lg bg-muted/50 px-6 py-3 text-sm">
          {missingNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            render={
              <Button disabled={isSubmitting} onClick={handleConfirm}>
                {isSubmitting ? "Creating..." : "Create Players & Pair"}
              </Button>
            }
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
