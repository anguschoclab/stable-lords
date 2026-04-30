# Stable Lords — Page System Spec v1.0
## Extending the Control Center shell to every route

> Companion to [DESIGN_BIBLE_UI_v1.0.md](DESIGN_BIBLE_UI_v1.0.md) and [DESIGN_CONTROL_CENTER_v1.0.md](DESIGN_CONTROL_CENTER_v1.0.md).
> Purpose: make every screen feel like another wall of the same tablinum. One shell, many rooms.

---

## 1. The App Shell (shared by every route)

Every page except `/start` and `/welcome` (FTUE) renders inside the **App Shell**:

```
┌──────────────────────────────────────────────────────────┐
│  TOP BAR  (sticky, h-14, shared across all pages)        │
├──────────┬──────────────────────────────┬────────────────┤
│          │                              │                │
│   LEFT   │        PAGE CANVAS           │   EVENT LOG    │
│   NAV    │   (page-specific content)    │   (right rail) │
│   w-60   │                              │   w-80         │
│          │                              │   collapsible  │
└──────────┴──────────────────────────────┴────────────────┘
```

**Top Bar** and **Left Nav** are identical on every route — see Control Center spec §3–4. Only the primary CTA in the top-bar swaps by context:

| Route | Primary CTA |
|---|---|
| `/` Control Center | `EXECUTE WEEK N ›` |
| `/run-round` | `BEGIN CYCLE ›` |
| `/arena` | `VIEW CARD ›` |
| `/tournaments` | `ADVANCE BRACKET ›` |
| `/training`, `/training-planner` | `COMMIT REGIMEN ›` |
| `/recruit`, `/scouting` | `SIGN CONTRACT ›` (enabled on selection) |
| `/offseason` | `CLOSE SEASON ›` |
| Detail pages (warrior, stable) | Contextual secondary actions only |
| Lore (gazette, hall-of-fame, graveyard, history) | No primary CTA — reading rooms |

**Event Log** is present everywhere. Default-collapsed on lore/detail pages; default-open on Control Center, Run Round, Arena, Tournaments.

---

## 2. Page Canvas — the universal template

Every page canvas follows the same four-band structure:

```
┌───────────────────────────────────────────────────────┐
│  BAND 1 — PageHeader                                  │
│   codex eyebrow · Cinzel title · parchment subtitle   │
│   right: page-local HUD stats + secondary tabs        │
├───────────────────────────────────────────────────────┤
│  BAND 2 — Hero / Focus Strip  (optional)              │
│   pinned storyline, tournament banner, crisis alert   │
├───────────────────────────────────────────────────────┤
│  BAND 3 — Content Grid                                │
│   page-specific cards; any of the layout archetypes   │
├───────────────────────────────────────────────────────┤
│  BAND 4 — Footer meta                                 │
│   provenance line · related links · empty-state lore  │
└───────────────────────────────────────────────────────┘
```

Only Band 3 varies between pages. Bands 1/4 are mandatory and share one `<PageFrame>` component.

---

## 3. PageHeader contract

Identical across every non-FTUE route.

```jsx
<PageHeader
  icon={<Swords />}                       // imperial-ring bronze square
  eyebrow="IMPERIAL · ARENA"              // codex-label, tracking-[0.4em]
  title="The Colosseum"                   // Cinzel 700, carved shadow
  subtitle="Bouts, crowds, and imperial favor." // italic muted
  hud={<GoldFameHud />}                   // right-aligned stat pills
  tabs={["OVERVIEW","BOUTS","CROWD","HISTORY"]} // optional
  actions={<Button>VIEW CARD ›</Button>}
/>
```

Rules (from bible §7):
- Eyebrow is always ALL_CAPS codex notation.
- Icon always wrapped in `imperial-ring`.
- Gradient separator (`from-primary/40 to-transparent`) always below the header.
- Tabs use the same pattern as Control Center §7 — ALL CAPS Cinzel, 2px primary underline.

