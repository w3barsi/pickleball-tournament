import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { UsersIcon, Loader2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  const { data: categoryParticipants } = useQuery(
    convexQuery(api.categoryParticipants.listByTournament, { tournamentId }),
  );

  const totalParticipants =
    categoryParticipants?.reduce((sum, cp) => sum + cp.participants.length, 0) ?? 0;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">Participants</h2>

      {categoryParticipants === undefined ? (
        <div className="py-12 text-center">
          <Loader2Icon className="mx-auto size-8 animate-spin text-slate-400" />
          <p className="mt-2 text-muted-foreground">Loading participants...</p>
        </div>
      ) : totalParticipants === 0 ? (
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
                        {category.category}&nbsp;{category.type}
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
    </section>
  );
}
