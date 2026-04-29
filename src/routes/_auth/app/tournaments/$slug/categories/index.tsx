import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { LayoutGridIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { CategoryCard } from "@/components/tournaments/category-card";
import { CreateCategoryDialog } from "@/components/tournaments/create-category-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/app/tournaments/$slug/categories/")({
  component: CategoriesPage,
  loader: async ({ params, context }) => {
    const tournament = await context.queryClient.ensureQueryData(
      convexQuery(api.tournaments.getBySlug, { slug: params.slug }),
    );
    if (tournament) {
      await context.queryClient.ensureQueryData(
        convexQuery(api.categories.listByTournament, { tournamentId: tournament._id }),
      );
    }
  },
});

function CategoriesPage() {
  const { slug } = Route.useParams();
  const { data: tournament } = useQuery(convexQuery(api.tournaments.getBySlug, { slug }));
  const { data: categories } = useQuery(
    convexQuery(
      api.categories.listByTournament,
      tournament ? { tournamentId: tournament._id } : "skip",
    ),
  );
  const { data: canEdit } = useQuery(
    convexQuery(api.categories.canEdit, tournament ? { tournamentId: tournament._id } : "skip"),
  );

  const createCategory = useMutation(api.categories.create);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreate = async (data: {
    name: string;
    type: "singles" | "doubles";
    rating: "beginner" | "intermediate" | "advanced";
    category: "womens" | "mens" | "mixed" | "open";
    maxParticipants?: number;
  }) => {
    if (!tournament) return { error: "Tournament not found" };
    try {
      await createCategory({ tournamentId: tournament._id, ...data });
      return {};
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { error: `Failed to create category: ${message}` };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderCard>
        <div className="text-center sm:text-left">
          <HeaderCardHeading>CATEGORIES</HeaderCardHeading>
          <HeaderCardDescription>
            {tournament ? tournament.name : "Loading..."}
          </HeaderCardDescription>
        </div>
        {canEdit && (
          <CreateCategoryDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onCreate={handleCreate}
          />
        )}
      </HeaderCard>

      {/* Categories List */}
      {categories === undefined ? (
        <div className="py-16 text-center">
          <div className="bg-tournament-blue/20 mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full">
            <LayoutGridIcon className="text-tournament-blue size-10" />
          </div>
          <p className="text-tournament-blue mt-6 text-xl font-black tracking-wide uppercase">
            Loading Categories...
          </p>
        </div>
      ) : categories.length === 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <LayoutGridIcon className="size-8" />
            </div>
            <p className="text-lg font-bold">No categories yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first category to get started
            </p>
            {canEdit && (
              <Button className="mt-4" variant="secondary" onClick={() => setIsCreateOpen(true)}>
                <PlusIcon className="size-4" />
                Create Category
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat) => (
            <CategoryCard key={cat._id} category={cat} slug={slug} canEdit={canEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
