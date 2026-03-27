I will update `calculateRecentRecord` in `src/engine/ownerAI.ts` and the equivalent logic in `src/engine/ownerNarrative.ts` to use a single `for` loop instead of four `.filter()` operations.
This turns O(4N) with array allocations into O(N) with no allocations, reducing garbage collection pressure and improving processing speed during the weekly/seasonal pipeline.

Plan:
1. Edit `src/engine/ownerAI.ts`:
   - Rewrite `calculateRecentRecord` to use a single loop over `recentFights`.
   - Update `processOwnerGrudges` to use an early-exit loop for `crossFights` and `hasKill` instead of `.filter` and `.some`.
2. Edit `src/engine/ownerNarrative.ts`:
   - Replace the inline `wins`, `losses`, `kills`, `deaths` `.filter()` logic in `generateOwnerNarratives` with a single loop.
3. Edit `src/engine/ownerRoster.ts`:
   - Inspect for `.filter()` on `r.roster` or `arenaHistory` and optimize to `for` loops where appropriate.
4. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
