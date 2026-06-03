import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { TrophyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Public Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tournament-blue">
              <TrophyIcon className="size-4 text-white" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">Pickle Tournament</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" render={<Link to="/login">Sign In</Link>} />
            <Button size="sm" render={<Link to="/signup">Get Started</Link>} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 text-sm text-muted-foreground md:px-6">
          <p>&copy; {new Date().getFullYear()} Pickle Tournament</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="transition-colors hover:text-foreground">
              Tournaments
            </Link>
            <Link to="/login" className="transition-colors hover:text-foreground">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
