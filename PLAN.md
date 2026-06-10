# Schema & Architecture Migration Plan

## Overview

This plan implements all the design decisions from the interview. Changes are grouped by dependency order and logical cohesion. Each group should be completed before moving to the next.

**Total Groups:** 6
**Estimated Time:** 2-3 hours (if done sequentially)

---

## Group 1: Schema Cleanup (Foundation Layer)

**Dependencies:** None. Must be done first.

### Step 1.1: Remove `deletedAt` from all tables

**File:** `convex/schema.ts`

Remove `deletedAt: v.optional(v.number())` from these tables:

- `player`
- `playerPair`
- `tournaments`
- `categories`
- `categoryParticipants`
- `brackets`
- `bracketParticipants`
- `matches`
- `matchSets`
- `pickleballPoints`
- `deletionRequest`

Also remove all `by_deletedAt` indexes from those tables.

**Rationale:** We are going full hard-delete. The `deletedAt` fields are currently dead weight because mutations use `ctx.db.delete()` anyway.

**Impact:** This will break any query that filters by `deletedAt === undefined`. You'll need to remove those filters in Group 2.

**Can be done with:** Step 1.2, 1.3, 1.4 (they all touch the same schema file)

---

### Step 1.2: Rename `categories.category` to `gender`

**File:** `convex/schema.ts`

Change:

```
category: v.union(
  v.literal("womens"),
  v.literal("mens"),
  v.literal("mixed"),
  v.literal("open"),
),
```

To:

```
gender: v.union(
  v.literal("womens"),
  v.literal("mens"),
  v.literal("mixed"),
  v.literal("open"),
),
```

**Impact:** Every file that references `category.category` must be updated to `category.gender` in Group 2.

**Can be done with:** Step 1.1, 1.3, 1.4

---

### Step 1.3: Remove `wins`/`losses` from `playerPair`

**File:** `convex/schema.ts`

Remove `wins: v.number()` and `losses: v.number()` from `playerPair` table.

**Impact:** The `pairKey` is still needed for uniqueness. `wins`/`losses` are dead fields now that we derive from matches.

**Can be done with:** Step 1.1, 1.2, 1.4

---

### Step 1.4: Make `player.nickname` optional

**File:** `convex/schema.ts`

Change:

```
nickname: v.string(),
```

To:

```
nickname: v.optional(v.string()),
```

**Impact:** Frontend queries that display `player.nickname` should fall back to `fullName` if `nickname` is undefined. Update UI in Group 5.

**Can be done with:** Step 1.1, 1.2, 1.3

---

### Step 1.5: Run `npx convex dev` to regenerate types

After schema changes, regenerate the Convex types.

---

## Group 2: Fix Queries After Schema Changes

**Dependencies:** Group 1 must be complete.

### Step 2.1: Remove all `deletedAt` filters

**Files:** `convex/public/tournaments.ts`, `convex/public/games.ts`, `convex/admin/tournaments.ts`, `convex/admin/players.ts`, any other file with `deletedAt === undefined` filters.

Remove `.withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined))` queries.

Remove `tournament.deletedAt === undefined` or `player.deletedAt === undefined` filters in `.filter()` calls.

**Files to check:**

- `convex/public/tournaments.ts` (list, counts, showcaseList, getBySlug, getDetails)
- `convex/public/games.ts` (getLiveGames, getRecentMatches)
- `convex/admin/tournaments.ts` (list)
- `convex/admin/players.ts` (remove, removePair)
- Any other file with `deletedAt` references

---

### Step 2.2: Rename `category` to `gender` in all queries/mutations

**Files to update:**

- `convex/app/categories.ts` (create, update args)
- `convex/app/categoryParticipants.ts` (register, registerWithPlayers)
- `convex/app/matches.ts` (hydrateMatch)
- `convex/app/scoring.ts` (resolveParticipant)
- `convex/public/games.ts` (getLiveGames, getRecentMatches, getMatchDetails)
- `convex/public/tournaments.ts` (getDetails)

