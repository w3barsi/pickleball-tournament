import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { TrophyIcon, GamepadIcon, HomeIcon } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { Container } from "@/components/container";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Navigation Header */}

        {/* Main Content */}

        <Container>
          <Outlet />
        </Container>
      </SidebarInset>
    </SidebarProvider>
  );
}