---

## 4. Layout Archetypes (Band 3)

Every page picks exactly one archetype. Devs should not invent new grids.

### A. **Command Grid** — Control Center, Arena, Tournaments, Offseason
Two-or-three column card grid (`grid gap-4 md:grid-cols-2 xl:grid-cols-3`). Cards are `variant="glass"` with codex eyebrow + Cinzel title.

Use when: the page is a dashboard of independent panels.

### B. **Ledger** — Stable Hall, Trainers, Stable Ledger, Recruit, Scouting, World Overview
Left sidebar filters (`lg:col-span-3`) + main data table/list (`lg:col-span-9`). Headers: `text-[9px] font-black uppercase tracking-widest`. Player rows: `bg-primary/[0.03] border-l-2 border-primary`. Numbers: `font-mono font-black`.

Use when: dense tabular data with filters.

### C. **Dossier** — Warrior Detail, Stable Detail, Trainer Detail
Hero banner (name + style seal + portrait area) → tab strip (`BIOMETRICS / MISSION_CONTROL / CHRONICLE / EQUIPMENT`) → tab-specific two-column content (`lg:grid-cols-[2fr_1fr]`).

Use when: one subject, many facets.

### D. **Planner** — Training Planner, Booking Office, Equipment
Left roster column (selectable list, `lg:col-span-4`) → right editor canvas (`lg:col-span-8`). Footer action bar sticks bottom with `COMMIT / RESET / PREVIEW` buttons.

Use when: the user is assigning/configuring something per-entity.

### E. **Chronicle** — Gazette, History, Hall of Fame, Graveyard
Centered column, `max-w-4xl`, parchment-variant cards stacked vertically. Masthead at top with ornate rules above/below. Generous typography, no HUD stats.

Use when: the page is for reading, not clicking.

### F. **Focus** — Run Round, Orphanage FTUE step
Single hero card centered, minimal chrome, one massive CTA. Event log collapsed by default.

Use when: one action is the entire point of the screen.

---

## 5. Route → Archetype map

| Route | Archetype | Band 2 Hero? | Event Log default |
|---|---|---|---|
| `/` Control Center | A Command Grid | Yes (storyline) | Open |
| `/arena` Arena Hub | A Command Grid | Yes (crowd mood) | Open |
| `/run-round` | F Focus | Pinned cycle banner | Collapsed |
| `/tournaments` | A Command Grid | Yes (bracket state) | Open |
| `/training` | B Ledger | — | Collapsed |
| `/training-planner` | D Planner | — | Collapsed |
| `/booking-office` | D Planner | Yes (card preview) | Collapsed |
| `/stable` Stable Hall | B Ledger | Yes (stable summary) | Collapsed |
| `/stable/:id` Stable Detail | C Dossier | — | Collapsed |
| `/warrior/:id` | C Dossier | — | Collapsed |
| `/trainers` | B Ledger | — | Collapsed |
| `/recruit` | B Ledger | — | Collapsed |
| `/scouting` | B Ledger | — | Collapsed |
| `/stable-equipment` | D Planner | — | Collapsed |
| `/stable-ledger` Treasury | A Command Grid | Yes (runway alert) | Open |
| `/world` World Overview | B Ledger | Yes (season standings) | Open |
| `/gazette` | E Chronicle | Masthead | Hidden |
| `/hall-of-fame` | E Chronicle | Masthead | Hidden |
| `/graveyard` | E Chronicle | Memorial header | Hidden |
| `/offseason` | A Command Grid | Yes (season recap) | Open |
| `/physicals` | D Planner | — | Collapsed |
| `/admin` | B Ledger | — | Collapsed |
| `/help` | E Chronicle | — | Hidden |
| `/start`, `/welcome` | bare (no shell) | — | — |

"Hidden" = the right rail is not rendered at all on that route (reclaims the width for reading).

---

