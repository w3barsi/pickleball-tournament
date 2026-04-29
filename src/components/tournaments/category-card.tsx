import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel.js";
import { Id } from "@convex/_generated/dataModel.js";
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ChevronRightIcon, LayoutGridIcon, Trash2Icon, UserIcon, UsersIcon } from "lucide-react";

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
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface CategoryCardProps {
  category: Doc<"categories">;
  slug: string;
  canEdit: boolean | undefined;
}

function getTypeLabel(type: string) {
  switch (type) {
    case "singles":
      return "Singles";
    case "doubles":
      return "Doubles";
    default:
      return type;
  }
}

function getCategoryLabel(category: string) {
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
}

function getRatingLabel(rating: string) {
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
}

function getRatingBadge(rating: string) {
  switch (rating) {
    case "advanced":
      return (
        <Badge className="bg-purple-50 font-normal text-purple-600 hover:bg-purple-50">
          {getRatingLabel(rating)}
        </Badge>
      );
    case "intermediate":
      return (
        <Badge className="bg-blue-50 font-normal text-blue-600 hover:bg-blue-50">
          {getRatingLabel(rating)}
        </Badge>
      );
    default:
      return (
        <Badge className="bg-green-50 font-normal text-green-600 hover:bg-green-50">
          {getRatingLabel(rating)}
        </Badge>
      );
  }
}

export function CategoryCard({ category, slug, canEdit }: CategoryCardProps) {
  const deleteCategory = useMutation(api.categories.remove);
  return (
    <Link
      to="/app/tournaments/$slug/categories/$categoryId"
      params={{ slug, categoryId: category._id }}
    >
      <Card className="group hover:-translate-y-0.2 overflow-hidden transition-all duration-300 hover:shadow">
        <CardContent>
          <div className="flex items-center justify-between pb-2">
            {getRatingBadge(category.rating)}
          </div>

          <h3 className="group-hover:text-tournament-blue mb-4 text-lg font-medium tracking-tight text-foreground transition-colors">
            {category.name}
          </h3>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5">
              {category.type === "singles" ? (
                <UserIcon className="size-4 text-muted-foreground/70" />
              ) : (
                <UsersIcon className="size-4 text-muted-foreground/70" />
              )}

              <span>{getTypeLabel(category.type)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <LayoutGridIcon className="size-4 text-muted-foreground/70" />
              <span>{getCategoryLabel(category.category)}</span>
            </div>
            {category.maxParticipants && (
              <div className="flex items-center gap-2.5">
                <UsersIcon className="size-4 text-muted-foreground/70" />
                <span>Max {category.maxParticipants} participants</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="gap-1">
          View details
          <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
        </CardFooter>
      </Card>
    </Link>
  );
}
