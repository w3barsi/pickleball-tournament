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
  PlusIcon,
  UserPlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { AssignParticipantsDialog } from "@/components/tournaments/assign-participants-dialog";
import { BracketParticipantList } from "@/components/tournaments/bracket-participant-list";
import { CreateMatchDialog } from "@/components/tournaments/create-match-dialog";
import { MatchList } from "@/components/tournaments/match-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute(
  "/_auth/app/tournaments/$slug/categories/$categoryId/$bracketId",
)({
  component: BracketDetailPage,
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.brackets.getWithParticipants, {
        bracketId: params.bracketId as Id<"brackets">,
      }),
    );
  },
});

function BracketDetailPage() {
  const { slug, categoryId, bracketId } = Route.useParams();
  const { data: tournament } = useQuery(convexQuery(api.tournaments.getBySlug, { slug }));
  const { data: category } = useQuery(
    convexQuery(api.categories.get, { categoryId: categoryId as Id<"categories"> }),
  );
  const { data: canEdit } = useQuery(
    convexQuery(api.categories.canEdit, tournament ? { tournamentId: tournament._id } : "skip"),
  );
  const { data: bracketData } = useQuery(
    convexQuery(api.brackets.getWithParticipants, {
      bracketId: bracketId as Id<"brackets">,
    }),
  );
  const { data: unassignedParticipants } = useQuery(
    convexQuery(api.brackets.getUnassignedParticipants, {
      categoryId: categoryId as Id<"categories">,
    }),
  );

  const removeParticipant = useMutation(api.brackets.removeParticipant);
  const removeBracket = useMutation(api.brackets.remove);
  const navigate = useNavigate();

  const [isDeleting, setIsDeleting] = useState(false);

  if (!bracketData || !category || !tournament) {
    return (
      <div className="py-20 text-center">
        <Loader2Icon className="mx-auto size-10 animate-spin text-slate-400" />
        <p className="mt-4 text-lg font-bold text-slate-500">Loading bracket...</p>
      </div>
    );
  }

  const { bracket, participants } = bracketData;

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

  const handleDeleteBracket = async () => {
    setIsDeleting(true);
    try {
      await removeBracket({ bracketId: bracketId as Id<"brackets"> });
      toast.success("Bracket deleted");
      navigate({
        to: "/app/tournaments/$slug/categories/$categoryId",
        params: { slug, categoryId },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete bracket");
      setIsDeleting(false);
    }
  };

  const unassignedCount = unassignedParticipants?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={
            <Link
              to="/app/tournaments/$slug/categories/$categoryId"
              params={{ slug, categoryId }}
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
            {tournament.name} · {category.name} · Stage {bracket.stage} ·{" "}
            {getFormatLabel(bracket.format)}
          </HeaderCardDescription>
        </div>
        {canEdit && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="icon" />}>
              <Trash2Icon className="size-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Bracket</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">{bracket.name}</span>? This action cannot be
                  undone and will also remove all participants and matches.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleDeleteBracket}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </HeaderCard>

      {/* Bracket Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <UsersIcon className="text-tournament-lime size-5" />
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">
              {participants.length}
              {bracket.maxParticipants ? ` / ${bracket.maxParticipants}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {unassignedCount > 0 ? (
                <span className="font-medium text-amber-600">
                  {unassignedCount} unassigned in category
                </span>
              ) : (
                "All assigned"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <SwordsIcon className="text-tournament-lime size-5" />
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">—</p>
            <p className="text-sm text-muted-foreground">See list below</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrophyIcon className="text-tournament-lime size-5" />
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

      {/* Participants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Participants</h2>
          {canEdit && unassignedCount > 0 && (
            <AssignParticipantsDialog
              bracketId={bracketId as Id<"brackets">}
              categoryId={categoryId as Id<"categories">}
            />
          )}
        </div>
        <BracketParticipantList
          participants={participants}
          categoryType={category.type}
          canEdit={!!canEdit}
          onRemove={handleRemoveParticipant}
        />
      </div>

      {/* Matches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Matches</h2>
          {canEdit && participants.length >= 2 && (
            <CreateMatchDialog
              bracketId={bracketId as Id<"brackets">}
              bracketParticipants={participants}
              categoryType={category.type}
            />
          )}
        </div>
        <MatchList
          bracketId={bracketId as Id<"brackets">}
          categoryType={category.type}
          canEdit={!!canEdit}
        />
      </div>

      {/* Dialogs */}
      {canEdit && <></>}
    </div>
  );
}