## 6. Per-page specifications

Each section lists only what is unique beyond the archetype. Common rules from §1–4 apply.

### 6.1 `/arena` Arena Hub — Archetype A

Hero Strip: **Crowd Mood** card full-width — large omen icon (auspicious/neutral/restless), `arena-pop` border, modifiers list as bronze stat pills (`TICKET_YIELD +8% · FAME_GAIN +4%`).

Grid cards:
1. **Imperial Standings** — top 5 stables table.
2. **Arena Analytics** — carved wall of stats: attendance, kills-per-week, ticket revenue, Fame circulating.
3. **This Week's Card** — re-uses Control Center's bout card component.
4. **Rising Contenders** — top 3 warriors by form delta.
5. **Recent Kills** — blood-variant list with weapon + date.
6. **Sponsor Interest** — patrons watching your stable.

### 6.2 `/run-round` — Archetype F

Band 1: minimal header — `EXECUTE WEEK N` eyebrow, *"The sand is raked."* subtitle.
Band 2 (pinned banner): **Stable Readiness** — 4 stat pills (healthy / injured / in-training / scheduled).
Band 3: single focus card "Week 12 Manifest" — list of bouts with prominent ` BEGIN CYCLE ›` CTA at the bottom.
After results: cards transform in place — win rows bronze tint, kill rows blood-variant, draws parchment-variant.

### 6.3 `/tournaments` — Archetype A

Hero Strip: **Active Bracket** — current tournament name, round indicator `ROUND 3 OF 5`, progress bar.
Cards: Bracket Viewer (spans 2 cols), Participants list, Prize Purse (`variant="gold"`), Seedings, Past Champions (parchment-variant).

### 6.4 `/training` + `/training-planner`

**Training (B Ledger)**: header HUD shows `ACTIVE · MEDICAL · RESERVE` counts. Filters sidebar: style focus, program type, coach. Main table columns: Warrior · Program · Coach · Week · ETA · Intensity bar.

**Training Planner (D Planner)**: left column = roster selectable list with a `ASSIGNED / UNASSIGNED` segmented filter. Right canvas = regimen editor — program picker, focus weights (carved-groove sliders), coach dropdown, preview stat deltas. Bottom sticky action bar: `RESET · PREVIEW · COMMIT REGIMEN ›`.

### 6.5 `/stable` Stable Hall — Archetype B

Hero Strip: stable name (hero Cinzel), crest ornament, Fame/Titles HUD bronze-bordered. Filter sidebar: class, style, rank, availability. Main: warrior portrait grid at `md:grid-cols-2 xl:grid-cols-3` — each is a parchment-variant card with name, style seal, small stat-row.

### 6.6 `/warrior/:id` — Archetype C

Hero banner: name in Cinzel 900 + style badge + alive/dead indicator + Fame number in arena-fame. Tabs: `BIOMETRICS · MISSION_CONTROL · CHRONICLE · EQUIPMENT · BACKSTORY`.
- BIOMETRICS: engraved attribute table + traits as wax-seal badges.
- MISSION_CONTROL: training program, upcoming bouts, assigned coach, status.
- CHRONICLE: career timeline (reverse-chronological event feed, styled like the right-rail Event Log).
- EQUIPMENT: loadout grid (weapon, armor, accessories), each as an armory entry.
- BACKSTORY: parchment-variant narrative block.

### 6.7 `/stable/:id` Stable Detail — Archetype C

Hero banner: stable crest, owner name, era founded. Tabs: `REGISTER · ROSTER · RIVALRIES · HISTORY`. Shows a rival stable from the player's POV.

### 6.8 `/recruit` + `/scouting` — Archetype B

Recruit: tabs `MARKET · FORGE A WARRIOR` in PageHeader. Market = ledger of contracts. Scouting = ledger of discovered world warriors.
Player cards feature: cost in gold, tier seal badge, style, scouted confidence meter (for scouting only).

