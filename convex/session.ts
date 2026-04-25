import { query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { auth } from "./betterAuth/auth";

export const listDeviceSessions = query({
  args: {},
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    return auth.api.listDeviceSessions({ headers });
  },
});
