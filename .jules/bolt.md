## 2026-04-05 - Optimizing Chronological Array Retrieval
**Learning:** When retrieving the N most recent items from arrays that are inherently chronological and append-only (like game events, gazettes, or newsletters), sorting the entire array with O(N log N) is an anti-pattern. The operation becomes increasingly slow as the game progresses.
**Action:** Always use `.slice(-N).reverse()` for chronological append-only arrays instead of spreading and sorting to achieve O(1) performance.
