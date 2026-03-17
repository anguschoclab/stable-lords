🎯 **What:** The `loadWeek` function in `src/engine/stats/styleRollups.ts` lacked tests to verify it gracefully falls back to returning an empty object (`{}`) when `localStorage.getItem` returns malformed JSON, throws an error, or returns `null`.

📊 **Coverage:** Added explicit coverage for `loadWeek` (via the exposed `getWeekRollup` API wrapper):
- When `localStorage` returns `null`
- When `localStorage` returns malformed JSON (e.g. `"{ invalid json "`)
- When accessing `localStorage` throws an exception
- When `localStorage` returns valid JSON payload

✨ **Result:** Test suite is now more robust with the successful addition of 4 passing tests directly tackling parsing fallbacks for `styleRollups.ts`.
