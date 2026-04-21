# Player Pair Creation Feature Plan

## Status: ✅ IMPLEMENTED

## Overview

Build a complete player pair management page with a dialog-based creation flow. Two autocomplete inputs let you pick/enter player names. On submit, missing players trigger a confirmation dialog (single dialog handles both if both are missing). Only after confirming player creation does the pair get created.

## Requirements

- **Player pairs must be unique** via `pairKey` (sorted player IDs) in the schema.
- Use a **Dialog** to create player pairs.
- Use the **Autocomplete** component to select players with autocomplete.
- Upon submission, if a player entered does not exist, open another dialog to confirm the creation of said player.
- If **both** players do not exist, use **one dialog** for both.
- Only create the player pair when both names have entries in the `players` table.
- Name matching is **exact match** (case-insensitive) against the latest autocomplete query results.
- **Player 1 must be a different person from Player 2**. The UI labels them as first/second, but the `pairKey` is sorted for uniqueness.
- When quick-creating missing players from the pair dialog, **do not include a nickname field**. Nicknames can be added later by editing from the Players page.

---

## 1. Backend Changes ✅

### 1.1 `convex/players.ts` — Add search query ✅

- **New: `search` query**
  - Args: `{ query: v.string() }`
  - Fetch up to 100 players ordered by `_creationTime desc`.
  - Filter client-side with case-insensitive `includes` match on `fullName`.
  - Return first 10 matches (or first 10 overall if query is empty).
  - Powers the autocomplete dropdown.

### 1.2 `convex/playerPairs.ts` — New Convex module ✅

- **New: `listAll` query**
  - Args: `{}`
  - Fetch all `playerPair` documents.
  - Batch-fetch associated `player` documents for `playerOne` and `playerTwo`.
  - Return enriched pairs with `playerOneName`, `playerTwoName`.

- **New: `create` mutation**
  - Args: `{ teamName: v.string(), playerOne: v.id("player"), playerTwo: v.id("player") }`
  - Validate `playerOne !== playerTwo`.
  - Generate `pairKey` from sorted player IDs (e.g. `"idA:idB"` where A < B).
  - Check `by_pair_key` index for an existing pair with the same `pairKey`.
  - If duplicate exists, throw an error.
  - Insert with `wins: 0, losses: 0`.
  - Return the new pair ID.

- **New: `remove` mutation**
  - Args: `{ pairId: v.id("playerPair") }`
  - Delete the pair document.
  - Return `{ success: true }`.

---

## 2. Frontend Changes ✅

### 2.1 `src/routes/_auth/app/playerPairs.tsx` — Player Pairs Page ✅

- **Loader**: pre-fetches `api.playerPairs.listAll` via `convexQuery`.
- **Header Card**: Title ("Player Pairs"), description, and an **"Add Pair"** button that opens the creation dialog.
- **Pairs Table**: lists all pairs with columns:
  - Team Name
  - Player 1 (full name)
  - Player 2 (full name)
  - Wins
  - Losses
  - Actions (Delete)
- **Empty State**: if no pairs exist, show a centered message with the Add Pair button.
- **Delete Flow**: click delete icon → open `AlertDialog` confirmation → call `api.playerPairs.remove` → close dialog.
- Styling and structure mirror the existing `players.tsx` page for consistency.

### 2.2 `src/components/player-pairs/create-player-pair-dialog.tsx` — Main Creation Dialog ✅

A `Dialog` containing a `@tanstack/react-form` form with:

**Fields:**

1. **Team Name** — required text input.
2. **Player 1** — Autocomplete component:
   - Queries `api.players.search` as the user types (debounced 150ms).
   - Dropdown items show `fullName` (and nickname if present).
   - Includes a synthetic **"Create player: X"** option when the typed query does not exactly match any existing player (the installed `@base-ui/react` v1.3.0 does not support `allowCustomValue`, so synthetic items ensure the input is never cleared on blur).
   - Tracks selected player ID in local state.
3. **Player 2** — same autocomplete pattern as Player 1.

**Submit Logic (`onSubmit`):**

