"use client";

import { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import {
  TrophyIcon,
  UsersIcon,
  SwordsIcon,
  ArrowRightIcon,
  ShuffleIcon,
  UserPlusIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  canEdit: boolean;
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

export function BracketList({
  brackets,
  canEdit,
  unassignedCount,
  onAutoAssign,
}: BracketListProps) {
  if (brackets.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="py-12 text-center">
          <TrophyIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 text-lg font-bold">No brackets yet</p>
          <p className="text-sm text-muted-foreground">
            Create a bracket to start organizing matches
          </p>
        </CardContent>
      </Card>
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
        <div key={stage} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {stageBrackets.map((bracket) => (
              <Card key={bracket._id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{bracket.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(bracket.status)}
                        <Badge variant="outline">{getFormatLabel(bracket.format)}</Badge>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Stage {bracket.stage}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="size-4" />
                      <span>
                        {bracket.participantCount ?? 0}
                        {bracket.maxParticipants ? ` / ${bracket.maxParticipants}` : ""}{" "}
                        participants
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SwordsIcon className="size-4" />
                      <span>{bracket.matchCount ?? 0} matches</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="flex-1"
                    nativeButton={false}
                    render={
                      <Link to="/app/brackets/$bracketId" params={{ bracketId: bracket._id }}>
                        View Bracket
                        <ArrowRightIcon className="ml-1 size-3" />
                      </Link>
                    }
                  />
                  {canEdit && unassignedCount > 0 && (
                    <Button
                      variant="ghost"
                      nativeButton={false}
                      onClick={() => onAutoAssign(bracket._id)}
                      title="Auto-assign remaining participants"
                    >
                      <ShuffleIcon className="size-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
          {index < sortedStages.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}
