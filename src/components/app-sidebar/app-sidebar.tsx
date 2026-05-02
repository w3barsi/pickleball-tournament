import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useQuery } from "@tanstack/react-query";
import { useMatch } from "@tanstack/react-router";
import { HomeIcon, TrophyIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import { useAuthSuspense } from "@/lib/auth/hooks";
import { cn } from "@/lib/utils";

import { BaseSidebar, SidebarMenuLinkItem } from "../sidebar/base-sidebar";
import { TournamentSidebar } from "../tournaments/tournament-sidebar";

function useTournamentSlug(): string | null {
  const tournamentMatch = useMatch({
    from: "/_auth/app/tournaments/$slug",
    shouldThrow: false,
  });
  const bracketMatch = useMatch({
    from: "/_auth/app/brackets/$bracketId/",
    shouldThrow: false,
  });
  const matchMatch = useMatch({
    from: "/_auth/app/matches/$matchId",
    shouldThrow: false,
  });

  const { data: bracketData } = useQuery(
    convexQuery(
      api.brackets.getWithParticipants,
      tournamentMatch || !bracketMatch?.params.bracketId
        ? "skip"
        : { bracketId: bracketMatch.params.bracketId as Id<"brackets"> },
    ),
  );
  const { data: matchData } = useQuery(
    convexQuery(
      api.matches.getWithDetails,
      tournamentMatch || !matchMatch?.params.matchId
        ? "skip"
        : { matchId: matchMatch.params.matchId as Id<"matches"> },
    ),
  );

  if (tournamentMatch) return tournamentMatch.params.slug;
  if (bracketData?.tournament?.slug) return bracketData.tournament.slug;
  if (matchData?.tournament?.slug) return matchData.tournament.slug;
  return null;
}

export function AppSidebar() {
  const { isAdmin } = useAuthSuspense();
  const tournamentSlug = useTournamentSlug();

  return (
    <BaseSidebar
      header={
        <span className={cn("font-semibold text-sidebar-foreground", isAdmin && "text-red-600")}>
          Pickle Tournament
        </span>
      }
    >
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuLinkItem to="/app" icon={HomeIcon} label="Home" matchFrom="/_auth/app" />
          <SidebarMenuLinkItem
            to="/app/players"
            icon={UsersIcon}
            label="Players"
            matchFrom="/_auth/app/players"
          />
          <SidebarMenuLinkItem
            to="/app/playerPairs"
            icon={UserPlusIcon}
            label="Player Pairs"
            matchFrom="/_auth/app/playerPairs"
          />
          <SidebarMenuLinkItem
            to="/admin"
            icon={HomeIcon}
            label="Admin"
            matchFrom="/_auth/admin"
            condition={isAdmin}
          />
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Tournament Management</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuLinkItem
            to="/app/tournaments"
            icon={TrophyIcon}
            label="Tournaments"
            matchFrom="/_auth/app/tournaments/"
          />
        </SidebarMenu>
      </SidebarGroup>

      {tournamentSlug && <TournamentSidebar slug={tournamentSlug} />}
    </BaseSidebar>
  );
}
