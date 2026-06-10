import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2Icon, ArrowLeftIcon, SwordsIcon, UsersIcon, TrophyIcon } from "lucide-react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { AssignPlayersDialog } from "@/components/tournaments/assign-players-dialog";
import { BracketList } from "@/components/tournaments/bracket-list";
import { CreateBracketDialog } from "@/components/tournaments/create-bracket-dialog";
import { EditCategoryDialog } from "@/components/tournaments/edit-category-dialog";
import { ParticipantList } from "@/components/tournaments/participant-list";
import { RegisterParticipantDialog } from "@/components/tournaments/register-participant-dialog";
import { Badge } from "@/components/ui/badge";

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

  const getCategoryLabel = (gender: string) => {
    switch (gender) {
      case "womens":
        return "Women's";
      case "mens":
        return "Men's";
      case "mixed":
        return "Mixed";
      case "open":
        return "Open";
      default:
        return gender;
    }
  };

  const totalMatches = brackets?.reduce((sum, b) => sum + (b.matchCount ?? 0), 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <HeaderCard>
        <div>
          <Link
            to="/app/tournaments/$slug"
            params={{ slug }}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="size-4" />
            Back to Tournament
          </Link>
          <div className="flex items-center gap-3">
            <HeaderCardHeading>{category.name}</HeaderCardHeading>
            {getRatingBadge(category.rating)}
          </div>
          <HeaderCardDescription>
            {tournament.name} · {getCategoryLabel(category.gender ?? category.category ?? "")} ·{" "}
            {getTypeLabel(category.type)}
          </HeaderCardDescription>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <UsersIcon className="size-3" />
              {participants?.length ?? 0}
              {category.maxParticipants ? ` / ${category.maxParticipants}` : ""} participants
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1">
              <TrophyIcon className="size-3" />
              {brackets?.length ?? 0} brackets
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1">
              <SwordsIcon className="size-3" />
              {totalMatches} matches
            </span>
          </p>
        </div>
        <EditCategoryDialog category={category} tournamentSlug={slug} />
      </HeaderCard>

      {/* Stats Bar */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <UsersIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-3xl leading-none font-black tracking-tight text-foreground tabular-nums">
                {participants !== undefined
                  ? `${participants.length}${category.maxParticipants ? ` / ${category.maxParticipants}` : ""}`
                  : "—"}
              </p>
              <p className="mt-1 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
                Participants
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <TrophyIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-3xl leading-none font-black tracking-tight text-foreground tabular-nums">
                {brackets !== undefined ? brackets.length : "—"}
              </p>
              <p className="mt-1 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
                Brackets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <SwordsIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-3xl leading-none font-black tracking-tight text-foreground tabular-nums">
                {brackets !== undefined ? totalMatches : "—"}
              </p>
              <p className="mt-1 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
                Matches
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Brackets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Brackets</h2>
          <div className="flex items-center gap-2">
            <CreateBracketDialog categoryId={categoryId as Id<"categories">} />
          </div>
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
            renderStageAction={(stage, stageBrackets) => (
              <AssignPlayersDialog
                categoryId={categoryId as Id<"categories">}
                categoryType={category.type}
                stage={stage}
                brackets={stageBrackets}
              />
            )}
          />
        )}
      </div>

      {/* Participants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Participants</h2>
          <div className="flex gap-2">
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
            categoryId={category._id}
          />
        )}
      </div>
    </div>
  );
}
