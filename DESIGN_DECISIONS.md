# Design Decisions

## Match Sets Score Drift

**Status:** Known gap. No validation mechanism implemented.

**Context:**
The `matchSets` table stores `team1Score` and `team2Score` as a denormalized projection of the `pickleballPoints` sequence for fast reads. The `recordPoint` mutation inserts a point and then patches the `matchSet` to match. However, if a `matchSet` is ever patched directly (or if there's a bug in the mutation), the scores could drift from the actual `pickleballPoints` history.

**Impact:**

- The scoreboard page (`/score/$matchId`) reads `matchSets.team1Score`/`team2Score` directly.
- A drift would show incorrect live scores while the point history remains correct.

**Planned Fix:**
Add a `validateMatchSetScores` internal action or a `recompute` function that rebuilds `matchSets` from `pickleballPoints` on demand. Could also run periodically as a cron job.

**Decision:**
Defer implementation. Trust the current mutations for now. Revisit when needed.
