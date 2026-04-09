## 2026-04-05 - Optimizing Chronological Array Retrieval
**Learning:** When retrieving the N most recent items from arrays that are inherently chronological and append-only (like game events, gazettes, or newsletters), sorting the entire array with O(N log N) is an anti-pattern. The operation becomes increasingly slow as the game progresses.
**Action:** Always use `.slice(-N).reverse()` for chronological append-only arrays instead of spreading and sorting to achieve O(1) performance.
## 2025-03-03 - Replacing O(N log N) Sorts for Max Tracking
**Learning:** Found instances where `Object.entries().sort()[0]` was used purely to find a maximum value in an object's entries (e.g., identifying top styles in gazette narratives). Sorting the entire entries array for this is `O(N log N)` and causes unnecessary array allocations, which creates GC pressure.
**Action:** Replace `Object.entries(obj).sort((a,b) => b[1] - a[1])[0]` with a single-pass `for` loop to track the maximum value (`O(N)`).
## 2025-04-09 - O(N) Insertion Sort over O(N log N) Native Sort for Bounded Top-K React UseMemo Lists
**Learning:** Native `Array.prototype.sort()` over massive simulation outputs (like thousands of raw fight entries passed via `useMemo` into `allFights`) will spike Garbage Collection usage during map/sort cycles. When we only need the top K items (e.g. `slice(0, 5)` in Leaderboards), using a single-pass `for...of` loop with a bounded insertion sort array prevents intermediate allocations entirely.
**Action:** When computing 'top-K' list displays in heavily aggregated UI components, replace `.sort().slice(0, K)` with O(N) linear scans that maintain a max size-K array.
