## 2026-04-05 - Adding aria-labels to icon-only buttons
**Learning:** Found several icon-only buttons (`Info`, `Eye`) throughout the `ScoutReportDetails` and `FavoritesCard` components that were missing `aria-label` attributes, making their purpose ambiguous to screen reader users.
**Action:** Always verify that buttons containing only icons (like from `lucide-react`) have an explicit `aria-label` string explaining the specific action they perform.

## 2024-04-10 - Adding missing ARIA labels to button elements

**Learning:** When developing accessible React components in `src/components`, a common issue is `<button>` elements missing an `aria-label` attribute, particularly when they contain icons or text with vague context (e.g. "Engagement Log" toggles, insight toggles, or icon-only actions). Using custom `<button>` components rather than an accessible wrapper component (like `<Button size="icon">` from `src/components/ui`) bypasses accessibility defaults.

**Action:** Consistently search for bare `<button>` implementations and explicitly apply `aria-label` attributes to ensure screen readers provide sufficient context, avoiding regression of accessibility features inside generic mapping functions.
## 2024-03-24 - Progress Bar Standardization
**Learning:** Hardcoded pixel widths and inline styles like `style={{ width: \`\${val}%\` }}` clutter UI code and hinder responsive scaling.
**Action:** Always leverage the generic `StatBattery` component (`src/components/ui/StatBattery.tsx`) instead of raw `div` styles or `<Progress>` bars for displaying stats or condition progress bars to ensure consistent styling and logic.
## 2024-05-20 - [A11y attributes on functional divs]
**Learning:** React toggles built with `div` instead of `button` require explicitly `role="button"`, `tabIndex`, keyboard handler (`onKeyDown`) and proper `aria` attributes to be accessible. Icon-only buttons must have `aria-label` to be usable by screen readers.
**Action:** When inspecting components, identify actionable non-button elements and convert them to semantic buttons or add correct ARIA attributes and keyboard event handlers.
## 2024-04-23 - Adding ARIA labels to buttons within loops/mapping generic structures
**Learning:** Generic buttons constructed dynamically within `.map()` loops (like for `TACTIC_BANK`, distance ranges, and dynamically generated conditions) often omit specific `aria-label`s since they inherit generic UI markup. It is vital to pass the mapped element properties (like `t.label`, `r`, or specific indices and functions) into an `aria-label` template literal to make them functional for screen readers.
**Action:** When implementing generic array `.map()` structures that return interactive elements (`button`, `a`), dynamically inject `aria-label` properties based on the mapped array value to provide screen readers precise context about what exactly the generic button represents.
## 2026-04-24 - Dynamic Accessibility in Sortable Headers
**Learning:** When making sortable headers accessible, hardcoding `aria-label="Sort"` is an anti-pattern as it overwrites the column name for screen readers. The reviewer flagged the lack of `dir` prop at call sites, but they actually don't pass `dir` because they handle direction via their own sort state variables locally. To prevent overriding context and announce correctly, use visually hidden elements (like `<span className="sr-only">`) alongside the visible text, and ensure component props map correctly without requiring mass refactors of all parent components.
**Action:** Use `.sr-only` appended text rather than static `aria-label` for screen reader state additions that should supplement visible text.
## 2024-05-18 - Nested Tooltips from Button Components
**Learning:** The internal UI `<Button>` component automatically wraps itself in a `<Tooltip>` if the `title` prop is provided. Using `<Button title="...">` inside a manual `<TooltipTrigger>` causes nested/double tooltips to render.
**Action:** When manually wrapping a `<Button>` in a `<Tooltip>`, rely on `aria-label` for screen reader accessibility instead of `title` to prevent the `<Button>` component from spawning its own tooltip.
## 2024-05-15 - UI Accessibility & Responsiveness Audit\n**Learning:** When refactoring UI components for Lovable.dev aesthetic and accessibility, static inline styles and hardcoded pixel dimensions should be replaced by Tailwind design tokens (e.g., `h-[400px]` to `h-full min-h-96`), but dynamic inline styles (like those derived from variables to calculate progress widths) should be left as is.\n**Action:** Use `grep` to systematically identify hardcoded dimensions (`h-[0-9]*px`) and static inline styles (`style={{.*}}`), replace them with equivalent Tailwind tokens, and explicitly verify `aria-label` coverage on purely graphical or generic text buttons without context.
