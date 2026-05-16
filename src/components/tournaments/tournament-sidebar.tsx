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
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface TournamentSidebarProps {
  slug: string;
}

function statusBgColor(status: "upcoming" | "inProgress" | "completed") {
  switch (status) {
    case "upcoming":
      return "bg-lime-500";
    case "inProgress":
      return "bg-emerald-500";
    case "completed":
      return "bg-blue-500";
    default:
      return "bg-muted-foreground";
  }
}

function TournamentStatusDot({ status }: { status: "upcoming" | "inProgress" | "completed" }) {
  return (
    <span className="relative flex size-1.5">
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
          statusBgColor(status),
        )}
        style={{ animationDuration: "2.8s" }}
      />
      <span className={cn("relative inline-flex size-1.5 rounded-full", statusBgColor(status))} />
    </span>
  );
}

function CategorySkeleton() {
  return (
    <SidebarMenuItem className="px-2 py-1">
      <div className="flex items-center gap-2">
        <div className="size-3.5 animate-pulse rounded bg-sidebar-accent/50" />
        <div className="h-3 w-20 animate-pulse rounded bg-sidebar-accent/40" />
      </div>
    </SidebarMenuItem>
  );
}

function EmptyCategoriesState() {
  return (
    <SidebarMenuItem>
      <div className="flex flex-col items-start gap-2 px-2 py-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-sidebar-accent/50">
          <TagIcon className="size-3.5 text-muted-foreground/60" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-['Geist_Variable'] text-[11px] font-medium text-muted-foreground">
            No categories yet
          </span>
          <span className="max-w-[22ch] font-['Geist_Variable'] text-[10px] leading-relaxed text-muted-foreground/50">
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
  index: number;
}

function CategoryMenuItem({ category, slug, index }: CategoryMenuItemProps) {
  return (
    <SidebarMenuItem
      className="animate-[slide-in_0.45s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0"
      style={{ animationDelay: `${120 + index * 55}ms` }}
    >
      <SidebarMenuButton
        tooltip={`${category.name} · ${category.type}`}
        className="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-[2px] active:scale-[0.98]"
        render={
          <Link
            to="/app/tournaments/$slug/categories/$categoryId"
            params={{ slug, categoryId: category._id }}
          >
            <UsersIcon
              className="size-3.5 shrink-0 text-sidebar-foreground/40 transition-colors duration-300 group-hover/menu-button:text-sidebar-foreground/70"
              strokeWidth={1.5}
            />
            <span className="truncate font-['Geist_Variable'] text-[12px] tracking-tight">
              {category.name}
            </span>
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
      <SidebarGroup className="py-5">
        <div className="flex items-center gap-2.5 px-2">
          <div className="size-8 animate-pulse rounded-lg bg-sidebar-accent/60" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-24 animate-pulse rounded bg-sidebar-accent/60" />
            <div className="h-2.5 w-14 animate-pulse rounded bg-sidebar-accent/40" />
          </div>
        </div>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup className="relative">
        {/* Left accent line - flush to group edge, signals active tournament context */}
        <div
          className="absolute top-3 bottom-3 left-0 w-[2px] rounded-full bg-gradient-to-b from-lime-500/60 via-lime-400/20 to-transparent"
          aria-hidden="true"
        />

        {/* Tournament Header */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={tournament.name}
              className="h-auto py-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-[2px] active:scale-[0.98]"
              render={
                <Link to="/app/tournaments/$slug" params={{ slug }}>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-lime-500/10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/menu-button:scale-105">
                    <TrophyIcon className="size-4 text-lime-600" strokeWidth={1.5} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-['Geist_Variable'] text-[13px] font-semibold tracking-tight">
                      {tournament.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <TournamentStatusDot status={tournament.status} />
                      <span className="capitalize">{tournament.status}</span>
                    </span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Divider */}
        <div
          className="my-3 h-px bg-gradient-to-r from-sidebar-border/40 via-sidebar-border/20 to-transparent"
          aria-hidden="true"
        />

        {/* Categories */}
        <SidebarGroupLabel className="mb-1.5 flex h-auto items-center gap-1.5 px-2 py-0.5 font-['Geist_Variable'] text-[10px] font-medium tracking-[0.08em] text-sidebar-foreground/40 uppercase">
          <LayoutGridIcon className="size-3" strokeWidth={1.5} />
          Categories
        </SidebarGroupLabel>

        <SidebarMenu className="gap-0">
          {categories === undefined ? (
            <>
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
            </>
          ) : categories.length === 0 ? (
            <EmptyCategoriesState />
          ) : (
            categories.map((category, index) => (
              <CategoryMenuItem key={category._id} category={category} slug={slug} index={index} />
            ))
          )}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
