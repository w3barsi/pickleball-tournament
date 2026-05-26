"use client";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { GripVerticalIcon, UserPlusIcon, XIcon } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BracketItem {
  _id: Id<"brackets">;
  name: string;
  stage: number;
  format: "roundRobin" | "singleElimination";
  status: "upcoming" | "inProgress" | "completed";
  maxParticipants?: number;
  participantCount?: number;
  matchCount?: number;
}

interface SinglesParticipant {
  _id: Id<"categoryParticipants">;
  status: "active" | "eliminated" | "withdrawn";
  registrationStatus: "pending" | "confirmed";
  wins: number;
  losses: number;
  player: { fullName: string; nickname?: string } | null;
}

interface DoublesParticipant {
  _id: Id<"categoryParticipants">;
  status: "active" | "eliminated" | "withdrawn";
  registrationStatus: "pending" | "confirmed";
  wins: number;
  losses: number;
  pair: { teamName?: string } | null;
  playerOne: { fullName: string } | null;
  playerTwo: { fullName: string } | null;
}

type Participant = SinglesParticipant | DoublesParticipant;

interface Assignment {
  _id: Id<"bracketParticipants">;
  bracketId: Id<"brackets">;
  bracketName: string;
  categoryParticipantId: Id<"categoryParticipants">;
  status: string;
}

interface AssignPlayersDialogProps {
  categoryId: Id<"categories">;
  categoryType: "singles" | "doubles";
  stage: number;
  brackets: BracketItem[];
}

function getParticipantLabel(p: Participant, categoryType: "singles" | "doubles") {
  if (categoryType === "singles") {
    return (p as SinglesParticipant).player?.fullName ?? "Unknown";
  }
  const dp = p as DoublesParticipant;
  return dp.pair?.teamName ?? `${dp.playerOne?.fullName ?? "?"} / ${dp.playerTwo?.fullName ?? "?"}`;
}

function DraggableParticipant({
  participant,
  categoryType,
}: {
  participant: Participant;
  categoryType: "singles" | "doubles";
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: participant._id,
    data: { participant },
  });

  const style: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex cursor-grab items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:bg-accent active:cursor-grabbing"
      {...listeners}
      {...attributes}
    >
      <GripVerticalIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate font-medium">{getParticipantLabel(participant, categoryType)}</span>
    </div>
  );
}

