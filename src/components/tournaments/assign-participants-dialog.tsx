"use client";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { Loader2Icon, CheckIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AssignParticipantsDialogProps {
  bracketId: Id<"brackets">;
  categoryId: Id<"categories">;
}

export function AssignParticipantsDialog({ bracketId, categoryId }: AssignParticipantsDialogProps) {
  const { data: unassigned, isLoading } = useQuery(
    convexQuery(api.brackets.getUnassignedParticipants, { categoryId }),
  );
  const { data: bracketData } = useQuery(
    convexQuery(api.brackets.getWithParticipants, { bracketId }),
  );

  const addParticipants = useMutation(api.brackets.addParticipants);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one participant");
      return;
    }

    setIsSubmitting(true);
    try {
      await addParticipants({
        bracketId,
        categoryParticipantIds: Array.from(selectedIds) as Id<"categoryParticipants">[],
      });
      toast.success(`${selectedIds.size} participants assigned`);
      setSelectedIds(new Set());
      setIsAssignOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign participants");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedIds(new Set());
    }
    setIsAssignOpen(newOpen);
  };

  const bracket = bracketData?.bracket;
  const currentCount = bracketData?.participants.length ?? 0;
  const maxParticipants = bracket?.maxParticipants;
  const remainingSlots = maxParticipants !== undefined ? maxParticipants - currentCount : undefined;

  return (
    <Dialog open={isAssignOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="secondary" onClick={() => setIsAssignOpen(true)}>
            <UserPlusIcon className="size-4" />
            Add Participants
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Participants</DialogTitle>
          <DialogDescription>
            Select participants to add to this bracket.
            {remainingSlots !== undefined && (
              <span className="mt-1 block text-amber-600">{remainingSlots} slots remaining</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isLoading ? (
            <div className="py-8 text-center">
              <Loader2Icon className="mx-auto size-6 animate-spin text-slate-400" />
              <p className="mt-2 text-sm text-muted-foreground">Loading participants...</p>
            </div>
          ) : !unassigned || unassigned.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No unassigned participants</div>
          ) : (
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {unassigned.map((p) => {
                const id = p._id;
                const isSelected = selectedIds.has(id);
                const name =
                  "player" in p && p.player
                    ? p.player.fullName
                    : "playerOne" in p && p.playerOne && p.playerTwo
                      ? `${p.playerOne.fullName} / ${p.playerTwo.fullName}`
                      : "Unknown";

                return (
                  <div
                    key={id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isSelected ? "border-primary bg-primary/5" : "hover:bg-muted"
                    }`}
                    onClick={() => toggleSelection(id)}
                  >
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(id)} />
                    <Label className="flex-1 cursor-pointer font-medium">{name}</Label>
                    {isSelected && <CheckIcon className="size-4 text-primary" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedIds.size === 0}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign ${selectedIds.size}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