### 6.9 `/booking-office` — Archetype D

Left: unbooked warriors. Right: week matchmaker — drag warriors into bout slots, see H2H, odds, stakes. Sticky footer: `AUTOFILL · CLEAR · COMMIT CARD ›`.

### 6.10 `/stable-equipment` — Archetype D

Left: warriors list. Right: loadout builder — slotted grid with drag-drop; armory inventory accordion below.

### 6.11 `/stable-ledger` Treasury — Archetype A

Hero Strip: current Gold, delta, runway — if runway < 4wk, `variant="blood"` escalation.
Cards: Income streams, Expense streams, Sponsorships, Outstanding debts, Upcoming obligations, 12-week history chart (carved-groove bars).

### 6.12 `/world` World Overview — Archetype B

Tabs: `STABLES · WARRIORS · INTELLIGENCE`.
Top strip: four carved stat blocks — Total Stables, Total Warriors, Kills This Season, Top Stable.
Main: rankings table. Player rows crimson left-border.

### 6.13 `/gazette` — Archetype E (the distinctive one)

Full-width masthead: `THE ARENA GAZETTE` centered Cinzel 900 with decorative rules above/below; issue line `Week 12 // Autumn // 412 AE`. Content column: stacked parchment-variant article cards — headline Cinzel 700, byline muted italic, body Inter with generous leading. Sidebar: league leaders, latest results — stone-tablet tables.

### 6.14 `/hall-of-fame` — Archetype E

Masthead: `HALL OF FAME` with Crown icon + gold glow. Then year-grouped sections; each inductee card gold-variant with portrait area, career record, induction quote.

### 6.15 `/graveyard` — Archetype E

Masthead: Skull + blood shadow. Tabs `MY FALLEN · WORLD MEMORIAL`. Cards darker, plaque-shaped, minimal color — cause of death in small muted italic.

### 6.16 `/offseason` — Archetype A

Hero Strip: season recap headline with champion card. Cards: Promotions/Demotions, Retirements, Deaths, Rookie Draft, Financial Close-out, Storylines Emerging.

### 6.17 `/physicals` — Archetype D

Left: warrior picker. Right: simulated fight lab — matchup preview, run-N-times, histogram of outcomes. Mark with `codex-label` "SIMULATION · NO RECORDS KEPT" eyebrow to distinguish from real bouts.

### 6.18 `/admin` — Archetype B

Dev/debug only. Ledger of game-state toggles. `codex-label` eyebrow `IMPERIAL CENSOR · ADMIN`. Guard with environment check.

### 6.19 `/help` — Archetype E

Masthead `CODEX · HELP`. Accordion of topics, each in parchment-variant. No HUD, no event log.

### 6.20 `/start` Title Screen and `/welcome` Orphanage FTUE

Do NOT use the App Shell. See bible §8 for their bespoke treatments. They are the only two routes that break the shell rule.

---

## 7. Shared components to build (or refactor)

Names align to component layer already in `src/components/`:

| Component | Purpose | Used by |
|---|---|---|
| `<AppShell>` | Top bar + left nav + event log rail + outlet | every non-FTUE route |
| `<PageFrame>` | Bands 1/2/4 wrapper, enforces spacing | every non-FTUE route |
| `<PageHeader>` | icon + eyebrow + title + subtitle + hud + tabs + actions | same |
| `<GoldFameHud>` | bronze-bordered stat pill cluster | top bar + selected pages |
| `<ControlCard>` | glass card w/ eyebrow + title + action icon | archetypes A, D |
| `<ParchmentCard>` | parchment-variant card shell | archetype E |
| `<LedgerTable>` | header+row conventions, player-row highlight | archetype B |
| `<GrooveBar>` | stat bar per bible §7 | everywhere |
| `<StyleSeal>` | wax-seal badge for fighting style / tier | many |
| `<ImperialRing>` | bronze-framed icon container | every header |
| `<CodexLabel>` | `<span>` wrapper with class | everywhere |
| `<SectionDivider>` | codex-label + gradient line | every grid band |
| `<EventLogRail>` | right-rail event feed with filter tabs | shell |
| `<FocusCard>` | single-hero-card wrapper | archetype F |
| `<BoutRow>` | canonical bout representation | CC, Arena, Run Round, Warrior Detail |

