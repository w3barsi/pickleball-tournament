import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { TrophyIcon, GamepadIcon, HomeIcon } from "lucide-react";

import { Container } from "@/components/container";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b-4 border-tournament-blue bg-background shadow-sm">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link to="/app" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tournament-lime">
                <TrophyIcon className="size-5 text-tournament-blue" />
              </div>
              <span className="hidden text-lg font-black tracking-tight text-tournament-blue uppercase sm:block">
                Pickleball Tournament
              </span>
            </Link>

            <nav className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 font-bold"
                render={
                  <Link to="/app">
                    <HomeIcon className="size-4" />
                    <span className="hidden sm:inline">Home</span>
                  </Link>
                }
              ></Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 font-bold"
                render={
                  <Link to="/app/tournaments">
                    <TrophyIcon className="size-4" />
                    <span className="hidden sm:inline">Tournaments</span>
                  </Link>
                }
              ></Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 font-bold"
                render={
                  <Link to="/app/games">
                    <GamepadIcon className="size-4" />
                    <span className="hidden sm:inline">Matches</span>
                  </Link>
                }
              ></Button>
              <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-2">
                <SignOutButton />
              </div>
            </nav>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <Container>
          <Outlet />
        </Container>
      </main>
    </div>
  );
}
