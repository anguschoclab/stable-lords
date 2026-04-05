## 2026-04-05 - Adding aria-labels to icon-only buttons
**Learning:** Found several icon-only buttons (`Info`, `Eye`) throughout the `ScoutReportDetails` and `FavoritesCard` components that were missing `aria-label` attributes, making their purpose ambiguous to screen reader users.
**Action:** Always verify that buttons containing only icons (like from `lucide-react`) have an explicit `aria-label` string explaining the specific action they perform.
