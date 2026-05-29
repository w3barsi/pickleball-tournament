/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_lib from "../admin/lib.js";
import type * as admin_players from "../admin/players.js";
import type * as admin_users from "../admin/users.js";
import type * as app_brackets from "../app/brackets.js";
import type * as app_categories from "../app/categories.js";
import type * as app_categoryParticipants from "../app/categoryParticipants.js";
import type * as app_deletionRequests from "../app/deletionRequests.js";
import type * as app_lib from "../app/lib.js";
import type * as app_matches from "../app/matches.js";
import type * as app_playerPairs from "../app/playerPairs.js";
import type * as app_players from "../app/players.js";
import type * as app_scoring from "../app/scoring.js";
import type * as app_tournaments from "../app/tournaments.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/lib": typeof admin_lib;
  "admin/players": typeof admin_players;
  "admin/users": typeof admin_users;
  "app/brackets": typeof app_brackets;
  "app/categories": typeof app_categories;
  "app/categoryParticipants": typeof app_categoryParticipants;
  "app/deletionRequests": typeof app_deletionRequests;
  "app/lib": typeof app_lib;
  "app/matches": typeof app_matches;
  "app/playerPairs": typeof app_playerPairs;
  "app/players": typeof app_players;
  "app/scoring": typeof app_scoring;
  "app/tournaments": typeof app_tournaments;
  auth: typeof auth;
  http: typeof http;
  migrations: typeof migrations;
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
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
};