Also update all frontend files:

- `src/components/tournaments/edit-category-dialog.tsx`
- `src/components/tournaments/create-category-dialog.tsx`
- `src/routes/_auth/app/tournaments.$slug.categories.$categoryId.index.tsx` (getCategoryLabel function)
- Any other file with `category.category` references

---

### Step 2.3: Fix `playerPair` mutations after removing `wins`/`losses`

**Files:** `convex/app/playerPairs.ts`, `convex/app/categoryParticipants.ts`

Remove `wins: 0, losses: 0` from `create` and `createWithPlayers` mutations.

Also update `categoryParticipants.ts` `register` mutation — it auto-creates playerPairs with `wins: 0, losses: 0`. Remove those.

---

### Step 2.4: Update `player` auto-creation to not require `nickname`

**Files:** `convex/app/categoryParticipants.ts`, `convex/app/playerPairs.ts`

Wherever a player is auto-created with `nickname: ""`, remove that field or set it to `undefined`.

---

## Group 3: Match Participants at Bracket Level

**Dependencies:** Group 2 must be complete.

### Step 3.1: Update `matches` schema

**File:** `convex/schema.ts`

Change:

```
participant1Id: v.id("categoryParticipants"),
participant2Id: v.id("categoryParticipants"),
```

To:

```
participant1Id: v.optional(v.id("bracketParticipants")),
participant2Id: v.optional(v.id("bracketParticipants")),
```

Also change:

```
winnerParticipantId: v.optional(v.id("categoryParticipants")),
```

To:

```
winnerParticipantId: v.optional(v.id("bracketParticipants")),
```

Remove `isBye: v.optional(v.boolean())` from `matches`.

Update indexes:

- Change `by_participant` and `by_participant2` to reference `bracketParticipants`

---

### Step 3.2: Update `matches` mutations

**File:** `convex/app/matches.ts`

- **`create` mutation:** Check `bracketParticipants` instead of `categoryParticipants`. Validate that both participants are in the bracket.
- **`updateResult` mutation:** Update `winnerParticipantId` to reference `bracketParticipants`.
- **`reset` mutation:** Remove win/loss updates from `categoryParticipants` (will move to bracket-level in Group 4).
- **`generateRoundRobin` mutation:** Use `bracketParticipants` IDs instead of `categoryParticipants` IDs.
- **`remove` mutation:** Remove win/loss updates from `categoryParticipants`.
- **`hydrateMatch` function:** Change to resolve `bracketParticipants` instead of `categoryParticipants`. Traverse from `bracketParticipant` -> `categoryParticipant` -> player/pair.

---

### Step 3.3: Update `matches` queries

**File:** `convex/app/matches.ts`, `convex/public/games.ts`

- **`listByBracket`:** Update to resolve `bracketParticipants` instead of `categoryParticipants`.
- **`listByTournament`:** Update `hydrateMatch` to resolve bracket-level participants.
- **`getWithDetails`:** Same as above.
- **`getLiveMatchDetails`:** Same as above.
- **`public/games.ts`:** Update `resolveParticipant` to resolve `bracketParticipants` -> `categoryParticipants` -> player/pair.

---

### Step 3.4: Update scoring engine

**File:** `convex/app/scoring.ts`

- **`resolveParticipant`:** Change to accept `bracketParticipants` ID, then resolve to `categoryParticipant` -> player/pair.
- **`updateParticipantRecords`:** This currently updates `categoryParticipants`. In Group 4, you'll add bracket-level tracking too.
- **`confirmSetComplete`:** Update winner/loser references to `bracketParticipants`.
- **`forfeitMatch`:** Update winner/loser references to `bracketParticipants`.
- **`undoLastPoint`:** Update `updateParticipantRecords` call.
- **`getMatchForScorer`:** Update `resolveParticipant` calls.

---

### Step 3.5: Update frontend match components

