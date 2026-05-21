import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LayoutGridIcon, TagIcon, TrophyIcon, UsersIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from "@/components/ui/sidebar";

interface TournamentSidebarProps {
  slug: string;
}

function statusColor(status: "upcoming" | "inProgress" | "completed") {
  switch (status) {
    case "upcoming":
      return "bg-yellow-500";
    case "inProgress":
      return "bg-green-500";
    case "completed":
      return "bg-blue-500";
    default:
      return "bg-muted-foreground";
  }
}

function EmptyCategoriesState() {
  return (
    <SidebarMenuItem>
      <div className="flex flex-col items-start gap-2 px-2 py-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-sidebar-accent">
          <TagIcon className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-muted-foreground">No categories yet</span>
          <span className="max-w-[22ch] text-xs text-muted-foreground">
            Categories appear once added.
          </span>
        </div>
      </div>
    </SidebarMenuItem>
  );
}

interface CategoryMenuItemProps {
  category: { _id: string; name: string; type: string };
  slug: string;
}

function CategoryMenuItem({ category, slug }: CategoryMenuItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={`${category.name} · ${category.type}`}
        render={
          <Link
            to="/app/tournaments/$slug/categories/$categoryId"
            params={{ slug, categoryId: category._id }}
          >
            <UsersIcon className="size-4 shrink-0" />
            <span>{category.name}</span>
          </Link>
        }
      />
    </SidebarMenuItem>
  );
}

export function TournamentSidebar({ slug }: TournamentSidebarProps) {
  const { data: tournament } = useQuery(convexQuery(api.app.tournaments.getBySlug, { slug }));
  const { data: categories } = useQuery(
    convexQuery(
      api.app.categories.listByTournament,
      tournament ? { tournamentId: tournament._id } : "skip",
    ),
  );

  if (!tournament) {
    return (
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarGroupLabel>Categories</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuSkeleton />
          <SidebarMenuSkeleton />
          <SidebarMenuSkeleton />
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            tooltip={tournament.name}
            render={
              <Link to="/app/tournaments/$slug" params={{ slug }}>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <TrophyIcon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-semibold">{tournament.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`size-2 rounded-full ${statusColor(tournament.status)}`} />
                    <span className="capitalize">{tournament.status}</span>
                  </span>
                </div>
              </Link>
            }
          />
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarGroupLabel className="pt-2">Categories</SidebarGroupLabel>

      <SidebarMenu>
        {categories === undefined ? (
          <>
            <SidebarMenuSkeleton />
            <SidebarMenuSkeleton />
            <SidebarMenuSkeleton />
          </>
        ) : categories.length === 0 ? (
          <EmptyCategoriesState />
        ) : (
          categories.map((category) => (
            <CategoryMenuItem key={category._id} category={category} slug={slug} />
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
