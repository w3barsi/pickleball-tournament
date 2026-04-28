import { Link, useMatch } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";

import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useAuthSuspense } from "@/lib/auth/hooks";

export function AdminMenuItem() {
  // active when exactly on /app
  const { isAdmin } = useAuthSuspense();

  const match = useMatch({ from: "/_auth/admin", shouldThrow: false });

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
