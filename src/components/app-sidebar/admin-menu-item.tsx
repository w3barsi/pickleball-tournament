import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { Link, useLoaderData, useMatch, useRouteContext } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";

import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { authQueryOptions } from "@/routes/__root";

export function AdminMenuItem() {
  // active when exactly on /app

  const match = useMatch({ from: "/_auth/admin", shouldThrow: false });
  const { data } = useQuery(convexQuery(api.auth.getCurrentUser, {}));

  if (data?.role !== "admin") {
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
