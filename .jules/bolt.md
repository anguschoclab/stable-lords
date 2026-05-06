## 2024-05-18 - [Optimizing Object.entries -> map -> sort to inline filtering and loops]
**Learning:** In hot loops such as AI execution (`daily_oracle.ts`) or `PromoterPass.ts` where arrays need to be processed or scored repeatedly, chaining `Object.entries(data).filter(...).map(...).sort(...)` creates excessive intermediate arrays and objects resulting in GC pressure and significant performance slowdowns over thousands of game ticks.
**Action:** Replace functional array chaining with inline single-pass `for...of` loops, or caching structures, effectively avoiding array allocations completely.
## 2026-05-02 - O(N^2) Performance Jank in Bout Replays
**Learning:** Found that `HighlightLog` was re-parsing string combat logs on every tick of the bout viewer replay loop because its `useMemo` block depended on `visibleCount`. This meant O(N) operations per tick, turning into O(N^2) for the entire playback lifecycle.
**Action:** Always pre-calculate derived text properties of static arrays once (memoize based on the `log` array alone) and only filter the *results* array by tick counters (`visibleCount`) to reduce work from O(N) string matches per tick to an O(1) loop filter.

## 2024-06-25 - Handlebars-style string substitution optimization
**Learning:** In tight loops (like narrative log generation and event processing), dynamically instantiating `new RegExp` objects inside an `Object.entries(data)` iteration is a severe performance bottleneck. Generating one regex string literal per object key forces the engine to parse, compile, and execute multiple regex patterns per template dynamically.
**Action:** Always prefer a single static pre-compiled Regex (like `replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, key) => ...)`) that matches the placeholder syntax directly. In our benchmarks, this single-pass matching strategy was over 2x faster, saving significant CPU cycles in hot loops.
