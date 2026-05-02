"use client";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  SwordsIcon,
  CheckCircle2Icon,
  ClockIcon,
  PlayIcon,
  Loader2Icon,
  RadioIcon,
  ChevronDownIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  player?: { fullName: string } | null;
  pair?: { teamName?: string } | null;
  playerOne?: { fullName: string } | null;
  playerTwo?: { fullName: string } | null;
}

interface MatchSet {
  _id: Id<"matchSets">;
  setNumber: number;
  team1Score: number;
  team2Score: number;
  winnerTeam?: 1 | 2 | null;
}

interface MatchItem {
  _id: Id<"matches">;
  status: "scheduled" | "inProgress" | "completed" | "abandoned";
  participant1: MatchParticipant | null;
  participant2: MatchParticipant | null;
  winnerParticipantId?: Id<"categoryParticipants"> | null;
  courtNumber?: number | null;
  scheduledAt?: number | null;
  roundNumber?: number | null;
  matchOrder?: number | null;
  matchSets: MatchSet[];
}

interface MatchListProps {
  bracketId: Id<"brackets">;
  categoryType: "singles" | "doubles";
  canEdit: boolean;
  slug: string;
  categoryId: Id<"categories">;
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

function getMatchScore(match: MatchItem) {
  if (match.matchSets.length > 0) {
    const p1Wins = match.matchSets.filter((s) => s.winnerTeam === 1).length;
    const p2Wins = match.matchSets.filter((s) => s.winnerTeam === 2).length;
    return `${p1Wins} - ${p2Wins}`;
  }
  if (match.status === "completed" && match.winnerParticipantId) {
    return "W - L";
  }
  return "—";
}

export function MatchList({ bracketId, categoryType, canEdit, slug, categoryId }: MatchListProps) {
  const { data: matches } = useQuery(convexQuery(api.matches.listByBracket, { bracketId }));

  const updateResult = useMutation(api.matches.updateResult);
  const navigate = useNavigate();

  const handleSetWinner = async (matchId: Id<"matches">, winnerId: Id<"categoryParticipants">) => {
    try {
      await updateResult({ matchId, winnerParticipantId: winnerId });
      toast.success("Winner recorded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record winner");
    }
  };

  if (matches === undefined) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2Icon className="size-6 animate-spin" />
        <span className="ml-2 text-sm">Loading matches...</span>
      </div>
    );
  }

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
              <TableHead className="w-20 text-center">Score</TableHead>
              <TableHead className="w-28">Status</TableHead>
              {canEdit && <TableHead className="w-32" />}
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
                      to: "/app/tournaments/$slug/categories/$categoryId/$bracketId/matches/$matchId",
                      params: { slug, categoryId, bracketId, matchId: match._id },
                    })
                  }
                >
                  <TableCell className="font-medium whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span>
                        {match.roundNumber ? `R${match.roundNumber}` : "—"}
                        {match.matchOrder ? ` · M${match.matchOrder}` : ""}
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
                  <TableCell className="text-center font-mono text-lg font-semibold">
                    {getMatchScore(match)}
                  </TableCell>
                  <TableCell>{getStatusBadge(match.status)}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {match.status !== "completed" &&
                          match.participant1 &&
                          match.participant2 && (
                            <>
                              <Button
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate({
                                    to: "/app/g/$id",
                                    params: { id: match._id },
                                  });
                                }}
                              >
                                <RadioIcon className="mr-1 size-3" />
                                Scorer
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      className="h-7 px-2 text-xs"
                                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                    >
                                      Set Winner
                                      <ChevronDownIcon className="ml-1 size-3" />
                                    </Button>
                                  }
                                />
                                <DropdownMenuContent align="end" className="w-full">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetWinner(match._id, match.participant1!._id);
                                    }}
                                  >
                                    {p1Name}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetWinner(match._id, match.participant2!._id);
                                    }}
                                  >
                                    {p2Name}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
