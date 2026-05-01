import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  Loader2Icon,
  ChevronLeftIcon,
  SwordsIcon,
  UsersIcon,
  TrophyIcon,
  ShuffleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { BracketList } from "@/components/tournaments/bracket-list";
import { CreateBracketDialog } from "@/components/tournaments/create-bracket-dialog";
import { EditCategoryDialog } from "@/components/tournaments/edit-category-dialog";
import { ParticipantList } from "@/components/tournaments/participant-list";
import { RegisterParticipantDialog } from "@/components/tournaments/register-participant-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/app/tournaments/$slug/categories/$categoryId/")({
  component: CategoryDetailPage,
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.categoryParticipants.listByCategory, {
          categoryId: params.categoryId as Id<"categories">,
        }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.brackets.listByCategory, {
          categoryId: params.categoryId as Id<"categories">,
        }),
      ),
    ]);
  },
});

function CategoryDetailPage() {
  const { slug, categoryId } = Route.useParams();
  const { data: tournament } = useQuery(convexQuery(api.tournaments.getBySlug, { slug }));
  const { data: category } = useQuery(
    convexQuery(api.categories.get, { categoryId: categoryId as Id<"categories"> }),
  );
  const { data: canEdit } = useQuery(
    convexQuery(api.categories.canEdit, tournament ? { tournamentId: tournament._id } : "skip"),
  );
  const { data: participants } = useQuery(
    convexQuery(api.categoryParticipants.listByCategory, {
      categoryId: categoryId as Id<"categories">,
    }),
  );
  const { data: brackets } = useQuery(
    convexQuery(api.brackets.listByCategory, {
      categoryId: categoryId as Id<"categories">,
    }),
  );
  const { data: unassignedParticipants } = useQuery(
    convexQuery(api.brackets.getUnassignedParticipants, {
      categoryId: categoryId as Id<"categories">,
    }),
  );

  const unregister = useMutation(api.categoryParticipants.unregister);
  const createBracket = useMutation(api.brackets.create);
  const autoAssign = useMutation(api.brackets.autoAssignRemaining);

  const [isCreateBracketOpen, setIsCreateBracketOpen] = useState(false);

  const handleRemove = async (participantId: Id<"categoryParticipants">) => {
    try {
      await unregister({ categoryParticipantId: participantId });
      toast.success("Participant removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove participant");
    }
  };

  const handleCreateBracket = async (data: {
    name: string;
    stage: number;
    format: "roundRobin" | "singleElimination";
    maxParticipants?: number;
  }) => {
    try {
      await createBracket({
        categoryId: categoryId as Id<"categories">,
        ...data,
      });
      toast.success("Bracket created");
      return {};
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { error: `Failed to create bracket: ${message}` };
    }
  };

  const handleAutoAssign = async (bracketId: Id<"brackets">) => {
    try {
      const result = await autoAssign({ bracketId });
      toast.success(`${result.inserted} participants assigned`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to auto-assign participants");
    }
  };

  if (!category || !tournament) {
    return (
      <div className="py-20 text-center">
        <Loader2Icon className="mx-auto size-10 animate-spin text-slate-400" />
        <p className="mt-4 text-lg font-bold text-slate-500">Loading category...</p>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "singles":
        return "Singles";
      case "doubles":
        return "Doubles";
      default:
        return type;
    }
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "advanced":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Advanced</Badge>
        );
      case "intermediate":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Intermediate</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Beginner</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "womens":
        return "Women's";
      case "mens":
        return "Men's";
      case "mixed":
        return "Mixed";
      case "open":
        return "Open";
      default:
        return category;
    }
  };

  const unassignedCount = unassignedParticipants?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Button
          variant="ghost"
          render={
            <Link
              to="/app/tournaments/$slug/categories"
              params={{ slug }}
              className="flex items-center gap-1 text-muted-foreground"
            >
              <ChevronLeftIcon className="size-4" />
              Back to Categories
            </Link>
          }
        />
      </div>

      {/* Header */}
      <HeaderCard>
        <div>
          <div className="mb-2 flex items-center gap-3">
            <HeaderCardHeading>{category.name}</HeaderCardHeading>
            {getRatingBadge(category.rating)}
          </div>
          <HeaderCardDescription>
            {tournament.name} · {getCategoryLabel(category.category)} ·{" "}
            {getTypeLabel(category.type)}
          </HeaderCardDescription>
        </div>
        {canEdit && <EditCategoryDialog category={category} tournamentSlug={slug} />}
      </HeaderCard>

      {/* Category Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <UsersIcon className="text-tournament-lime size-5" />
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">
              {participants !== undefined
                ? `${participants.length}${category.maxParticipants ? ` / ${category.maxParticipants}` : ""}`
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              {participants !== undefined ? `${participants.length} registered` : "Loading..."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrophyIcon className="text-tournament-lime size-5" />
            <CardTitle className="text-sm font-medium">Brackets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{brackets !== undefined ? brackets.length : "—"}</p>
            <p className="text-sm text-muted-foreground">
              {unassignedCount > 0 ? (
                <span className="font-medium text-amber-600">{unassignedCount} unassigned</span>
              ) : (
                "All participants assigned"
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
            <p className="text-2xl font-black">
              {brackets !== undefined
                ? brackets.reduce((sum, b) => sum + (b.matchCount ?? 0), 0)
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              {brackets !== undefined
                ? `${brackets.reduce((sum, b) => sum + (b.matchCount ?? 0), 0)} scheduled`
                : "Loading..."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Brackets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Brackets</h2>
          {canEdit && (
            <div className="flex items-center gap-2">
              {unassignedCount > 0 && brackets && brackets.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Auto-assign to the last bracket
                    const lastBracket = brackets[brackets.length - 1];
                    if (lastBracket) {
                      handleAutoAssign(lastBracket._id);
                    }
                  }}
                >
                  <ShuffleIcon className="size-4" />
                  Auto Assign Remaining
                </Button>
              )}
              <CreateBracketDialog
                open={isCreateBracketOpen}
                onOpenChange={setIsCreateBracketOpen}
                onCreate={handleCreateBracket}
              />
            </div>
          )}
        </div>
        {brackets === undefined ? (
          <div className="py-12 text-center">
            <Loader2Icon className="mx-auto size-8 animate-spin text-slate-400" />
            <p className="mt-2 text-muted-foreground">Loading brackets...</p>
          </div>
        ) : (
          <BracketList
            brackets={brackets}
            slug={slug}
            categoryId={categoryId}
            canEdit={!!canEdit}
            unassignedCount={unassignedCount}
            onAutoAssign={handleAutoAssign}
          />
        )}
      </div>

      {/* Participants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Participants</h2>
          {canEdit && (
            <RegisterParticipantDialog
              categoryId={categoryId as Id<"categories">}
              categoryType={category.type}
            />
          )}
        </div>
        {participants === undefined ? (
          <div className="py-12 text-center">
            <Loader2Icon className="mx-auto size-8 animate-spin text-slate-400" />
            <p className="mt-2 text-muted-foreground">Loading participants...</p>
          </div>
        ) : (
          <ParticipantList
            participants={participants}
            categoryType={category.type}
            canEdit={!!canEdit}
            onRemove={handleRemove}
          />
        )}
      </div>
    </div>
  );
}
