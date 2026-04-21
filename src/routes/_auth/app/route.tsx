import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Container } from "@/components/container";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Mobile Navigation Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <SidebarTrigger />
          <span className="font-semibold">Pickle Tournament</span>
        </header>

        {/* Main Content */}
        <Container>
          <Outlet />
        </Container>
      </SidebarInset>
    </SidebarProvider>
  );
}