**Files:** `src/components/tournaments/match-list.tsx`, `src/components/tournaments/create-match-dialog.tsx`, `src/routes/score.$matchId.tsx`, `src/routes/_auth/scorer.$id.tsx`

- **`create-match-dialog.tsx`:** Pass `bracketParticipants` instead of `categoryParticipants` to match creation.
- **`match-list.tsx`:** Update participant resolution to go through bracket participants.
- **`score.$matchId.tsx`:** Update participant display logic.
- **`scorer.$id.tsx`:** Update participant display logic.

---

## Group 4: Add `wins`/`losses` to `bracketParticipants`

**Dependencies:** Group 3 must be complete.

### Step 4.1: Update `bracketParticipants` schema

**File:** `convex/schema.ts`

Add to `bracketParticipants`:

```
wins: v.number(),
losses: v.number(),
```

**Note:** When creating bracket participants, default to `0`.

---

### Step 4.2: Update `brackets.addParticipants` mutation

**File:** `convex/app/brackets.ts`

Add `wins: 0, losses: 0` when inserting bracket participants.

---

### Step 4.3: Update scoring engine to write both levels

**File:** `convex/app/scoring.ts`

- **`updateParticipantRecords`:** Update to accept `bracketParticipantId` and `categoryParticipantId`. Update both tables.
- **`confirmSetComplete`:** Call `updateParticipantRecords` with both bracket and category participant IDs.
- **`forfeitMatch`:** Same as above.
- **`undoLastPoint`:** Same as above.

---

### Step 4.4: Update `matches.updateResult` mutation

**File:** `convex/app/matches.ts`

Update to write `wins`/`losses` to both `bracketParticipants` and `categoryParticipants`.

---

### Step 4.5: Update `matches.reset` and `matches.remove` mutations

**File:** `convex/app/matches.ts`

Update to decrement `wins`/`losses` from both `bracketParticipants` and `categoryParticipants`.

---

### Step 4.6: Update frontend to display bracket-level records

**File:** `src/components/tournaments/bracket-participant-list.tsx`

Add bracket-level `wins`/`losses` display alongside category-level records. Or just show the bracket-level record since that's the current context.

---

## Group 5: Timestamp Standardization

**Dependencies:** Group 4 should be complete.

### Step 5.1: Create migration script

**File:** `convex/migrations/convertTimestamps.ts`

Write a one-time migration that:

1. Iterates all `player` records and divides `dateOfBirth` by 1000
2. Iterates all `matches` records and divides `lastUpdatedAt`, `startedAt`, `completedAt`, `scheduledAt` by 1000
3. Iterates all `matchSets` records and divides `completedAt` by 1000
4. Iterates all `pickleballPoints` records and divides `timestamp` by 1000
5. Iterates all `tournaments` records and divides `date`, `endDate`, `registrationDeadline` by 1000
6. Iterates all `deletionRequest` records and divides `updatedAt` by 1000

**Note:** Better Auth tables (`user`, `session`, etc.) also use `createdAt`/`updatedAt`/`expiresAt` in milliseconds. **DO NOT migrate those** — they are auto-generated by Better Auth and should stay in their native format.

---

### Step 5.2: Update all mutations to use `Date.now() / 1000`

**Files:** All mutation files in `convex/app/` and `convex/admin/`

Replace `Date.now()` with `Date.now() / 1000` (or `Math.floor(Date.now() / 1000)`) in these mutations:

- `convex/app/playerPairs.ts` (`create`, `createWithPlayers`)
- `convex/app/tournaments.ts` (`create`, `update`)
- `convex/app/categories.ts` (`create`, `update`)
- `convex/app/categoryParticipants.ts` (`register`, `registerWithPlayers`, `updateStatus`)
- `convex/app/brackets.ts` (`create`, `update`, `addParticipants`)
- `convex/app/matches.ts` (`create`, `update`, `updateResult`, `reset`, `generateRoundRobin`)
- `convex/app/scoring.ts` (`startMatch`, `startNextSet`, `recordPoint`, `confirmSetComplete`, `undoLastPoint`, `forfeitMatch`, `cancelSet`, `setMatchLive`)
- `convex/app/deletionRequests.ts` (if exists)
- `convex/admin/players.ts` (`remove`, `removePair` — update `updatedAt`)
- `convex/admin/tournaments.ts` (`setFeatured`, `unsetFeatured`, `setShowcaseOrder`)

