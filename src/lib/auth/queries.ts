import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { getToken } from "./auth-server";

/**

 * This query is mainly used in _auth/route.tsx, which is the _auth layout
 * that protects all child routes under it (e.g. _auth/app/*)
 */
export const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return (await getToken()) ?? null;
});
