
## 2025-05-15 - [Combine sequential array iterations]
**Learning:** Found multiple instances where arrays are iterated sequentially multiple times via `.filter().reduce()` or multiple `.reduce()` calls on the same array (e.g., calculating total wins, total kills, and average fame for an active roster). This causes O(5n) iteration loops for large arrays when O(n) is achievable.
**Action:** Combine sequential `.filter()` and `.reduce()` iterations into a single `.reduce()` pass to improve execution efficiency, especially inside React render loops and `useMemo` hooks.

## 2024-03-22 - Optimize O(N) allocations in Gazette Narrative
**Learning:** O(N) operations executed each week for simulation history that grows rapidly (e.g., iterating through `allFights` repeatedly to find `Rising Stars` and `Rivalries` and building `Map` structures grouped by *all* warriors ever in history) becomes a major CPU and GC bottleneck.
**Action:** Always filter using the current week's events to form a candidate `Set` first. Only evaluate candidate warriors and pairs against the `allFights` history array.
