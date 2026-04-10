## 2026-04-05 - Adding aria-labels to icon-only buttons
**Learning:** Found several icon-only buttons (`Info`, `Eye`) throughout the `ScoutReportDetails` and `FavoritesCard` components that were missing `aria-label` attributes, making their purpose ambiguous to screen reader users.
**Action:** Always verify that buttons containing only icons (like from `lucide-react`) have an explicit `aria-label` string explaining the specific action they perform.

## 2024-04-10 - Adding missing ARIA labels to button elements

**Learning:** When developing accessible React components in `src/components`, a common issue is `<button>` elements missing an `aria-label` attribute, particularly when they contain icons or text with vague context (e.g. "Engagement Log" toggles, insight toggles, or icon-only actions). Using custom `<button>` components rather than an accessible wrapper component (like `<Button size="icon">` from `src/components/ui`) bypasses accessibility defaults.

**Action:** Consistently search for bare `<button>` implementations and explicitly apply `aria-label` attributes to ensure screen readers provide sufficient context, avoiding regression of accessibility features inside generic mapping functions.
## 2024-03-24 - Progress Bar Standardization
**Learning:** Hardcoded pixel widths and inline styles like `style={{ width: \`\${val}%\` }}` clutter UI code and hinder responsive scaling.
**Action:** Always leverage the generic `StatBattery` component (`src/components/ui/StatBattery.tsx`) instead of raw `div` styles or `<Progress>` bars for displaying stats or condition progress bars to ensure consistent styling and logic.
