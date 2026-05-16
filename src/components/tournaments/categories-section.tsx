import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { TrophyIcon, ChevronRightIcon } from "lucide-react";
import { Suspense } from "react";

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

export function CategoriesSection({
  slug,
  tournamentId,
}: {
  slug: string;
  tournamentId: Id<"tournaments">;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Categories</h2>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link to="/app/tournaments/$slug/categories" params={{ slug }} />}
        >
          View all <ChevronRightIcon className="size-4" />
        </Button>
      </div>
      <Suspense fallback={<CategoriesFallback />}>
        <CategoriesSectionInner slug={slug} tournamentId={tournamentId} />
      </Suspense>
    </section>
  );
}

export function CategoriesSectionInner({
  slug,
  tournamentId,
}: {
  slug: string;
  tournamentId: Id<"tournaments">;
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
          <TrophyIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 text-lg font-bold">No categories yet</p>
          <p className="text-sm text-muted-foreground">Create a category to get started</p>
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
                render={
                  <Link
                    to="/app/tournaments/$slug/categories/$categoryId"
                    params={{ slug, categoryId: category._id }}
                  />
                }
              >
                <ItemContent>
                  <ItemTitle>{category.name}</ItemTitle>
                  <ItemDescription>
                    <span className="capitalize">{category.type}</span>
                    {" \u00b7 "}
                    <span className="capitalize">{category.rating}</span>
                    {" \u00b7 "}
                    {categoryBrackets.length}{" "}
                    {categoryBrackets.length === 1 ? "bracket" : "brackets"}
                    {" \u00b7 "}
                    {categoryParticipantCount}{" "}
                    {categoryParticipantCount === 1 ? "participant" : "participants"}
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
    <ItemGroup>
      {Array.from({ length: 3 }).map((_, i) => (
        <Item key={i} variant="outline">
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
