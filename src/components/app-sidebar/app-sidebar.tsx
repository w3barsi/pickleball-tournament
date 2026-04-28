import { useMatch } from "@tanstack/react-router";
import { HomeIcon, TrophyIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import { useAuthSuspense } from "@/lib/auth/hooks";
import { cn } from "@/lib/utils";

import { BaseSidebar, SidebarMenuLinkItem } from "../sidebar/base-sidebar";
import { TournamentSidebar } from "../tournaments/tournament-sidebar";

export function AppSidebar() {
  const { isAdmin } = useAuthSuspense();
  const tournamentMatch = useMatch({
    from: "/_auth/app/tournaments/$slug",
    shouldThrow: false,
  });
  const isOnTournamentPage = !!tournamentMatch;

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

      {isOnTournamentPage && tournamentMatch && (
        <TournamentSidebar slug={tournamentMatch.params.slug} />
      )}
    </BaseSidebar>
  );
}
