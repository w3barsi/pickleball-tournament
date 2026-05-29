import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  Loader2Icon,
  ChevronLeftIcon,
  TrophyIcon,
  UsersIcon,
  SwordsIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { BracketParticipantList } from "@/components/tournaments/bracket-participant-list";
import { CreateMatchDialog } from "@/components/tournaments/create-match-dialog";
import { EditBracketDialog } from "@/components/tournaments/edit-bracket-dialog";
import { MatchList } from "@/components/tournaments/match-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/app/brackets/$bracketId/")({
  component: BracketDetailPage,
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.app.brackets.getWithParticipants, {
        bracketId: params.bracketId as Id<"brackets">,
      }),
    );
  },
});

function BracketDetailPage() {
  const { bracketId } = Route.useParams();
  const navigate = useNavigate();
  const { data: bracketData } = useQuery(
    convexQuery(api.app.brackets.getWithParticipants, {
      bracketId: bracketId as Id<"brackets">,
    }),
  );

  const removeParticipant = useMutation(api.app.brackets.removeParticipant);
  const generateRoundRobin = useMutation(api.app.matches.generateRoundRobin);

  const [isGenerating, setIsGenerating] = useState(false);

  if (!bracketData || !bracketData.tournament) {
    return (
      <div className="py-20 text-center">
        <Loader2Icon className="mx-auto size-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-lg font-bold text-muted-foreground">Loading bracket...</p>
      </div>
    );
  }

  const { bracket, category, tournament, participants } = bracketData;

  const getFormatLabel = (format: string) => {
    switch (format) {
      case "roundRobin":
        return "Round Robin";
      case "singleElimination":
        return "Single Elimination";
      default:
        return format;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "inProgress":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Upcoming</Badge>;
    }
  };

  const handleRemoveParticipant = async (bpId: Id<"bracketParticipants">) => {
    try {
      await removeParticipant({ bracketParticipantId: bpId });
      toast.success("Participant removed from bracket");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove participant");
    }
  };

  const handleGenerateRoundRobin = async () => {
    setIsGenerating(true);
    try {
      const result = await generateRoundRobin({ bracketId: bracketId as Id<"brackets"> });
      toast.success(
        `Generated ${result.created} round robin match${result.created !== 1 ? "es" : ""}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate matches");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Button
          variant="ghost"
          nativeButton={false}
          render={
            <Link
              to="/app/tournaments/$slug/categories/$categoryId"
              params={{ slug: tournament.slug, categoryId: category._id }}
              className="flex items-center gap-1 text-muted-foreground"
            >
              <ChevronLeftIcon className="size-4" />
              Back to Category
            </Link>
          }
        />
      </div>

      {/* Header */}
      <HeaderCard>
        <div>
          <div className="mb-2 flex items-center gap-3">
            <HeaderCardHeading>{bracket.name}</HeaderCardHeading>
            {getStatusBadge(bracket.status)}
          </div>
          <HeaderCardDescription>
            {tournament.name} · {category.name} · Stage {bracket.stage}
          </HeaderCardDescription>
          <p className="mt-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-white/70">
            <span>{getFormatLabel(bracket.format)}</span>
            <span className="text-white/40">·</span>
            <span>Best of {bracket.numberOfSets}</span>
            <span className="text-white/40">·</span>
            <span>First to {bracket.pointsPerGame}</span>
            {bracket.winByTwo && (
              <>
                <span className="text-white/40">·</span>
                <span>Win by 2</span>
              </>
            )}
          </p>
        </div>
        <EditBracketDialog
          bracket={bracket}
          tournamentSlug={tournament.slug}
          categoryId={category._id}
        />
      </HeaderCard>

      {/* Bracket Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <UsersIcon className="size-5 text-tournament-lime" />
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">
              {participants.length}
              {bracket.maxParticipants ? ` / ${bracket.maxParticipants}` : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <SwordsIcon className="size-5 text-tournament-lime" />
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">—</p>
            <p className="text-sm text-muted-foreground">See list below</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrophyIcon className="size-5 text-tournament-lime" />
            <CardTitle className="text-sm font-medium">Format</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{getFormatLabel(bracket.format)}</p>
            <p className="text-sm text-muted-foreground">
              {bracket.format === "roundRobin" ? "Everyone plays everyone" : "Knockout stage"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Matches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Matches</h2>
          <div className="flex items-center gap-2">
            {bracket.format === "roundRobin" && participants.length >= 2 && (
              <Button
                variant="secondary"
                onClick={handleGenerateRoundRobin}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <RotateCcwIcon className="size-4" />
                )}
                Generate Round Robin Matches
              </Button>
            )}
            {participants.length >= 2 && (
              <CreateMatchDialog
                bracketId={bracketId as Id<"brackets">}
                bracketParticipants={participants}
                categoryType={category.type}
              />
            )}
          </div>
        </div>
        <MatchList
          bracketId={bracketId as Id<"brackets">}
          bracketLabel={bracket.label}
          categoryType={category.type}
        />
      </div>

      {/* Participants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Participants</h2>
        </div>
        <BracketParticipantList
          participants={participants}
          bracketLabel={bracket.label ?? undefined}
          categoryType={category.type}
          onRemove={handleRemoveParticipant}
        />
      </div>
    </div>
  );
}
