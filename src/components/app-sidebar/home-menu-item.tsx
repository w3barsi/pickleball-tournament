import { Link, useMatch } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";

import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export function HomeMenuItem() {
  // active when exactly on /app

  const match = useMatch({ from: "/_auth/app", shouldThrow: false });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={!!match} render={<Link to="/app" />}>
        <HomeIcon />
        <span>Home</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
