import { Link, useMatch } from "@tanstack/react-router";
import { UsersIcon } from "lucide-react";

import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export function UsersMenuItem() {
  const match = useMatch({ from: "/_auth/admin/users", shouldThrow: false });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={!!match} render={<Link to="/admin/users" />}>
        <UsersIcon />
        <span>Manage Users</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
