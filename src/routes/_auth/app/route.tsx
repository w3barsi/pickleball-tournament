import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { Container } from "@/components/container";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <>
      <Container>
        <h1 className="text-2xl font-bold">San Remigio Pickleball Tournament</h1>
      </Container>
      <Container>
        <Outlet />
      </Container>
    </>
  );
}