---

### Step 5.3: Update frontend to use seconds for display

**Files:** Any frontend that formats dates from Convex

If the frontend converts Convex timestamps to dates, ensure it multiplies by 1000 before passing to `new Date()`.

---

## Group 6: Feature & Business Logic Updates

**Dependencies:** Groups 1-5 should be complete.

### Step 6.1: Auto-generate `category.name` from structured fields

**File:** `convex/app/categories.ts`

In the `create` mutation:

- If `name` is provided, use it
- If `name` is not provided, auto-generate: `${rating} ${gender} ${type}` (e.g., "Advanced Mixed Doubles")
- Capitalize first letter of each word

In the `update` mutation:

- If `name` is being updated to empty string, auto-regenerate

**Frontend:** Update `CreateCategoryDialog` and `EditCategoryDialog` to show the auto-generated name as a placeholder or default.

---

### Step 6.2: Enforce `slug` uniqueness

**File:** `convex/app/tournaments.ts`

In the `create` mutation:

- Before inserting, query `by_slug` for the requested slug
- If a tournament exists with that slug, throw: `A tournament with this slug already exists`

In the frontend (`create-tournament-dialog.tsx`):

- Wrap the mutation call in try/catch
- Show `toast.error("A tournament with this slug already exists")` on duplicate

---

### Step 6.3: Scope `isLive` per tournament

**File:** `convex/app/scoring.ts`

In `setMatchLive` mutation:

- When `isLive === true`, only find and un-set other live matches with the same `tournamentId`
- Change the query from `by_is_live` to `by_tournament_live` with `q.eq("tournamentId", match.tournamentId).eq("isLive", true)`

**Note:** The `by_is_live` index can be removed since `by_tournament_live` already exists.

---

### Step 6.4: Make bracket rules immutable once matches start

**File:** `convex/app/brackets.ts`

In the `update` mutation:

- Before patching, check if any matches exist for this bracket with `status !== "scheduled"`
- If matches are in progress or completed, reject changes to `numberOfSets`, `pointsPerGame`, `winByTwo`
- Allow changes to `name`, `label`, `stage`, `status`, `maxParticipants` even if matches exist

---

### Step 6.5: Fix `playerPair.create` mutation to sort players

**File:** `convex/app/playerPairs.ts`

In the `create` mutation:

- Sort the IDs: `const ids = [args.playerOne, args.playerTwo].sort()`
- Use `ids[0]` for `playerOne` and `ids[1]` for `playerTwo` in the insert

Currently it creates `pairKey` from sorted IDs but stores original `playerOne`/`playerTwo`. Fix this.

---

### Step 6.6: Pre-create single elimination bracket structure

**File:** `convex/app/matches.ts`

Add a new mutation: `generateSingleElimination`:

- Accept `bracketId`
- Get all `bracketParticipants` for the bracket
- Calculate the bracket tree size (next power of 2 >= participant count)
- Create all matches in the bracket tree, with `participant1Id` and `participant2Id` as `null` for matches that don't have known participants yet
- Set `nextMatchId` and `nextMatchPosition` for bracket progression
- For matches where one participant is known (e.g., round 1), set them. For unknowns, leave null.

**Frontend:** Add a "Generate Bracket" button in the bracket detail page (similar to "Generate Round Robin").

---

### Step 6.7: Update `create-match-dialog` to handle null participants

**File:** `src/components/tournaments/create-match-dialog.tsx`

- When creating a match in a single elimination bracket, allow selecting from bracket participants OR leaving a slot as "TBD"
- Show "TBD" in the UI for null participant slots

---

### Step 6.8: Add `playerPair` sorting in `createWithPlayers`

