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
  RefreshCwIcon,
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
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_auth/app/tournaments/$slug/categories/$categoryId/")({
  component: CategoryDetailPage,
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.app.tournaments.getBySlug, { slug: params.slug }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.app.categories.get, { categoryId: params.categoryId as Id<"categories"> }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.app.categoryParticipants.listByCategory, {
          categoryId: params.categoryId as Id<"categories">,
        }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.app.brackets.listByCategory, {
          categoryId: params.categoryId as Id<"categories">,
        }),
      ),
    ]);
  },
});

function CategoryDetailPage() {
  const { slug, categoryId } = Route.useParams();
  const { data: tournament } = useQuery(convexQuery(api.app.tournaments.getBySlug, { slug }));
  const { data: category } = useQuery(
    convexQuery(api.app.categories.get, { categoryId: categoryId as Id<"categories"> }),
  );
  const { data: participants } = useQuery(
    convexQuery(api.app.categoryParticipants.listByCategory, {
      categoryId: categoryId as Id<"categories">,
    }),
  );
  const { data: brackets } = useQuery(
    convexQuery(api.app.brackets.listByCategory, {
      categoryId: categoryId as Id<"categories">,
    }),
  );
  const unregister = useMutation(api.app.categoryParticipants.unregister);
  const resyncRecords = useMutation(api.app.categoryParticipants.resyncRecords);
  const createBracket = useMutation(api.app.brackets.create);

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

  if (!category || !tournament) {
    return (
      <div className="py-20 text-center">
        <Loader2Icon className="mx-auto size-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-lg font-bold text-muted-foreground">Loading category...</p>
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

  const totalMatches = brackets?.reduce((sum, b) => sum + (b.matchCount ?? 0), 0) ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Back Link */}
      <div>
        <Button
          variant="ghost"
          nativeButton={false}
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
        <EditCategoryDialog category={category} tournamentSlug={slug} />
      </HeaderCard>

      {/* Stats Bar */}
      <div className="flex items-center justify-around rounded-2xl border bg-muted/20 px-4 py-5">
        <div className="flex w-full items-center justify-center gap-3">
          <UsersIcon className="size-5 text-tournament-lime" />
          <div>
            <p className="text-2xl leading-none font-black">
              {participants !== undefined
                ? `${participants.length}${category.maxParticipants ? ` / ${category.maxParticipants}` : ""}`
                : "—"}
            </p>
            <p className="mt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Participants
            </p>
          </div>
        </div>
        <Separator orientation="vertical" className="" />
        <div className="flex w-full items-center justify-center gap-3">
          <TrophyIcon className="size-5 text-tournament-lime" />
          <div>
            <p className="text-center text-2xl leading-none font-black">
              {brackets !== undefined ? brackets.length : "—"}
            </p>
            <p className="mt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Brackets
            </p>
          </div>
        </div>
        <Separator orientation="vertical" />
        <div className="flex w-full items-center justify-center gap-3">
          <SwordsIcon className="size-5 text-tournament-lime" />
          <div>
            <p className="text-center text-2xl leading-none font-black">
              {brackets !== undefined ? totalMatches : "—"}
            </p>
            <p className="mt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Matches
            </p>
          </div>
        </div>
      </div>

      {/* Brackets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Brackets</h2>
          <div className="flex items-center gap-2">
            <CreateBracketDialog
              open={isCreateBracketOpen}
              onOpenChange={setIsCreateBracketOpen}
              onCreate={handleCreateBracket}
            />
          </div>
        </div>
        {brackets === undefined ? (
          <div className="py-12 text-center">
            <Loader2Icon className="mx-auto size-8 animate-spin text-slate-400" />
            <p className="mt-2 text-muted-foreground">Loading brackets...</p>
          </div>
        ) : (
          <BracketList brackets={brackets} />
        )}
      </div>

      {/* Participants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Participants</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                toast.promise(resyncRecords({ categoryId: categoryId as Id<"categories"> }), {
                  loading: "Resyncing records...",
                  success: "Records resynced",
                  error: (err) => (err instanceof Error ? err.message : "Failed to resync records"),
                });
              }}
            >
              <RefreshCwIcon className="size-4" />
              Resync Records
            </Button>
            <RegisterParticipantDialog
              categoryId={categoryId as Id<"categories">}
              categoryType={category.type}
            />
          </div>
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
            onRemove={handleRemove}
          />
        )}
      </div>
    </div>
  );
}
