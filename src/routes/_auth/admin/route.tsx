import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminSidebar } from "@/components/admin-sidebar/admin-sidebar";
import { Container } from "@/components/container";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_auth/admin")({
  component: AppLayout,
  beforeLoad: async ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: "/app" });
    }
  },
});

function AppLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
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
