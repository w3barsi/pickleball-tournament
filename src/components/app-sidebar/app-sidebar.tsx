import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import {
  CheckIcon,
  LoaderCircleIcon,
  LogOutIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth/auth-client";
import { useAuthSuspense } from "@/lib/auth/hooks";
import { cn } from "@/lib/utils";

import { AdminMenuItem } from "./admin-menu-item";
import { HomeMenuItem } from "./home-menu-item";
import { PlayerPairsMenuItem } from "./player-pairs-menu-item";
import { PlayersMenuItem } from "./players-menu-item";
import { TournamentsMenuItem } from "./tournaments-menu-item";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type SessionItem = {
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
  };
};

function SessionManagementDialog({
  open,
  onOpenChange,
  currentUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: { _id: string; name: string; email: string; image?: string | null };
}) {
  const queryClient = useQueryClient();
  const [activeToken, setActiveToken] = useState<string | null>(null);

  const { data: sessions } = useQuery({
    enabled: open,
    queryKey: ["deviceSessions"],
    queryFn: async () => {
      const res = await authClient.multiSession.listDeviceSessions();
      return res;
    },
  });

  const { mutate: switchSession, isPending: isSwitching } = useMutation({
    mutationFn: async (sessionToken: string) => {
      setActiveToken(sessionToken);
      const result = await authClient.multiSession.setActive({ sessionToken });
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Switched to selected account");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to switch account");
    },
    onSettled: () => {
      setActiveToken(null);
    },
  });

  const { mutate: revokeSession, isPending: isRevoking } = useMutation({
    mutationFn: async (sessionToken: string) => {
      const result = await authClient.multiSession.revoke({ sessionToken });
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviceSessions"] });
      toast.success("Session revoked");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke session");
    },
  });

  const isCurrentSession = (sessionUserId: string) => sessionUserId === currentUser._id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Accounts</DialogTitle>
          <DialogDescription>
            Switch between your logged-in accounts or revoke sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions?.data?.map((s) => (
                <TableRow
                  key={s.session.id}
                  className={cn("cursor-pointer", isCurrentSession(s.user.id) && "bg-muted/50")}
                  onClick={() => {
                    if (!isCurrentSession(s.user.id)) {
                      switchSession(s.session.token);
                    }
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage src={s.user.image ?? undefined} alt={s.user.name} />
                        <AvatarFallback>{getInitials(s.user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{s.user.name}</span>
                      {isCurrentSession(s.user.id) && (
                        <CheckIcon className="size-4 text-green-600" />
                      )}
                      {isSwitching && activeToken === s.session.token && (
                        <LoaderCircleIcon className="size-4 animate-spin" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.user.email}</TableCell>
                  <TableCell className="text-center">
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => e.stopPropagation()}
                            disabled={isRevoking}
                          />
                        }
                      >
                        <TrashIcon className="text-destructive" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will log out <strong>{s.user.name}</strong> ({s.user.email}). This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => revokeSession(s.session.token)}
                          >
                            Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {(!sessions || sessions.data?.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No other active sessions
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              window.location.href = "/login";
            }}
          >
            <PlusIcon />
            Add Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserDetails() {
  const { user } = useAuthSuspense();

  const [dialogOpen, setDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 rounded-md px-2 py-2 text-left outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Avatar size="sm">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user.name}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">{user.email}</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <UserIcon />
            Manage Accounts
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    location.reload();
                  },
                },
              });
            }}
          >
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SessionManagementDialog open={dialogOpen} onOpenChange={setDialogOpen} currentUser={user} />
    </>
  );
}

export function AppSidebar() {
  const { isAdmin } = useRouteContext({ from: "/_auth" });
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex h-14 items-center justify-center border-b border-sidebar-border px-4">
        <span className={cn("font-semibold text-sidebar-foreground", isAdmin && "text-red-600")}>
          Pickle Tournament
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <HomeMenuItem />
            <PlayersMenuItem />
            <PlayerPairsMenuItem />
            <AdminMenuItem />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tournament Management</SidebarGroupLabel>
          <SidebarMenu>
            <TournamentsMenuItem />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <Suspense
          fallback={
            <div className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          }
        >
          <UserDetails />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
