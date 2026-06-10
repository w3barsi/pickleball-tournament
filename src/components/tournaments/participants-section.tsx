import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useSuspenseQuery } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getPairName(participant: {
  pair?: { teamName?: string } | null;
  playerOne?: { fullName: string } | null;
  playerTwo?: { fullName: string } | null;
}) {
  if (participant.pair?.teamName) {
    return `${participant.pair.teamName} (${participant.playerOne?.fullName ?? "Unknown"} / ${participant.playerTwo?.fullName ?? "Unknown"})`;
  }
  return `${participant.playerOne?.fullName ?? "Unknown"} / ${participant.playerTwo?.fullName ?? "Unknown"}`;
}

export function ParticipantsSection({ tournamentId }: { tournamentId: Id<"tournaments"> }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">Participants</h2>
      <Suspense fallback={<ParticipantsFallback />}>
        <ParticipantsSectionInner tournamentId={tournamentId} />
      </Suspense>
    </section>
  );
}

export function ParticipantsSectionInner({ tournamentId }: { tournamentId: Id<"tournaments"> }) {
  const { data: categoryParticipants } = useSuspenseQuery(
    convexQuery(api.app.categoryParticipants.listByTournament, { tournamentId }),
  );

  const totalParticipants = categoryParticipants.reduce(
    (sum, cp) => sum + cp.participants.length,
    0,
  );

  return (
    <>
      {totalParticipants === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <UsersIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 text-lg font-bold">No participants yet</p>
          <p className="text-sm text-muted-foreground">Register participants in each category</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryParticipants.flatMap(({ category, participants }) =>
                participants.map((p) => {
                  const name =
                    category.type === "singles"
                      ? ((p as { player?: { fullName: string } | null }).player?.fullName ??
                        "Unknown")
                      : getPairName(
                          p as {
                            pair?: { teamName?: string } | null;
                            playerOne?: { fullName: string } | null;
                            playerTwo?: { fullName: string } | null;
                          },
                        );
                  return (
                    <TableRow key={p._id}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="capitalize">
                        {category.gender ?? category.category}&nbsp;{category.type}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {p.wins}-{p.losses}
                      </TableCell>
                    </TableRow>
                  );
                }),
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

export function ParticipantsFallback() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Record</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-5 w-12" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
