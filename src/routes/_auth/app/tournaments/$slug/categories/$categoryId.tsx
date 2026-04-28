import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Loader2Icon, ChevronLeftIcon, SwordsIcon, UsersIcon } from "lucide-react";
import { useState } from "react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { EditCategoryDialog } from "@/components/tournaments/edit-category-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/app/tournaments/$slug/categories/$categoryId")({
  component: CategoryDetailPage,
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.categories.get, { categoryId: params.categoryId as Id<"categories"> }),
    );
    await context.queryClient.ensureQueryData(
      convexQuery(api.tournaments.getBySlug, { slug: params.slug }),
    );
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

  const updateCategory = useMutation(api.categories.update);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleEdit = async (data: {
    name: string;
    type: "singles" | "doubles";
    rating: "beginner" | "intermediate" | "advanced";
    category: "womens" | "mens" | "mixed" | "open";
    maxParticipants?: number;
  }) => {
    try {
      await updateCategory({ categoryId: categoryId as Id<"categories">, ...data });
      return {};
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { error: `Failed to update category: ${message}` };
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

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Button
          variant="ghost"
          size="sm"
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
        {canEdit && (
          <EditCategoryDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onEdit={handleEdit}
            defaultValues={{
              name: category.name,
              type: category.type,
              rating: category.rating,
              category: category.category,
              maxParticipants: category.maxParticipants ?? undefined,
            }}
          />
        )}
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
              {category.maxParticipants ? `Up to ${category.maxParticipants}` : "Unlimited"}
            </p>
            <p className="text-sm text-muted-foreground">Registration open</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <SwordsIcon className="text-tournament-lime size-5" />
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">—</p>
            <p className="text-sm text-muted-foreground">No matches scheduled yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for bracket/participants */}
      <div className="rounded-2xl border-4 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
        <p className="text-xl text-neutral-500">Category Details Coming Soon</p>
        <p className="mt-2 text-sm text-neutral-400">
          This page will show participants, brackets, and matches for this category.
        </p>
      </div>
    </div>
  );
}