function DroppableBracketBox({
  bracket,
  participants,
  categoryType,
  onRemove,
  maxReached,
}: {
  bracket: BracketItem;
  participants: Participant[];
  categoryType: "singles" | "doubles";
  onRemove: (bracketParticipantId: Id<"bracketParticipants">) => void;
  maxReached: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: bracket._id,
    data: { bracket },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-24 touch-none rounded-xl border-2 border-dashed p-3 transition-colors ${
        isOver
          ? "border-tournament-lime bg-tournament-lime/10"
          : maxReached
            ? "border-muted-foreground/20 bg-muted/30"
            : "border-muted-foreground/30 bg-muted/10"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-bold">{bracket.name}</h4>
        <span className="text-xs text-muted-foreground">
          {participants.length}
          {bracket.maxParticipants ? ` / ${bracket.maxParticipants}` : ""}
        </span>
      </div>
      {participants.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">Drop participants here</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {participants.map((p) => {
            const assignment = (p as Participant & { _assignmentId?: Id<"bracketParticipants"> })
              ._assignmentId;
            return (
              <div
                key={p._id}
                className="flex items-center justify-between rounded-md border bg-card px-2.5 py-1.5 text-sm shadow-sm"
              >
                <span className="truncate font-medium">{getParticipantLabel(p, categoryType)}</span>
                <button
                  type="button"
                  className="ml-2 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (assignment) onRemove(assignment);
                  }}
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UnassignedPool({
  participants,
  categoryType,
}: {
  participants: Participant[];
  categoryType: "singles" | "doubles";
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "unassigned-pool",
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-40 touch-none rounded-xl border-2 border-dashed p-3 transition-colors ${
        isOver ? "border-blue-400 bg-blue-50/50" : "border-muted-foreground/20 bg-muted/5"
      }`}
    >
      <h4 className="mb-2 text-sm font-bold text-muted-foreground">Unassigned Participants</h4>
      {participants.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          All participants are assigned to brackets in this stage
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {participants.map((p) => (
            <DraggableParticipant key={p._id} participant={p} categoryType={categoryType} />
          ))}
        </div>
      )}
    </div>
  );
}

function DragOverlayContent({
  activeId,
  allParticipants,
  categoryType,
}: {
  activeId: UniqueIdentifier | null;
  allParticipants: Participant[];
  categoryType: "singles" | "doubles";
}) {
  if (!activeId) return null;
  const participant = allParticipants.find((p) => p._id === activeId);
  if (!participant) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border-2 border-tournament-lime bg-card px-3 py-2 text-sm shadow-lg">
      <GripVerticalIcon className="size-4 shrink-0 text-tournament-lime" />
      <span className="truncate font-medium">{getParticipantLabel(participant, categoryType)}</span>
    </div>
  );
}

type UniqueIdentifier = Id<"categoryParticipants">;

function AssignPlayersDialogContent({
  categoryId,
  categoryType,
  stage,
  brackets,
}: AssignPlayersDialogProps) {
  const { data: participants } = useQuery(
    convexQuery(api.app.categoryParticipants.listByCategory, { categoryId }),
  );
  const { data: assignments } = useQuery(
    convexQuery(api.app.brackets.listAssignmentsByStage, { categoryId, stage }),
  );

  const addParticipants = useMutation(api.app.brackets.addParticipants).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.app.brackets.listAssignmentsByStage, {
        categoryId,
        stage,
      });
      if (!current) return;

      const targetBracket = brackets.find((b) => b._id === args.bracketId);
      if (!targetBracket) return;

      for (const cpId of args.categoryParticipantIds) {
        const filtered = current.filter((a) => a.categoryParticipantId !== cpId);
        filtered.push({
          _id: `optimistic-${cpId}` as Id<"bracketParticipants">,
          bracketId: args.bracketId,
          bracketName: targetBracket.name,
          categoryParticipantId: cpId,
          status: "active",
        });
        localStore.setQuery(
          api.app.brackets.listAssignmentsByStage,
          { categoryId, stage },
          filtered,
        );
      }
    },
  );

  const removeParticipant = useMutation(api.app.brackets.removeParticipant).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.app.brackets.listAssignmentsByStage, {
        categoryId,
        stage,
      });
      if (!current) return;

      const updated = current.filter((a) => a._id !== args.bracketParticipantId);
      localStore.setQuery(api.app.brackets.listAssignmentsByStage, { categoryId, stage }, updated);
    },
  );

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const assignedMap = new Map<Id<"categoryParticipants">, Assignment>();
  for (const a of assignments ?? []) {
    assignedMap.set(a.categoryParticipantId, a);
  }

  const bracketParticipantsMap = new Map<
    Id<"brackets">,
    (Participant & { _assignmentId?: Id<"bracketParticipants"> })[]
  >();
  for (const bracket of brackets) {
    bracketParticipantsMap.set(bracket._id, []);
  }
  const unassigned: (Participant & { _assignmentId?: Id<"bracketParticipants"> })[] = [];

  for (const p of participants ?? []) {
    const assignment = assignedMap.get(p._id);
    if (assignment) {
      const list = bracketParticipantsMap.get(assignment.bracketId);
      if (list) {
        list.push({ ...p, _assignmentId: assignment._id });
      }
    } else {
      unassigned.push(p);
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as UniqueIdentifier);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const participantId = active.id as Id<"categoryParticipants">;
    const targetId = over.id;

    const currentAssignment = assignedMap.get(participantId);

    if (targetId === "unassigned-pool") {
      if (currentAssignment) {
        removeParticipant({ bracketParticipantId: currentAssignment._id }).catch((err) =>
          toast.error(err instanceof Error ? err.message : "Failed to remove participant"),
        );
      }
      return;
    }

    const targetBracketId = targetId as Id<"brackets">;

    if (currentAssignment && currentAssignment.bracketId === targetBracketId) {
      return;
    }

    if (currentAssignment) {
      removeParticipant({ bracketParticipantId: currentAssignment._id })
        .then(() =>
          addParticipants({
            bracketId: targetBracketId,
            categoryParticipantIds: [participantId],
          }),
        )
        .catch((err) =>
          toast.error(err instanceof Error ? err.message : "Failed to move participant"),
        );
    } else {
      addParticipants({
        bracketId: targetBracketId,
        categoryParticipantIds: [participantId],
      }).catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to assign participant"),
      );
    }
  };

  const handleRemove = (bracketParticipantId: Id<"bracketParticipants">) => {
    removeParticipant({ bracketParticipantId }).catch((err) =>
      toast.error(err instanceof Error ? err.message : "Failed to remove participant"),
    );
  };

  const allParticipants = participants ?? [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 py-2 sm:grid-cols-[1fr_2fr]">
        <div>
          <UnassignedPool participants={unassigned} categoryType={categoryType} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {brackets.map((bracket) => {
            const bps = bracketParticipantsMap.get(bracket._id) ?? [];
            const maxReached =
              bracket.maxParticipants !== undefined && bps.length >= bracket.maxParticipants;
            return (
              <DroppableBracketBox
                key={bracket._id}
                bracket={bracket}
                participants={bps}
                categoryType={categoryType}
                onRemove={handleRemove}
                maxReached={maxReached}
              />
            );
          })}
        </div>
      </div>

      {createPortal(
        <DragOverlay>
          {activeId ? (
            <DragOverlayContent
              activeId={activeId}
              allParticipants={allParticipants}
              categoryType={categoryType}
            />
          ) : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}

export function AssignPlayersDialog({
  categoryId,
  categoryType,
  stage,
  brackets,
}: AssignPlayersDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <UserPlusIcon className="size-4" />
            Assign
          </Button>
        }
      />
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Assign Players to Stage {stage}</DialogTitle>
          <DialogDescription>
            Drag participants from the pool into bracket boxes to assign them for this stage. Drag
            them back to the pool to unassign.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <AssignPlayersDialogContent
            categoryId={categoryId}
            categoryType={categoryType}
            stage={stage}
            brackets={brackets}
          />
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
