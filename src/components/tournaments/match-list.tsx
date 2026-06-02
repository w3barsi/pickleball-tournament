"use client";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { SwordsIcon, CheckCircle2Icon, ClockIcon, PlayIcon, Loader2Icon } from "lucide-react";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MatchParticipant {
  _id: Id<"categoryParticipants">;
  seed?: number | null;
  player?: { fullName: string } | null;
  pair?: { teamName?: string } | null;
  playerOne?: { fullName: string } | null;
  playerTwo?: { fullName: string } | null;
}

interface MatchItem {
  _id: Id<"matches">;
  status: "scheduled" | "inProgress" | "completed" | "abandoned";
  participant1: MatchParticipant | null;
  participant2: MatchParticipant | null;
  winnerParticipantId?: Id<"categoryParticipants"> | null;
  courtNumber?: number | null;
  scheduledAt?: number | null;
  matchOrder?: number | null;
}

interface MatchListProps {
  bracketId: Id<"brackets">;
  bracketLabel?: string | null;
  categoryType: "singles" | "doubles";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "inProgress":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          <PlayIcon className="mr-1 size-3" />
          Live
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2Icon className="mr-1 size-3" />
          Completed
        </Badge>
      );
    case "abandoned":
      return <Badge variant="destructive">Abandoned</Badge>;
    default:
      return (
        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
          <ClockIcon className="mr-1 size-3" />
          Scheduled
        </Badge>
      );
  }
}

function getParticipantName(
  participant: MatchParticipant | null,
  categoryType: "singles" | "doubles",
) {
  if (!participant) return "TBD";
  if (categoryType === "singles") {
    return participant.player?.fullName ?? "Unknown";
  }
  if (participant.pair?.teamName) {
    return (
      <span>
        {participant.pair.teamName}{" "}
        <span className="text-xs text-muted-foreground">
          ({participant.playerOne?.fullName ?? "Unknown"} /{" "}
          {participant.playerTwo?.fullName ?? "Unknown"})
        </span>
      </span>
    );
  }
  return `${participant.playerOne?.fullName ?? "Unknown"} / ${participant.playerTwo?.fullName ?? "Unknown"}`;
}

function getSeedLabel(seed: number | null | undefined, bracketLabel?: string | null) {
  if (seed == null) return null;
  return `${bracketLabel ?? ""}${seed}`;
}

function MatchListContent({ bracketId, bracketLabel, categoryType }: MatchListProps) {
  const { data: matchData } = useSuspenseQuery(
    convexQuery(api.app.matches.listByBracket, { bracketId }),
  );
  const matches = matchData.matches;

  const navigate = useNavigate();

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border py-12 text-center text-muted-foreground">
        <SwordsIcon className="mx-auto size-8" />
        <p className="mt-4 text-lg font-bold">No matches yet</p>
        <p className="text-sm">Create a match to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 whitespace-nowrap">Match</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead className="w-28">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => {
              const p1Name = getParticipantName(match.participant1, categoryType);
              const p2Name = getParticipantName(match.participant2, categoryType);
              const isP1Winner = match.winnerParticipantId === match.participant1?._id;
              const isP2Winner = match.winnerParticipantId === match.participant2?._id;

              return (
                <TableRow
                  key={match._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    navigate({
                      to: "/app/matches/$matchId",
                      params: { matchId: match._id },
                    })
                  }
                >
                  <TableCell className="font-medium whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span>
                        {(() => {
                          const s1 = getSeedLabel(match.participant1?.seed, bracketLabel);
                          const s2 = getSeedLabel(match.participant2?.seed, bracketLabel);
                          if (s1 && s2) return `${s1} vs ${s2}`;
                          if (s1) return `${s1} vs TBD`;
                          if (s2) return `TBD vs ${s2}`;
                          return "—";
                        })()}
                      </span>
                      {match.courtNumber ? (
                        <span className="text-xs text-muted-foreground">
                          Court {match.courtNumber}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        vs
                      </div>
                      <div className="space-y-1">
                        <div className={isP1Winner ? "font-semibold text-green-700" : ""}>
                          {p1Name}
                        </div>
                        <div className={isP2Winner ? "font-semibold text-green-700" : ""}>
                          {p2Name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(match.status)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function MatchList(props: MatchListProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2Icon className="size-6 animate-spin" />
          <span className="ml-2 text-sm">Loading matches...</span>
        </div>
      }
    >
      <MatchListContent {...props} />
    </Suspense>
  );
}
