"use client";

import { Id } from "@convex/_generated/dataModel";
import { Trash2Icon } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface ParticipantListProps {
  participants: SinglesParticipant[] | DoublesParticipant[];
  categoryType: "singles" | "doubles";
  canEdit: boolean;
  onRemove: (participantId: Id<"categoryParticipants">) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
    case "eliminated":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Eliminated</Badge>;
    case "withdrawn":
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Withdrawn</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function ParticipantList({
  participants,
  categoryType,
  canEdit,
  onRemove,
}: ParticipantListProps) {
  const [removeTarget, setRemoveTarget] = useState<Id<"categoryParticipants"> | null>(null);

  const handleConfirmRemove = () => {
    if (removeTarget) {
      onRemove(removeTarget);
      setRemoveTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Record</TableHead>
              {canEdit && <TableHead className="w-16" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 4 : 3}
                  className="py-8 text-center text-muted-foreground"
                >
                  No participants registered yet
                </TableCell>
              </TableRow>
            ) : (
              participants.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-medium">
                    {categoryType === "singles" ? (
                      ((p as SinglesParticipant).player?.fullName ?? "Unknown")
                    ) : (
                      <div>
                        {(p as DoublesParticipant).pair?.teamName ? (
                          <span className="font-bold">
                            {(p as DoublesParticipant).pair!.teamName}
                          </span>
                        ) : null}
                        <div className="text-sm text-muted-foreground">
                          {(p as DoublesParticipant).playerOne?.fullName ?? "Unknown"} /{" "}
                          {(p as DoublesParticipant).playerTwo?.fullName ?? "Unknown"}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(p.status)}</TableCell>
                  <TableCell>
                    {p.wins} - {p.losses}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setRemoveTarget(p._id)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={removeTarget !== null} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this participant from the category? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              render={
                <Button variant="destructive" onClick={handleConfirmRemove}>
                  Remove
                </Button>
              }
            />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
