import { Link, useMatch } from "@tanstack/react-router";
import { TrophyIcon } from "lucide-react";
import { TagsIcon, LayoutGridIcon, Gamepad2Icon } from "lucide-react";

import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

export function TournamentsMenuItem() {
  const match = useMatch({ from: "/_auth/app/tournaments/", shouldThrow: false });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={!!match} render={<Link to="/app/tournaments" />}>
        <TrophyIcon />
        <span>Tournaments</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
