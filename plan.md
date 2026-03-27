1. **Understand Goal**: Replace inefficient array filtering (`.filter()`) in `src/engine/ownerAI.ts`, `src/engine/ownerNarrative.ts`, and `src/engine/ownerRoster.ts` with standard `for` loops. Specifically, the functions `calculateRecentRecord`, `generateOwnerNarratives`, and `processOwnerGrudges` are filtering large arrays like `recentFights` multiple times. Doing this in a single pass will be much faster.

2. **Analyze `calculateRecentRecord` in `src/engine/ownerAI.ts` and `src/engine/ownerNarrative.ts`**:
   The `calculateRecentRecord` function in `ownerAI.ts` and `ownerNarrative.ts` iterates over `recentFights` four times via `.filter()` to calculate `wins`, `losses`, `kills`, and `deaths`. We can replace this with a single `for` loop.

3. **Analyze `generateOwnerNarratives` in `src/engine/ownerNarrative.ts`**:
   It calculates `wins, losses, kills, deaths` using `.filter()`. We can extract this into a single pass loop. It also already has `calculateRecentRecord` copied from `ownerAI.ts`. Wait, looking closely, `ownerNarrative.ts` has its own `.filter()` blocks directly in `generateOwnerNarratives` despite having `calculateRecentRecord` imported or defined? Let's check `ownerNarrative.ts`. Actually, `ownerNarrative.ts` has the logic in `generateOwnerNarratives` directly and also uses `calculateRecentRecord`.

4. **Analyze `processOwnerGrudges` in `src/engine/ownerAI.ts`**:
   It uses `.filter()` to find `crossFights` between two rosters. Then it checks `.some()`. We could just iterate and push to `crossFights` or even better, just check `hasKill` in the same loop.

5. **Let's focus on `calculateRecentRecord` and the equivalent logic in `generateOwnerNarratives` and `processAIRosterManagement` (or similar).**
   Actually, the best bang for our buck is to optimize `calculateRecentRecord` in `ownerAI.ts` and ensure it's used efficiently.
   Wait, `ownerAI.ts` has:
   ```typescript
   function calculateRecentRecord(recentFights: import("@/types/game").FightSummary[], rosterNames: Set<string>) {
     // 4 filters
   }
   ```
   This is a perfect candidate. Instead of 4 full passes over `recentFights`, we can do 1 pass.
   Let's check `ownerNarrative.ts` too. It has:
   ```typescript
    const wins = recentFights.filter(f =>
      (names.has(f.a) && f.winner === "A") || (names.has(f.d) && f.winner === "D")
    ).length;
    // ... 3 more filters
   ```
   We can replace this with `calculateRecentRecord` or just inline the single pass loop.

Let's do this optimization in `src/engine/ownerAI.ts` and `src/engine/ownerNarrative.ts`.
