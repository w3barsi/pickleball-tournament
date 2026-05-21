"use client";

import { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { TrophyIcon, UsersIcon, SwordsIcon, ArrowRightIcon, ShuffleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";

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

interface BracketListProps {
  brackets: BracketItem[];
  unassignedCount: number;
  onAutoAssign: (bracketId: Id<"brackets">) => void;
}

function getFormatLabel(format: string) {
  switch (format) {
    case "roundRobin":
      return "Round Robin";
    case "singleElimination":
      return "Single Elimination";
    default:
      return format;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "inProgress":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Upcoming</Badge>;
  }
}

export function BracketList({ brackets, unassignedCount, onAutoAssign }: BracketListProps) {
  if (brackets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center">
        <TrophyIcon className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-4 text-lg font-bold">No brackets yet</p>
        <p className="text-sm text-muted-foreground">
          Create a bracket to start organizing matches
        </p>
      </div>
    );
  }

  const grouped = new Map<number, BracketItem[]>();
  for (const bracket of brackets) {
    const list = grouped.get(bracket.stage) ?? [];
    list.push(bracket);
    grouped.set(bracket.stage, list);
  }

  const sortedStages = Array.from(grouped.entries()).sort((a, b) => b[0] - a[0]);

  return (
    <div className="space-y-8">
      {sortedStages.map(([stage, stageBrackets], index) => (
        <div key={stage} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Stage {stage}
            </span>
            <Separator className="flex-1" />
          </div>
          <ItemGroup className="gap-2">
            {stageBrackets.map((bracket) => (
              <Item key={bracket._id} variant="outline">
                <ItemMedia variant="icon">
                  <TrophyIcon className="size-5 text-tournament-lime" />
                </ItemMedia>
                <ItemContent>
                  <div className="flex flex-wrap items-center gap-2">
                    <ItemTitle>{bracket.name}</ItemTitle>
                    {getStatusBadge(bracket.status)}
                    <Badge variant="outline">{getFormatLabel(bracket.format)}</Badge>
                  </div>
                  <ItemDescription>
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="size-3.5" />
                      {bracket.participantCount ?? 0}
                      {bracket.maxParticipants ? ` / ${bracket.maxParticipants}` : ""} participants
                    </span>
                    {" · "}
                    <span className="inline-flex items-center gap-1">
                      <SwordsIcon className="size-3.5" />
                      {bracket.matchCount ?? 0} matches
                    </span>
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link to="/app/brackets/$bracketId" params={{ bracketId: bracket._id }}>
                        View
                        <ArrowRightIcon className="ml-1 size-3" />
                      </Link>
                    }
                  />
                  {unassignedCount > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onAutoAssign(bracket._id)}
                      title="Auto-assign remaining participants"
                    >
                      <ShuffleIcon className="size-4" />
                    </Button>
                  )}
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
          {index < sortedStages.length - 1 && <Separator className="my-6" />}
        </div>
      ))}
    </div>
  );
}
