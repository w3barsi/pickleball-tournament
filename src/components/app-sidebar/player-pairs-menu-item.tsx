import { Link, useMatch } from "@tanstack/react-router";
import { UserPlusIcon } from "lucide-react";

import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export function PlayerPairsMenuItem() {
  const match = useMatch({ from: "/_auth/app/playerPairs", shouldThrow: false });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={!!match} render={<Link to="/app/playerPairs" />}>
        <UserPlusIcon />
        <span>Player Pairs</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
