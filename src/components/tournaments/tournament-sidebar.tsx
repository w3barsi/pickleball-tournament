import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CircleDotIcon,
  EyeIcon,
  LayoutGridIcon,
  Loader2Icon,
  SwordsIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";

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

function statusColor(status: "upcoming" | "inProgress" | "completed") {
  switch (status) {
    case "upcoming":
      return "text-lime-500";
    case "inProgress":
      return "text-emerald-500";
    case "completed":
      return "text-blue-500";
    default:
      return "text-muted-foreground";
  }
}

function statusDot(status: "upcoming" | "inProgress" | "completed") {
  return (
    <span className={cn("size-1.5 rounded-full", statusColor(status).replace("text-", "bg-"))} />
  );
}

export function TournamentSidebar({ slug }: TournamentSidebarProps) {
  const { data: tournament } = useQuery(convexQuery(api.tournaments.getBySlug, { slug }));
  const { data: categories } = useQuery(
    convexQuery(
      api.categories.listByTournament,
      tournament ? { tournamentId: tournament._id } : "skip",
    ),
  );

  if (!tournament) {
    return (
      <SidebarGroup>
        <div className="relative mx-1 overflow-hidden rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 p-4">
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
        </div>
      </SidebarGroup>
    );
  }

  return (
    <>
      {/* Tournament-scoped card */}
      <SidebarGroup>
        <div className="relative mx-1 overflow-hidden rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 p-2">
          {/* Accent stripe */}
          <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-lime-500" />

          {/* Header */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip={tournament.name}
                render={
                  <Link to="/app/tournaments/$slug" params={{ slug }}>
                    <TrophyIcon className="size-5 text-lime-500" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{tournament.name}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {statusDot(tournament.status)}
                        <span className="capitalize">{tournament.status}</span>
                      </span>
                    </div>
                  </Link>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Quick Links */}
          <div className="mt-2 border-t border-sidebar-border/50 pt-2">
            <SidebarGroupLabel className="text-[10px] tracking-wider text-sidebar-foreground/60 uppercase">
              Quick Links
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <Link to="/app/tournaments/$slug" params={{ slug }}>
                      <EyeIcon className="size-4" />
                      <span>Overview</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <Link to="/app/tournaments/$slug/categories" params={{ slug }}>
                      <LayoutGridIcon className="size-4" />
                      <span>Categories</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <a href={`/app/tournaments/${slug}/matches`}>
                      <SwordsIcon className="size-4" />
                      <span>All Matches</span>
                    </a>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <a href={`/app/tournaments/${slug}/live`}>
                      <CircleDotIcon className="size-4 text-red-500" />
                      <span>Live Matches</span>
                    </a>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          {/* Categories */}
          <div className="mt-2 border-t border-sidebar-border/50 pt-2">
            <SidebarGroupLabel className="text-[10px] tracking-wider text-sidebar-foreground/60 uppercase">
              Categories
            </SidebarGroupLabel>
            <SidebarMenu>
              {categories === undefined ? (
                <SidebarMenuItem>
                  <span className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                    <Loader2Icon className="size-3 animate-spin" />
                    Loading...
                  </span>
                </SidebarMenuItem>
              ) : categories.length === 0 ? (
                <SidebarMenuItem>
                  <span className="px-2 py-1 text-xs text-muted-foreground">No categories yet</span>
                </SidebarMenuItem>
              ) : (
                categories.map((category) => (
                  <SidebarMenuItem key={category._id}>
                    <SidebarMenuButton
                      tooltip={`${category.name} · ${category.type}`}
                      render={
                        <Link
                          to="/app/tournaments/$slug/categories/$categoryId"
                          params={{ slug, categoryId: category._id }}
                        >
                          <UsersIcon className="size-4 shrink-0 text-sidebar-foreground/60" />
                          <span className="truncate">{category.name}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </div>
        </div>
      </SidebarGroup>
    </>
  );
}