1. For each player field:
   - If a selected player ID is stored in state → use it (player exists).
   - Else, search the **latest query results** for a case-insensitive exact `fullName` match → use that player's ID.
   - Else → mark the player as **missing**.
2. Validate that Player 1 and Player 2 are **not the same person**. If they are, show a toast error.
3. **If zero missing players**:
   - Call `api.playerPairs.create({ teamName, playerOne: id1, playerTwo: id2 })`.
   - Close dialog, reset form.
4. **If one or two missing players**:
   - Open the **ConfirmCreatePlayersDialog** (see 2.3), passing the full player context including names and any resolved IDs.

**State Management:**

- `isDialogOpen` controls the main dialog.
- `pending` state drives the confirmation dialog.
- The form resets when the dialog is closed.

### 2.3 `src/components/player-pairs/confirm-create-players-dialog.tsx` — Confirmation AlertDialog ✅

A reusable `AlertDialog` for confirming the creation of missing players:

**Props / Data Received:**

- `pending: { teamName, player1: { name, id }, player2: { name, id } }`
- `onConfirm: (playerOneId: string, playerTwoId: string) => Promise<void>`
- `open`, `onOpenChange`

**UI:**

- **Title**: "Create Missing Players"
- **Description**: "The following players don't exist yet and will be created before forming the pair."
- **Body**: list each missing name.
- **Footer**: Cancel button + "Create Players & Pair" action button.

**On Confirm:**

1. For each missing player, call `api.players.create({ fullName: name, nickname: "" })` in parallel via `Promise.all`.
2. Combine newly created IDs with existing IDs to get the final two player IDs.
3. Determine `playerOne` and `playerTwo` based on the original form positions.
4. Call `onConfirm(playerOneId, playerTwoId)`.
5. Close the confirmation dialog, then close the main creation dialog, and reset the form.

---

## 3. Edge Cases & Validation ✅

| Scenario                                                     | Expected Behavior                                               |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| Both players exist, pair is new                              | Directly create the pair via `api.playerPairs.create`.          |
| One player missing                                           | AlertDialog shows 1 player → create it → then create pair.      |
| Both players missing                                         | Single AlertDialog shows both → create both → then create pair. |
| Pair already exists (same `pairKey`)                         | Backend mutation throws; frontend shows error toast.            |
| Player 1 === Player 2                                        | Frontend toast error prevents submission.                       |
| User types a name that exists but doesn't click the dropdown | Exact match against latest query results resolves it correctly. |
| Empty team name                                              | Form validation error before submission.                        |

---

## 4. Implementation Order ✅

1. ✅ **Backend**: Add `search` to `convex/players.ts`.
2. ✅ **Backend**: Create `convex/playerPairs.ts` with `listAll`, `create`, `remove`.
3. ✅ **Frontend**: Build `create-player-pair-dialog.tsx`.
4. ✅ **Frontend**: Build `confirm-create-players-dialog.tsx`.
5. ✅ **Frontend**: Rewrite `src/routes/_auth/app/playerPairs.tsx` to use the dialogs and list pairs.
6. ✅ **Lint**: Fixed type errors and ensured `pnpm lint` passes for all new files.

---

## 5. Files Created / Modified ✅

### Modified

- `convex/players.ts` — added `search` query
- `src/routes/_auth/app/playerPairs.tsx` — replaced placeholder with full page

### Created

- `convex/playerPairs.ts` — new backend module (`listAll`, `create`, `remove`)
- `src/components/player-pairs/create-player-pair-dialog.tsx` — main dialog with synthetic autocomplete items
- `src/components/player-pairs/confirm-create-players-dialog.tsx` — confirmation dialog

---

## 6. Notes

- `@base-ui/react` v1.3.0 does **not** expose `allowCustomValue` on `Autocomplete.Root`. To work around this, the implementation injects a synthetic `"Create player: X"` item into the dropdown results whenever the typed query lacks an exact match. This ensures users always select a valid item and the input never gets cleared on blur.
- `autoHighlight` is also omitted from the public `AutocompleteRoot` types in v1.3.0, so keyboard users must use Down-arrow + Enter to select the synthetic option. If upgrading base-ui later, `allowCustomValue` and `autoHighlight` can be added to simplify the UX.