**File:** `convex/app/playerPairs.ts`

The `createWithPlayers` already sorts correctly. Just verify it after the `wins`/`losses` removal in Step 2.3.

---

## Order of Execution

```
Group 1 (Schema) → Group 2 (Query fixes) → Group 3 (Match refs) → Group 4 (Bracket records) → Group 5 (Timestamps) → Group 6 (Features)
```

**Critical path:** You cannot do Group 3 before Group 2 because Group 3 changes the schema, and Group 2 fixes all the `deletedAt` and `category` references that would break after Group 1.

**Parallelizable:** Within each group, most steps can be done in parallel. But the schema file (`convex/schema.ts`) changes in Steps 1.1, 1.2, 1.3, 1.4, 3.1, and 4.1 should be done together as a single schema edit to avoid multiple type regenerations.

---

## One-Shot Schema Changes

You can combine all schema changes into a single edit to `convex/schema.ts`:

1. Remove all `deletedAt` fields
2. Remove `by_deletedAt` indexes
3. Rename `category` to `gender` on `categories` table
4. Remove `wins`/`losses` from `playerPair`
5. Make `nickname` optional on `player`
6. Change `matches` participant IDs to optional `bracketParticipants` references
7. Remove `isBye` from `matches`
8. Add `wins`/`losses` to `bracketParticipants`
9. Update `matches` indexes to reference `bracketParticipants`

After this single edit, run `npx convex dev` once to regenerate all types.

---

## Files That Will Be Modified

### Schema & Backend (20+ files)

- `convex/schema.ts` — major rewrite
- `convex/app/playerPairs.ts` — remove wins/losses, fix sorting
- `convex/app/tournaments.ts` — add slug uniqueness, seconds timestamps
- `convex/app/categories.ts` — rename category to gender, auto-generate name, seconds timestamps
- `convex/app/categoryParticipants.ts` — remove deletedAt filters, gender rename, seconds timestamps
- `convex/app/brackets.ts` — add wins/losses, immutable rules, seconds timestamps
- `convex/app/matches.ts` — bracket-level participants, seconds timestamps
- `convex/app/scoring.ts` — bracket-level participants, per-tournament isLive, seconds timestamps
- `convex/app/deletionRequests.ts` — seconds timestamps
- `convex/public/games.ts` — remove deletedAt filters, gender rename, bracket-level participants
- `convex/public/tournaments.ts` — remove deletedAt filters, gender rename
- `convex/admin/tournaments.ts` — remove deletedAt filters, seconds timestamps
- `convex/admin/players.ts` — remove deletedAt filters, seconds timestamps
- `convex/app/lib.ts` — remove deletedAt from cascade delete

### Frontend (10+ files)

- `src/components/tournaments/edit-category-dialog.tsx`
- `src/components/tournaments/create-category-dialog.tsx`
- `src/components/tournaments/create-tournament-dialog.tsx`
- `src/components/tournaments/match-list.tsx`
- `src/components/tournaments/create-match-dialog.tsx`
- `src/components/tournaments/bracket-participant-list.tsx`
- `src/components/tournaments/participant-list.tsx`
- `src/routes/_auth/app/tournaments.$slug.categories.$categoryId.index.tsx`
- `src/routes/score.$matchId.tsx`
- `src/routes/_auth/scorer.$id.tsx`

### New Files

- `convex/migrations/convertTimestamps.ts` — timestamp migration

---

## Notes

- **Better Auth tables:** Leave `user`, `session`, `account`, `verification`, `jwks` untouched. They are auto-generated by Better Auth.
- **Test after each group:** Run `pnpm tsc --noEmit` after completing each group to catch type errors early.
- **Convex dev:** Run `npx convex dev` after the schema changes (Group 1) and before any frontend work. The generated types must be updated before TypeScript can validate the new schema references.
- **Migration:** The timestamp migration is one-time. Run it via `npx convex run migrations/convertTimestamps` after deploying the new schema.
