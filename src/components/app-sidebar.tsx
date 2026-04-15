import { Link } from "@tanstack/react-router";
import {
  UsersIcon,
  UserPlusIcon,
  TrophyIcon,
  TagsIcon,
  LayoutGridIcon,
  Gamepad2Icon,
  HomeIcon,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="font-semibold text-sidebar-foreground">Pickle Tournament</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link to="/app" activeOptions={{ exact: true }}>
                {({ isActive }) => (
                  <SidebarMenuButton isActive={isActive}>
                    <HomeIcon />
                    <span>Home</span>
                  </SidebarMenuButton>
                )}
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link to="/app/players">
                {({ isActive }) => (
                  <SidebarMenuButton isActive={isActive}>
                    <UsersIcon />
                    <span>Players</span>
                  </SidebarMenuButton>
                )}
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link to="/app/playerPairs">
                {({ isActive }) => (
                  <SidebarMenuButton isActive={isActive}>
                    <UserPlusIcon />
                    <span>Player Pairs</span>
                  </SidebarMenuButton>
                )}
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tournament Management</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link to="/app/tournaments">
                {({ isActive }) => (
                  <SidebarMenuButton isActive={isActive}>
                    <TrophyIcon />
                    <span>Tournaments</span>
                  </SidebarMenuButton>
                )}
              </Link>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    render={
                      <Link to="/app/tournaments">
                        <TagsIcon />
                        <span>Categories</span>
                      </Link>
                    }
                  />
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    render={
                      <Link to="/app/tournaments">
                        <LayoutGridIcon />
                        <span>Brackets</span>
                      </Link>
                    }
                  />
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    render={
                      <Link to="/app/games">
                        <Gamepad2Icon />
                        <span>Matches</span>
                      </Link>
                    }
                  />
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
