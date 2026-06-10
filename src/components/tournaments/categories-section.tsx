import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ChevronRightIcon, PlusIcon, TrophyIcon, UsersIcon, SwordsIcon } from "lucide-react";
import { Suspense, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";

import { CreateCategoryDialog } from "./create-category-dialog";

function getGenderLabel(gender: string) {
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
}

export function CategoriesSection({
  slug,
  tournamentId,
}: {
  slug: string;
  tournamentId: Id<"tournaments">;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createCategory = useMutation(api.app.categories.create);

  const handleCreate = async (data: {
    name: string;
    type: "singles" | "doubles";
    rating: "beginner" | "intermediate" | "advanced";
    gender: "womens" | "mens" | "mixed" | "open";
    maxParticipants?: number;
  }) => {
    try {
      await createCategory({ tournamentId, ...data });
      return {};
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { error: `Failed to create category: ${message}` };
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Categories</h2>
        <CreateCategoryDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreate={handleCreate}
        />
      </div>
      <Suspense fallback={<CategoriesFallback />}>
        <CategoriesSectionInner
          slug={slug}
          tournamentId={tournamentId}
          onCreateOpen={() => setIsCreateOpen(true)}
        />
      </Suspense>
    </section>
  );
}

export function CategoriesSectionInner({
  slug,
  tournamentId,
  onCreateOpen,
}: {
  slug: string;
  tournamentId: Id<"tournaments">;
  onCreateOpen: () => void;
}) {
  const { data: categories } = useSuspenseQuery(
    convexQuery(api.app.categories.listByTournament, { tournamentId }),
  );
  const { data: brackets } = useSuspenseQuery(
    convexQuery(api.app.brackets.listByTournament, { tournamentId }),
  );

  return (
    <>
      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
            <TrophyIcon className="size-6" />
          </div>
          <p className="mt-3 text-lg font-bold">No categories yet</p>
          <p className="text-sm text-muted-foreground">Create a category to get started</p>
          <Button className="mt-4" variant="secondary" onClick={onCreateOpen}>
            <PlusIcon className="size-4" />
            Create Category
          </Button>
        </div>
      ) : (
        <ItemGroup className="gap-2">
          {categories.map((category) => {
            const categoryBrackets = brackets.filter((b) => b.category._id === category._id);
            const categoryParticipantCount = categoryBrackets.reduce(
              (sum, b) => sum + b.participantCount,
              0,
            );
            return (
              <Item
                key={category._id}
                variant="outline"
                className="rounded-xl"
                render={
                  <Link
                    to="/app/tournaments/$slug/categories/$categoryId"
                    params={{ slug, categoryId: category._id }}
                  />
                }
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
                  <TrophyIcon className="size-5" />
                </div>
                <ItemContent>
                  <ItemTitle>{category.name}</ItemTitle>
                  <ItemDescription>
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="size-3.5" />
                      {categoryParticipantCount}{" "}
                      {categoryParticipantCount === 1 ? "participant" : "participants"}
                    </span>
                    {" · "}
                    <span className="inline-flex items-center gap-1">
                      <SwordsIcon className="size-3.5" />
                      {categoryBrackets.length}{" "}
                      {categoryBrackets.length === 1 ? "bracket" : "brackets"}
                    </span>
                    {" · "}
                    <Badge variant="secondary" className="text-xs">
                      {getGenderLabel(category.gender ?? "")}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {category.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {category.rating}
                    </Badge>
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover/item:translate-x-1" />
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      )}
    </>
  );
}

export function CategoriesFallback() {
  return (
    <ItemGroup className="gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Item key={i} variant="outline" className="rounded-xl">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-muted bg-muted/50">
            <Skeleton className="size-5" />
          </div>
          <ItemContent>
            <ItemTitle>
              <Skeleton className="h-5 w-32" />
            </ItemTitle>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </ItemContent>
          <ItemActions>
            <Skeleton className="size-4" />
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
