import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

import { isAuthError } from "@/lib/utils";

export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthReactStart({
    convexUrl: process.env.VITE_CONVEX_URL!,
    convexSiteUrl: process.env.VITE_CONVEX_SITE_URL!,
    jwtCache: {
      enabled: true,
      isAuthError: isAuthError,
    },
  });
