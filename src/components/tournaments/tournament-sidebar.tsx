import {
  CircleDotIcon,
  EyeIcon,
  LayoutGridIcon,
  SwordsIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// ─── Types matching convex/schema.ts ───────────────────────────────────────

type TournamentStatus = "upcoming" | "inProgress" | "completed";
type MatchStatus = "scheduled" | "inProgress" | "completed" | "abandoned";

interface MockTournament {
  _id: string;
  name: string;
  slug: string;
  status: TournamentStatus;
  date: number;
  organizerName: string;
}

interface MockCategory {
  _id: string;
  tournamentId: string;
  name: string;
  type: "singles" | "doubles";
  format: "roundRobin" | "singleElimination";
  rating: "beginner" | "intermediate" | "advanced";
  category: "womens" | "mens" | "mixed" | "open";
}

interface MockMatch {
  _id: string;
  categoryId: string;
  status: MatchStatus;
  isLive?: boolean;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────

const MOCK_TOURNAMENT: MockTournament = {
  _id: "k57a1c2d3e4f5g6h7i8j9k0l1",
  name: "Spring Pickle Classic 2026",
  slug: "spring-pickle-classic-2026",
  status: "inProgress",
  date: 1751328000000,
  organizerName: "City Pickleball Club",
};

const MOCK_CATEGORIES: MockCategory[] = [
  {
    _id: "cat_001",
    tournamentId: MOCK_TOURNAMENT._id,
    name: "Men's Doubles",
    type: "doubles",
    format: "singleElimination",
    rating: "advanced",
    category: "mens",
  },
  {
    _id: "cat_002",
    tournamentId: MOCK_TOURNAMENT._id,
    name: "Women's Doubles",
    type: "doubles",
    format: "roundRobin",
    rating: "intermediate",
    category: "womens",
  },
  {
    _id: "cat_003",
    tournamentId: MOCK_TOURNAMENT._id,
    name: "Mixed Doubles",
    type: "doubles",
    format: "singleElimination",
    rating: "advanced",
    category: "mixed",
  },
  {
    _id: "cat_004",
    tournamentId: MOCK_TOURNAMENT._id,
    name: "Open Singles",
    type: "singles",
    format: "roundRobin",
    rating: "beginner",
    category: "open",
  },
];

const MOCK_MATCHES: MockMatch[] = [
  { _id: "match_003", categoryId: "cat_001", status: "inProgress", isLive: true },
  { _id: "match_006", categoryId: "cat_002", status: "inProgress" },
  { _id: "match_010", categoryId: "cat_004", status: "inProgress", isLive: true },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function statusColor(status: TournamentStatus | MatchStatus) {
  switch (status) {
    case "upcoming":
    case "scheduled":
      return "text-lime-500";
    case "inProgress":
      return "text-emerald-500";
    case "completed":
      return "text-blue-500";
    case "abandoned":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
}

function statusDot(status: TournamentStatus | MatchStatus) {
  return (
    <span className={cn("size-1.5 rounded-full", statusColor(status).replace("text-", "bg-"))} />
  );
}

function liveCountForCategory(categoryId: string) {
  return MOCK_MATCHES.filter((m) => m.categoryId === categoryId && m.isLive).length;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function TournamentSidebar() {
  const tournament = MOCK_TOURNAMENT;
  const totalLive = MOCK_MATCHES.filter((m) => m.isLive).length;

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
                  <a href={`/app/tournaments/${tournament.slug}`}>
                    <TrophyIcon className="size-5 text-lime-500" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{tournament.name}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {statusDot(tournament.status)}
                        <span className="capitalize">{tournament.status}</span>
                      </span>
                    </div>
                  </a>
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
                    <a href={`/app/tournaments/${tournament.slug}`}>
                      <EyeIcon className="size-4" />
                      <span>Overview</span>
                    </a>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <a href={`/app/tournaments/${tournament.slug}/categories`}>
                      <LayoutGridIcon className="size-4" />
                      <span>Categories</span>
                    </a>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <a href={`/app/tournaments/${tournament.slug}/matches`}>
                      <SwordsIcon className="size-4" />
                      <span>All Matches</span>
                    </a>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <a href={`/app/tournaments/${tournament.slug}/live`}>
                      <CircleDotIcon className="size-4 text-red-500" />
                      <span>Live Matches</span>
                    </a>
                  }
                />
                {totalLive > 0 && (
                  <SidebarMenuBadge className="bg-red-500 text-white">{totalLive}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          {/* Categories */}
          <div className="mt-2 border-t border-sidebar-border/50 pt-2">
            <SidebarGroupLabel className="text-[10px] tracking-wider text-sidebar-foreground/60 uppercase">
              Categories
            </SidebarGroupLabel>
            <SidebarMenu>
              {MOCK_CATEGORIES.map((category) => {
                const live = liveCountForCategory(category._id);
                return (
                  <SidebarMenuItem key={category._id}>
                    <SidebarMenuButton
                      tooltip={`${category.name} · ${category.type} · ${category.format}`}
                      render={
                        <a href={`/app/tournaments/${tournament.slug}/categories/${category._id}`}>
                          <UsersIcon className="size-4 shrink-0 text-sidebar-foreground/60" />
                          <span className="truncate">{category.name}</span>
                        </a>
                      }
                    />
                    {live > 0 && (
                      <SidebarMenuBadge className="bg-red-500 text-white">{live}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        </div>
      </SidebarGroup>
    </>
  );
}
