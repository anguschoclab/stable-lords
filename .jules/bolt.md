## 2026-04-13 - O(N log N) Sort Pattern for Minimum Value
**Learning:** Found a recurring anti-pattern across the codebase where `Array.prototype.sort()[0]` was used to find a single minimum/maximum value. This mutates the underlying array (which can cause subtle bugs if the array is reused) and runs in O(N log N) time, which is inefficient for simply finding an extremum.
**Action:** Replaced `.sort(...)[0]` with a single-pass `Array.prototype.reduce(...)` linear scan for O(N) performance and to avoid unintended mutation side-effects.

## 2026-04-05 - Optimizing Chronological Array Retrieval
**Learning:** When retrieving the N most recent items from arrays that are inherently chronological and append-only (like game events, gazettes, or newsletters), sorting the entire array with O(N log N) is an anti-pattern. The operation becomes increasingly slow as the game progresses.
**Action:** Always use `.slice(-N).reverse()` for chronological append-only arrays instead of spreading and sorting to achieve O(1) performance.

## 2025-03-03 - Replacing O(N log N) Sorts for Max Tracking
**Learning:** Found instances where `Object.entries().sort()[0]` was used purely to find a maximum value in an object's entries (e.g., identifying top styles in gazette narratives). Sorting the entire entries array for this is `O(N log N)` and causes unnecessary array allocations, which creates GC pressure.
**Action:** Replace `Object.entries(obj).sort((a,b) => b[1] - a[1])[0]` with a single-pass `for` loop to track the maximum value (`O(N)`).

## 2025-04-09 - O(N) Insertion Sort over O(N log N) Native Sort for Bounded Top-K React UseMemo Lists
**Learning:** Native `Array.prototype.sort()` over massive simulation outputs (like thousands of raw fight entries passed via `useMemo` into `allFights`) will spike Garbage Collection usage during map/sort cycles. When we only need the top K items (e.g. `slice(0, 5)` in Leaderboards), using a single-pass `for...of` loop with a bounded insertion sort array prevents intermediate allocations entirely.
**Action:** When computing 'top-K' list displays in heavily aggregated UI components, replace `.sort().slice(0, K)` with O(N) linear scans that maintain a max size-K array.

## 2024-06-25 - React Performance Anti-Pattern: O(N^2) Array Methods Inside Render
**Learning:** Found a critical React performance anti-pattern specific to large simulation datasets in this app: executing nested `Array.prototype.filter()` operations across thousands of historical combat records directly inside the render loop. This caused blocking O(S^2 * N) main thread operations during component updates. Mirror matches also caused mathematically inaccurate 100% win-rates under the old logic.
**Action:** Always replace chained/nested array scans over large engine history datasets with single-pass `Record<string, ...>` aggregators wrapped in `useMemo`. This prevents frame drops in the analytics dashboards and naturally resolves mirror match math inconsistencies.
## 2025-03-04 - Eliminate Repeated O(N) Array.from Searches in Loops
**Learning:** Found an `Array.from(map.values()).find(...)` being called repeatedly inside a `forEach` loop in the `generatePairings` simulation logic (`src/engine/bout/core/pairings.ts`). This is technically an O(N^2) operation because `Array.from` allocates a new array and iterates through the entire map on every single loop iteration, creating massive garbage collection overhead when the number of bouts or roster sizes scale up.
**Action:** When searching maps by a secondary key (like `.name` when the map is keyed by `.id`) inside a loop, always pre-compute a secondary O(N) lookup `Map` before the loop starts to achieve O(1) lookups during iteration.
