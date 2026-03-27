
## 2025-01-31 - Tooltip buttons need ARIA labels
**Learning:** Icon-only buttons wrapped in `TooltipTrigger asChild` still need an explicit `aria-label` because `TooltipContent` isn't always reliably announced as the button's accessible name by screen readers.
**Action:** Always add `aria-label` to icon-only `<Button>`s even when inside a `<Tooltip>`.
## 2024-03-27 - External Link Icons in Modal Headers
**Learning:** Icon-only buttons representing "external links" (like opening a full dossier from a preview sheet) are frequently missing `aria-label`s because their visual context (an icon in a corner) is obvious to sighted users but completely invisible to screen readers, especially when isolated from the main sheet content.
**Action:** When implementing side-panels, sheets, or modals that contain "view full page" icon buttons in their headers, ensure they always have explicit `title` and `aria-label` attributes to clarify their destination.
