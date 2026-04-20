import { Link, useMatch } from "@tanstack/react-router";
import { UsersIcon } from "lucide-react";

import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export function PlayersMenuItem() {
  const match = useMatch({ from: "/_auth/app/players", shouldThrow: false });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={!!match} render={<Link to="/app/players" />}>
        <UsersIcon />
        <span>Players</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
