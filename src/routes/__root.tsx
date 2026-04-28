import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { a11yDevtoolsPlugin } from "@tanstack/devtools-a11y/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth/auth-client";
import { getAuth } from "@/lib/auth/queries";

import appCss from "@/styles.css?url";

export const authQueryOptions = queryOptions({
  queryKey: ["auth"],
  queryFn: getAuth,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  beforeLoad: async (ctx) => {
    const token = await ctx.context.queryClient.ensureQueryData(authQueryOptions);
    // all queries, mutations and actions through TanStack Query will be
    // authenticated during SSR if we have a valid token
    if (token) {
      // During SSR only (the only time serverHttpClient exists),
      // set the auth token to make HTTP queries with.
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return {
      isAuthenticated: !!token,
      token,
    };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        // scaffold:title
        title: "TanStarter",
      },
      {
        name: "description",
        // scaffold:description
        content: "A minimal starter template for 🏝️ TanStack Start.",
      },
    ],
    links: [
      // Replace with your icons here, or remove if you have a favicon.ico in public/
      {
        rel: "icon",
        href: "https://mugnavo.com/favicon.ico",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const context = useRouteContext({ from: Route.id });
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ConvexBetterAuthProvider>
  );
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  return (
    // suppress since we're updating the "dark" class in ThemeProvider
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster richColors />
        </ThemeProvider>

        <TanStackDevtools
          plugins={[
            {
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            a11yDevtoolsPlugin(),
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
