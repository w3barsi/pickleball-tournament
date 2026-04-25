import { Link, useLoaderData, useMatch, useRouteContext } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";

import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export function AdminMenuItem() {
  // active when exactly on /app

  const match = useMatch({ from: "/_auth/admin", shouldThrow: false });
  const { isAdmin } = useRouteContext({ from: "/_auth/app" });

  if (!isAdmin) {
    return undefined;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={!!match} render={<Link to="/admin" />}>
        <HomeIcon />
        <span>Admin</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
