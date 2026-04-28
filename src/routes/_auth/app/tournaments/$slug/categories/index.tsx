import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  ChevronRightIcon,
  LayoutGridIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { CreateCategoryDialog } from "@/components/tournaments/create-category-dialog";
import { DeleteCategoryAlertDialog } from "@/components/tournaments/delete-category-alert-dialog";
import { Badge } from "@/components/ui/badge";
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
  const deleteCategory = useMutation(api.categories.remove);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: Id<"categories">;
    name: string;
  } | null>(null);

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

  const handleDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory({ categoryId: categoryToDelete.id });
      setCategoryToDelete(null);
    }
  };

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

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case "beginner":
        return "Beginner";
      case "intermediate":
        return "Intermediate";
      case "advanced":
        return "Advanced";
      default:
        return rating;
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

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "advanced":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
            {getRatingLabel(rating)}
          </Badge>
        );
      case "intermediate":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            {getRatingLabel(rating)}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            {getRatingLabel(rating)}
          </Badge>
        );
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
            <Card
              key={cat._id}
              className="group overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              {/* Card Header Bar */}
              <div className="bg-tournament-blue flex items-center justify-between px-5 py-3">
                {getRatingBadge(cat.rating)}
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-red-500 hover:text-white"
                    onClick={() =>
                      setCategoryToDelete({
                        id: cat._id,
                        name: cat.name,
                      })
                    }
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                )}
              </div>

              <CardContent className="p-5">
                <Link
                  to="/app/tournaments/$slug/categories/$categoryId"
                  params={{ slug, categoryId: cat._id }}
                  className="block"
                >
                  {/* Category Name */}
                  <h3 className="text-tournament-blue group-hover:text-tournament-blue/80 mb-3 text-xl font-black tracking-tight uppercase transition-colors">
                    {cat.name}
                  </h3>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UsersIcon className="text-tournament-lime size-4" />
                      <span className="font-semibold">{getTypeLabel(cat.type)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LayoutGridIcon className="text-tournament-lime size-4" />
                      <span className="font-semibold">{getCategoryLabel(cat.category)}</span>
                    </div>
                    {cat.maxParticipants && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UsersIcon className="text-tournament-lime size-4" />
                        <span className="font-semibold">
                          Max {cat.maxParticipants} participants
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Hint */}
                  <div className="text-tournament-blue mt-5 flex items-center gap-2 text-sm font-black tracking-wide uppercase">
                    VIEW DETAILS
                    <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteCategoryAlertDialog
        open={!!categoryToDelete}
        onOpenChange={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        categoryName={categoryToDelete?.name}
      />
    </div>
  );
}
