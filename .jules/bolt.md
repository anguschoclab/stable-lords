## 2026-04-05 - Optimizing Chronological Array Retrieval
**Learning:** When retrieving the N most recent items from arrays that are inherently chronological and append-only (like game events, gazettes, or newsletters), sorting the entire array with O(N log N) is an anti-pattern. The operation becomes increasingly slow as the game progresses.
**Action:** Always use `.slice(-N).reverse()` for chronological append-only arrays instead of spreading and sorting to achieve O(1) performance.
## 2025-03-03 - Replacing O(N log N) Sorts for Max Tracking
**Learning:** Found instances where `Object.entries().sort()[0]` was used purely to find a maximum value in an object's entries (e.g., identifying top styles in gazette narratives). Sorting the entire entries array for this is `O(N log N)` and causes unnecessary array allocations, which creates GC pressure.
**Action:** Replace `Object.entries(obj).sort((a,b) => b[1] - a[1])[0]` with a single-pass `for` loop to track the maximum value (`O(N)`).
