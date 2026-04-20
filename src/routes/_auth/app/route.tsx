import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { Container } from "@/components/container";
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

        <Container parentClassName="w-full">
          <Outlet />
        </Container>
      </SidebarInset>
    </SidebarProvider>
  );
}
