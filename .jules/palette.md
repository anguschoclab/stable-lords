
## 2025-01-31 - Tooltip buttons need ARIA labels
**Learning:** Icon-only buttons wrapped in `TooltipTrigger asChild` still need an explicit `aria-label` because `TooltipContent` isn't always reliably announced as the button's accessible name by screen readers.
**Action:** Always add `aria-label` to icon-only `<Button>`s even when inside a `<Tooltip>`.
## 2024-03-27 - External Link Icons in Modal Headers
**Learning:** Icon-only buttons representing "external links" (like opening a full dossier from a preview sheet) are frequently missing `aria-label`s because their visual context (an icon in a corner) is obvious to sighted users but completely invisible to screen readers, especially when isolated from the main sheet content.
**Action:** When implementing side-panels, sheets, or modals that contain "view full page" icon buttons in their headers, ensure they always have explicit `title` and `aria-label` attributes to clarify their destination.

## 2025-02-01 - Expandable List Details Buttons Need ARIA Labels
**Learning:** Buttons that act as accordion headers or expandable row toggles within lists (like Fight History or Engagement Logs) are often overlooked for accessibility because the visual chevron and surrounding context provide enough cues for sighted users. However, without `aria-expanded` and a descriptive `aria-label`, screen readers may just announce "button" and won't know if the section is currently open or closed.
**Action:** Always include `aria-expanded={isExpanded}` and a highly descriptive `aria-label` (e.g., `"Expand bout details between [Fighter A] and [Fighter B]"`) on interactive toggle buttons that reveal hidden container content.

## 2025-02-01 - Global Layout Controls Missing Accessibility Attributes
**Learning:** Application layout controls in main navigation areas (like sidebar toggles, audio mute buttons, and save status icons) often lack ARIA attributes and titles because they are wrapped in tooltips or their visual context is assumed clear. Tooltips alone don't provide immediate semantic value to screen readers. For layout toggles like sidebars, missing `aria-expanded` makes it impossible for screen reader users to know the current state without triggering the action.
**Action:** Always add native `title` and `aria-label` to custom icon-only `<Button>`s used for global app controls, even if wrapped in a `<Tooltip>`. For toggle states, explicitly use `aria-pressed` (for buttons like mute) or `aria-expanded` (for collapsible areas like sidebars) dynamically bound to their state.
