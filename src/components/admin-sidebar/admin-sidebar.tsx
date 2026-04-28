import { Link } from "@tanstack/react-router";
import { UsersIcon } from "lucide-react";

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
        </SidebarMenu>
      </SidebarGroup>
    </BaseSidebar>
  );
}
