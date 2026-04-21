import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";

import { HomeMenuItem } from "./home-menu-item";
import { PlayerPairsMenuItem } from "./player-pairs-menu-item";
import { PlayersMenuItem } from "./players-menu-item";
import { TournamentsMenuItem } from "./tournaments-menu-item";

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="font-semibold text-sidebar-foreground">Pickle Tournament</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <HomeMenuItem />
            <PlayersMenuItem />
            <PlayerPairsMenuItem />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tournament Management</SidebarGroupLabel>
          <SidebarMenu>
            <TournamentsMenuItem />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