Pages should compose these — no page should hand-roll its own header, table header, or stat bar.

---

## 8. Spacing, motion, responsive — inherited

All pages inherit the bible's rules for:
- **Spacing** (`max-w-7xl`, `pb-20`, `space-y-12`) — bible §5.
- **Radius** (hard 0, exceptions only for tooltip/badge/progress) — §5.
- **Motion** (fade-in + subtle slide, 60ms stagger, no bounce) — §9.
- **Responsive** breakpoints — §12. Every archetype collapses predictably:
  - Ledger: sidebar filters → top accordion on mobile.
  - Dossier: tabs → horizontally scrolling strip.
  - Planner: left-roster → top drawer on mobile; sticky footer stays.
  - Command Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.
  - Chronicle: already single-column, just tightens padding.

---

## 9. Consistency checklist (PR gate for any new/touched page)

- [ ] Renders inside `<AppShell>` (unless Title/FTUE).
- [ ] Uses `<PageHeader>` with an `imperial-ring` icon, a codex eyebrow, and a Cinzel title.
- [ ] Picks exactly one archetype from §4 and follows it.
- [ ] All section starts use `<SectionDivider>` (codex-label + gradient line).
- [ ] No `rounded-xl`, `rounded-lg`, `rounded-md` on structural elements.
- [ ] No pure `#FFFFFF` text; body uses `text-foreground` (warm papyrus).
- [ ] All tables use `<LedgerTable>`; player rows receive crimson left-border.
- [ ] All stat bars use `<GrooveBar>`.
- [ ] Primary CTA (if any) is a single blood-crimson button; secondary actions are neutral.
- [ ] Event log rail renders per §5 default; page does not duplicate its functionality.
- [ ] Empty states use evocative copy ("The Presses Are Silent.", "The sand awaits."). Never "No data available."
- [ ] `prefers-reduced-motion` respected.
- [ ] AA contrast on all muted text; AAA on body text.
- [ ] Route → Archetype mapping (§5) matches what shipped.

---

## 10. Migration plan (from current state)

Suggested order — each step is PR-sized and independently shippable:

1. **Build the shell**: `AppShell`, `TopBar`, `LeftNav`, `EventLogRail`. Wire to `/` only. Feature-flag.
2. **Extract `PageFrame` + `PageHeader`**: unify what's scattered across existing pages. Swap existing pages to use it, one at a time. No visual regressions expected.
3. **Refactor tables → `LedgerTable`**: Stable Hall, Trainers, World Overview, Recruit, Scouting, Training. One PR per page.
4. **Adopt archetype A (Command Grid)**: `/`, `/arena`, `/tournaments`, `/stable-ledger`, `/offseason`.
5. **Adopt archetype C (Dossier)**: `/warrior/:id`, `/stable/:id`.
6. **Adopt archetype D (Planner)**: `/training-planner`, `/booking-office`, `/stable-equipment`, `/physicals`.
7. **Adopt archetype E (Chronicle)**: `/gazette`, `/hall-of-fame`, `/graveyard`, `/help`.
8. **Adopt archetype F (Focus)**: `/run-round`.
9. **Final pass**: remove bespoke headers, delete dead CSS, enforce checklist (§9) in CI lint.

The FTUE (`/welcome`) and Title (`/start`) stay bespoke; they are intentionally pre-shell rooms.

---

*Stable Lords — Page System Spec v1.0. Derived from Codex Sanguis Design Bible v1.0 and Control Center Spec v1.0. One shell. Six archetypes. Every room of the tablinum.*
