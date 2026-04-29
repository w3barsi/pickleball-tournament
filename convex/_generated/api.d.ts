/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as brackets from "../brackets.js";
import type * as categories from "../categories.js";
import type * as categoryParticipants from "../categoryParticipants.js";
import type * as deletionRequests from "../deletionRequests.js";
import type * as http from "../http.js";
import type * as matches from "../matches.js";
import type * as playerPairs from "../playerPairs.js";
import type * as players from "../players.js";
import type * as scoring from "../scoring.js";
import type * as session from "../session.js";
import type * as tournaments from "../tournaments.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  brackets: typeof brackets;
  categories: typeof categories;
  categoryParticipants: typeof categoryParticipants;
  deletionRequests: typeof deletionRequests;
  http: typeof http;
  matches: typeof matches;
  playerPairs: typeof playerPairs;
  players: typeof players;
  scoring: typeof scoring;
  session: typeof session;
  tournaments: typeof tournaments;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
};
