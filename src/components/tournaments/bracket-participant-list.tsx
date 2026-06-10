"use client";

import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";
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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

interface BracketParticipant {
  _id: Id<"bracketParticipants">;
  seed?: number;
  status: "active" | "eliminated" | "withdrawn";
  categoryParticipant: {
    _id: Id<"categoryParticipants">;
    status: "active" | "eliminated" | "withdrawn";
    wins: number;
    losses: number;
    player?: { fullName: string; nickname?: string } | null;
    pair?: { teamName?: string } | null;
    playerOne?: { fullName: string } | null;
    playerTwo?: { fullName: string } | null;
  };
}

interface BracketParticipantListProps {
  participants: BracketParticipant[];
  bracketLabel?: string;
  categoryType: "singles" | "doubles";
  onRemove: (bracketParticipantId: Id<"bracketParticipants">) => void;
}

type SortColumn = "label" | "name" | "record";
type SortDirection = "asc" | "desc";

interface SortConfig {
  column: SortColumn;
  direction: SortDirection;
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

export function BracketParticipantList({
  participants,
  bracketLabel,
  categoryType,
  onRemove,
}: BracketParticipantListProps) {
  const [removeTarget, setRemoveTarget] = useState<Id<"bracketParticipants"> | null>(null);
  const [sortConfig, setSortConfig] = useLocalStorage<SortConfig>("bracket-participant-list-sort", {
    column: "record",
    direction: "desc",
  });

  const updateStatus = useMutation(api.app.brackets.updateParticipantStatus);

  const handleStatusChange = (bracketParticipantId: Id<"bracketParticipants">, status: string) => {
    updateStatus({ bracketParticipantId, status: status as "active" | "eliminated" | "withdrawn" })
      .then(() => toast.success("Status updated"))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to update status"));
  };

  const handleSort = (column: SortColumn) => {
    setSortConfig((current) => {
      if (current.column === column) {
        return { column, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { column, direction: column === "record" ? "desc" : "asc" };
    });
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    const dir = sortConfig.direction === "asc" ? 1 : -1;

    if (sortConfig.column === "label") {
      const seedA = a.seed ?? Infinity;
      const seedB = b.seed ?? Infinity;
      return (seedA - seedB) * dir;
    }

    if (sortConfig.column === "name") {
      const nameA =
        categoryType === "singles"
          ? (a.categoryParticipant.player?.fullName ?? "")
          : (a.categoryParticipant.pair?.teamName ??
            a.categoryParticipant.playerOne?.fullName ??
            "");
      const nameB =
        categoryType === "singles"
          ? (b.categoryParticipant.player?.fullName ?? "")
          : (b.categoryParticipant.pair?.teamName ??
            b.categoryParticipant.playerOne?.fullName ??
            "");
      return nameA.localeCompare(nameB) * dir;
    }

    if (sortConfig.column === "record") {
      const winDiff = (a.categoryParticipant.wins - b.categoryParticipant.wins) * dir;
      if (winDiff !== 0) return winDiff;
      return (a.categoryParticipant.losses - b.categoryParticipant.losses) * -dir;
    }

    return 0;
  });

  const handleConfirmRemove = () => {
    if (removeTarget) {
      onRemove(removeTarget);
      setRemoveTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort("label")}
              >
                <span className="flex items-center gap-1">
                  Label
                  {sortConfig.column === "label" ? (
                    sortConfig.direction === "asc" ? (
                      <ArrowUpIcon className="size-3" />
                    ) : (
                      <ArrowDownIcon className="size-3" />
                    )
                  ) : (
                    <ArrowUpDownIcon className="size-3 text-muted-foreground" />
                  )}
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort("name")}
              >
                <span className="flex items-center gap-1">
                  Participant
                  {sortConfig.column === "name" ? (
                    sortConfig.direction === "asc" ? (
                      <ArrowUpIcon className="size-3" />
                    ) : (
                      <ArrowDownIcon className="size-3" />
                    )
                  ) : (
                    <ArrowUpDownIcon className="size-3 text-muted-foreground" />
                  )}
                </span>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort("record")}
              >
                <span className="flex items-center gap-1">
                  Record
                  {sortConfig.column === "record" ? (
                    sortConfig.direction === "asc" ? (
                      <ArrowUpIcon className="size-3" />
                    ) : (
                      <ArrowDownIcon className="size-3" />
                    )
                  ) : (
                    <ArrowUpDownIcon className="size-3 text-muted-foreground" />
                  )}
                </span>
              </TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No participants in this bracket yet
                </TableCell>
              </TableRow>
            ) : (
              sortedParticipants.map((bp) => {
                const cp = bp.categoryParticipant;
                const name =
                  categoryType === "singles"
                    ? (cp.player?.fullName ?? "Unknown")
                    : cp.pair?.teamName
                      ? cp.pair.teamName
                      : `${cp.playerOne?.fullName ?? "Unknown"} / ${cp.playerTwo?.fullName ?? "Unknown"}`;

                return (
                  <TableRow key={bp._id}>
                    <TableCell className="font-mono font-semibold">
                      {bp.seed != null ? `${bracketLabel ?? ""}${bp.seed}` : "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {name}
                      {categoryType === "doubles" && cp.pair?.teamName && (
                        <div className="text-sm text-muted-foreground">
                          {cp.playerOne?.fullName ?? "Unknown"} /{" "}
                          {cp.playerTwo?.fullName ?? "Unknown"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={bp.status}
                        onValueChange={(value) => value && handleStatusChange(bp._id, value)}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="eliminated">Eliminated</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {cp.wins} - {cp.losses}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setRemoveTarget(bp._id)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={removeTarget !== null} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Bracket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this participant from the bracket? They will remain
              registered in the category.
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
