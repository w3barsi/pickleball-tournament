import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { TrophyIcon, ChevronRightIcon, EyeIcon } from "lucide-react";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
          render={
            <Link to="/app/tournaments/$slug/categories" params={{ slug }}>
              View all <ChevronRightIcon className="size-4" />
            </Link>
          }
        >
          <ChevronRightIcon className="size-4" />
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
    convexQuery(api.categories.listByTournament, { tournamentId }),
  );
  const { data: brackets } = useSuspenseQuery(
    convexQuery(api.brackets.listByTournament, { tournamentId }),
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
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Brackets</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const categoryBrackets = brackets.filter((b) => b.category._id === category._id);
                const categoryParticipantCount = categoryBrackets.reduce(
                  (sum, b) => sum + b.participantCount,
                  0,
                );
                return (
                  <TableRow key={category._id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="capitalize">{category.type}</TableCell>
                    <TableCell className="capitalize">{category.rating}</TableCell>
                    <TableCell>{categoryBrackets.length}</TableCell>
                    <TableCell>{categoryParticipantCount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={
                          <Link
                            to="/app/tournaments/$slug/categories/$categoryId"
                            params={{ slug, categoryId: category._id }}
                          >
                            <EyeIcon className="mr-1 size-4" />
                            View
                          </Link>
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

export function CategoriesFallback() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Brackets</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-8" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-7 w-14" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
