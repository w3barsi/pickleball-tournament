import { Link } from "@tanstack/react-router";
import { TrophyIcon, UsersIcon } from "lucide-react";

import { SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";

import { BaseSidebar, SidebarMenuLinkItem } from "../sidebar/base-sidebar";

export function AdminSidebar() {
  return (
    <BaseSidebar
      header={
        <Link to="/app" className="font-semibold text-sidebar-foreground">
          Pickle Tournament
        </Link>
      }
    >
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuLinkItem
            to="/admin/users"
            icon={UsersIcon}
            label="Manage Users"
            matchFrom="/_auth/admin/users"
          />
          <SidebarMenuLinkItem
            to="/admin/tournaments"
            icon={TrophyIcon}
            label="Manage Tournaments"
            matchFrom="/_auth/admin/tournaments"
          />
        </SidebarMenu>
      </SidebarGroup>
    </BaseSidebar>
  );
}
