import { httpAction, query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

// Use HTTP action instead of query to access request headers with cookies
export const listDeviceSessions = query(async (ctx) => {
  const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
  console.log(headers);
  const result = await auth.api.listDeviceSessions({ headers });
  return result;
});
