import { convexQuery } from "@convex-dev/react-query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { api } from "../../../convex/_generated/api";

// These hooks can be used in route components or any components.
// They share the same deduped query as beforeLoad/loaders in __root and the _auth layout,
// so these will not result in unnecessary duplicate calls.

export function useAuth() {
  const { data: user, isPending } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
  return { user, isPending };
}

export function useAuthSuspense() {
  const { data: user } = useSuspenseQuery(convexQuery(api.auth.getCurrentUser, {}));
  return { user };
}
