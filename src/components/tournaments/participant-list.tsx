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
  SelectGroup,
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
  categoryId: Id<"categories">;
}

type SortColumn = "name" | "record";
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

export function ParticipantList({ participants, categoryType, categoryId }: ParticipantListProps) {
  const [removeTarget, setRemoveTarget] = useState<Id<"categoryParticipants"> | null>(null);
  const [sortConfig, setSortConfig] = useLocalStorage<SortConfig>("participant-list-sort", {
    column: "record",
    direction: "desc",
  });

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

    if (sortConfig.column === "name") {
      const nameA =
        categoryType === "singles"
          ? ((a as SinglesParticipant).player?.fullName ?? "")
          : ((a as DoublesParticipant).pair?.teamName ??
            (a as DoublesParticipant).playerOne?.fullName ??
            "");
      const nameB =
        categoryType === "singles"
          ? ((b as SinglesParticipant).player?.fullName ?? "")
          : ((b as DoublesParticipant).pair?.teamName ??
            (b as DoublesParticipant).playerOne?.fullName ??
            "");
      return nameA.localeCompare(nameB) * dir;
    }

    if (sortConfig.column === "record") {
      const winDiff = (a.wins - b.wins) * dir;
      if (winDiff !== 0) return winDiff;
      return (a.losses - b.losses) * -dir;
    }

    return 0;
  });

  const unregister = useMutation(api.app.categoryParticipants.unregister).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.app.categoryParticipants.listByCategory, {
        categoryId,
      });
      if (!current) return;

      const updated = current.filter((p) => p._id !== args.categoryParticipantId) as typeof current;
      localStore.setQuery(api.app.categoryParticipants.listByCategory, { categoryId }, updated);
    },
  );

  const updateStatus = useMutation(api.app.categoryParticipants.updateStatus);

  const handleStatusChange = (participantId: Id<"categoryParticipants">, status: string) => {
    updateStatus({
      categoryParticipantId: participantId,
      status: status as "active" | "eliminated" | "withdrawn",
    })
      .then(() => toast.success("Status updated"))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to update status"));
  };

  const handleConfirmRemove = () => {
    if (removeTarget) {
      unregister({ categoryParticipantId: removeTarget })
        .then(() => toast.success("Participant removed"))
        .catch((err) =>
          toast.error(err instanceof Error ? err.message : "Failed to remove participant"),
        );
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
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No participants registered yet
                </TableCell>
              </TableRow>
            ) : (
              sortedParticipants.map((p) => (
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
                  <TableCell>
                    <Select
                      value={p.status}
                      onValueChange={(value) => value && handleStatusChange(p._id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="eliminated">Eliminated</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {p.wins} - {p.losses}
                  </TableCell>
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
            <AlertDialogAction onClick={handleConfirmRemove} variant="destructive">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
