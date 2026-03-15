
## 2025-05-15 - [Combine sequential array iterations]
**Learning:** Found multiple instances where arrays are iterated sequentially multiple times via `.filter().reduce()` or multiple `.reduce()` calls on the same array (e.g., calculating total wins, total kills, and average fame for an active roster). This causes O(5n) iteration loops for large arrays when O(n) is achievable.
**Action:** Combine sequential `.filter()` and `.reduce()` iterations into a single `.reduce()` pass to improve execution efficiency, especially inside React render loops and `useMemo` hooks.
