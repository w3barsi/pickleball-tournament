import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  TrophyIcon,
  GamepadIcon,
  PlusIcon,
  ChevronRightIcon,
  CalendarIcon,
  UsersIcon,
} from "lucide-react";

import { HeaderCard, HeaderCardDescription, HeaderCardHeading } from "@/components/header-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/admin/")({
  component: AppIndex,
  beforeLoad: () => {
    throw redirect({ to: "/admin/users" });
  },
});

function AppIndex() {
  return <div className="space-y-8">test</div>;
}
