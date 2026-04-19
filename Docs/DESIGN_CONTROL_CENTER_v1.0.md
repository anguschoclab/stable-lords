# Stable Lords — Control Center Design Spec v1.0
## "The Tablinum" — Dashboard Redesign

> *"The patron sits in the tablinum. Before him: the ledger of the week, the roar of tomorrow's crowd, the whispers of the Senate. Everything that matters, carved into one wall of stone."*

Design system: **Codex Sanguis** (see [DESIGN_BIBLE_UI_v1.0.md](DESIGN_BIBLE_UI_v1.0.md))
Route: `/` (replaces current Dashboard)
Status: Ready for implementation

---

## 1. Intent

A single-screen command surface for the player's weekly cycle. The player should be able to answer, without leaving the page:

1. **Where am I in the season?** (week, season, year, progress)
2. **What is the one thing pressing on me right now?** (hero narrative card)
3. **Can I afford to keep going?** (treasury + runway)
4. **Who is fighting and when?** (this week's card)
5. **Where do I stand in the world?** (banzuke-equivalent: top stables)
6. **What is my stable actually doing?** (training regimens, leading warriors)
7. **What just happened?** (event log, always visible)

Analogue to the Basho Manager Control Center, but reframed around the **weekly cycle**, **fame/gold economy**, and **imperial ranking** of Stable Lords.

---

## 2. Page Skeleton

```
┌───────────────────────────────────────────────────────────────────────────┐
│  TOP BAR   DATE · WEEK · SEASON   |   GOLD   |   FAME   |   STABLE NAME   │  ← sticky, h-14
├──────────┬────────────────────────────────────────────┬───────────────────┤
│          │                                            │                   │
│  LEFT    │               MAIN COLUMN                  │   EVENT LOG       │
│  NAV     │                                            │   (right rail)    │
│  (w-60)  │   Hero Storyline Card                      │   (w-80, sticky)  │
│          │   ┌──────────────┬──────────────┐          │                   │
│          │   │ TREASURY     │ SEASON       │          │                   │
│          │   │ PANEL        │ PROGRESS     │          │                   │
│          │   ├──────────────┴──────────────┤          │                   │
│          │   │ THIS WEEK'S CARD (bouts)    │          │                   │
│          │   │  ┌──────────────┬─────────┐ │          │                   │
│          │   │  │ Today's Bouts│ Imperial│ │          │                   │
│          │   │  │              │ Banzuke │ │          │                   │
│          │   │  └──────────────┴─────────┘ │          │                   │
│          │   ├──────────────┬──────────────┤          │                   │
│          │   │ TRAINING     │ LEADING      │          │                   │
│          │   │ REGIMENS     │ WARRIORS     │          │                   │
│          │   └──────────────┴──────────────┘          │                   │
└──────────┴────────────────────────────────────────────┴───────────────────┘
```

Grid at ≥1280px: `grid-cols-[240px_1fr_320px]`. At <1024px: stack (nav → drawer, event log → bottom sheet).

---

## 3. Top Bar

**Height**: `h-14`, `bg-card/80 backdrop-blur`, bottom border `border-border`.

Left → right:
- **Hamburger** (mobile only) → opens left nav drawer.
- **Pill: DATE** — `codex-label` "DATE" above value `Year 412 AE · Wk 12 · Autumn`.
- **Pill: CYCLE STATUS** — bronze-bordered, amber dot + `Autumn Season · Week 12`. Click → scrolls to Season Progress card.
- **Pill: GOLD** — `arena-gold` coin icon + tabular number. Hover tooltip: weekly delta.
- **Pill: FAME** — `arena-fame` star icon + number. Hover: delta.
- **Pill: STABLE** — small shield icon + stable name.
- Right cluster: search, notifications (unread badge in `arena-blood`), theme (if applicable), settings.
- **Primary CTA — `EXECUTE WEEK 12 ›`** — blood-crimson button, `font-black tracking-widest`, always visible. This is the single most prominent element on the screen.

Codex rule: all label slugs above values use `codex-label` (9px, `tracking-[0.4em]`, muted).

---

## 4. Left Navigation

`w-60`, `bg-card`, full-height. Groups use `codex-label` section headers with gradient underline.

```
MY STABLE
  ▣ Control Center     (active — primary/[0.08] bg, border-l-2 border-primary)
  ⚔ Roster        [18]
  🏋 Training
  🏛 Stable Hall
  🪙 Treasury

ARENA
  🗡 Run Round      [W12]
  🏆 Tournaments
  📜 History

IMPERIAL WORLD
  🌐 World Overview
  📰 The Gazette
  ⚔ Rivalries
  💀 Graveyard
  👑 Hall of Fame
```

Counts/badges: small bronze-outlined pills. Hover row: `bg-white/[0.03]`. Active row: subtle crimson wash + left bar.

---

## 5. Main Column — Cards

All cards use `variant="glass"` unless noted. All corners hard (`rounded-none`). All card headers follow:

```
CODEX_LABEL · SUB_LABEL                                       [icon action]
Large Cinzel Title
Optional muted subtitle sentence.
```

### 5.1 Hero Storyline Card (top, full width)

**Purpose**: The one narrative pressing the player this week. Generated from current game state — priority order:
1. Champion contention (warrior at top of rankings)
2. Imminent death/retirement of legendary warrior
3. Rivalry climax (grudge match scheduled)
4. Financial crisis (runway < 4 weeks)
5. Tournament final this week
6. Default: highest-fame warrior's form arc

**Layout**:
- Left: 96×96 imperial-ring badge with thematic glyph (laurel wreath for champion, skull for death, swords for rivalry, coins for bankruptcy).
- Middle: `codex-label` eyebrow (e.g. `IMPERIAL LAURELS · CONTENDER`), Cinzel 700 title, 2-line parchment prose subtitle.
- Right: primary action button (e.g. `REVIEW DOSSIER`, `VIEW BOUT`, `SEEK SPONSOR`) + small meta row ("Senate · 4 / 5 in favor" equivalent → e.g. "Patrons · 3 / 5 backing").

**Variant**: use `variant="gold"` when the storyline is prestige (champion, HoF), `variant="blood"` when danger (bankruptcy, lethal rival bout), `variant="parchment"` when archival (retirement, legend).

### 5.2 Treasury Panel (left, col-span-1)

Eyebrow: `PATRON · COFFERS`  Title: `Quarterly Outlook`

Two stat columns:
- **GOLD**: `3,240g` in Cinzel 40px `arena-gold`, delta `+420g this week` in `text-emerald-400/80`.
- **RUNWAY**: `11 wk` — `At current burn`. If <4wk, number renders `arena-blood` + danger glow.

Below: two stat-bars with labels + values on right:
- `WAGES · COVERED` — arena-gold fill, `64%`
- `SPONSORSHIPS ACTIVE` — arena-pop fill, `3 OF 5`

Stat bars use the "sand in carved groove" spec (1.5–3px, `bg-secondary/30 border-border/20`).

### 5.3 Season Progress (right, col-span-1)

Eyebrow: `AUTUMN SEASON · IN PROGRESS`  Title: `Week 12 of 16`

Two stat columns:
- **TOP RECORD**: `9 – 3` · subtitle `Marcus Varro · leading stable`
- **STANDING**: `T-2nd` · subtitle `Two wins behind House Corvinus`

Bottom: `SEASON PROGRESS` stat-bar — gradient from primary to accent, `75%` tick on the right.

### 5.4 This Week's Card (left, col-span-1) — the Basho "Today's Bouts" equivalent

Eyebrow: `WEEK 12 · CARD`  Title: `Scheduled Bouts`  Action icon: shuffle/reroll (tournament only).

Bout rows (repeat up to 4, then "View all N bouts →"):
- Player bouts get a gold `★` prefix and `bg-primary/[0.03] border-l-2 border-primary`.
- Row layout: `[Warrior name + rank badge]   H2H 3-1   [Opponent name + rank]   [style-badge: GRAPPLE/BLADE/etc.]`
- Rank badges: small parchment tiles with `font-mono font-black` (e.g. `TOP 3`, `#18`, `CHMP`).
- Style badge right-aligned uses weapon-family color token. If outcome pending: muted "PENDING" pill; if lethal match stakes: blood pill `DEATH MATCH`.

### 5.5 Imperial Banzuke (right, col-span-1) — Top Ranks

Eyebrow: `IMPERIAL REGISTRY · TOP RANKS`  Title: `Banzuke`  Action: jump to World Overview.

Dense two-column list of top 10 stables (5 per column, mirrored around a divider like the PDF). Each row: stable name + `W-L` in font-mono. Player's stable row: crimson left-border, bold. Empty slot ("vacant throne"): em-dash placeholder (used e.g. when a Grand Champion seat is unfilled — preserves the vacant-yokozuna flavor).

### 5.6 Active Regimens (left, col-span-1)

Eyebrow: `LUDUS · TRAINING`  Title: `Active Regimens`

Up to 4 rows:
```
Warrior Name                          ▓▓▓▓▓▓░░░░  63%
PROGRAM · FOCUS_NOTE
```
Fill color encodes program type:
- Strength/Weight → `arena-gold`
- Skill/Technique → `arena-pop` (teal)
- Conditioning → emerald
- Recovery/Medical → `arena-blood`
Tooltip on hover shows ETA and coach assigned. Click → Training Planner.

### 5.7 Leading Warriors (right, col-span-1)

Eyebrow: `LUDUS · TOP RANKS`  Title: `Leading Warriors`

Dense ledger table:
| WARRIOR | RANK | W–L | FORM |
|---------|------|-----|------|
| Marcus Varro | #3 | 9–3 | +4 (emerald) |
| Severa | #14 | 7–4 | +2 |
| Gaius "The Bull" | #22 | 4–5 | −1 (blood) |

Header: `text-[9px] font-black uppercase tracking-widest`. Numbers: `font-mono font-black`. Form column color-coded, signed integer. Row click → warrior detail.

---

## 6. Right Rail — Event Log

`w-80`, sticky, own scroll container. Header:
```
Event Log                         [ALL] [ARENA] [NEWS]
```
Tab pills: arena-blood active, others muted outline.

Entry format (12–14 per screen):
```
[icon tint]  YR12 · WK12 · DAY 3 · 09:12
             Bold title line (Cinzel 500, 15px)
             Two-line muted papyrus body.
```

Icon tints map to event kind:
- Trophy (gold) — wins, titles, fame milestones
- Alert-triangle (blood) — injury, death, financial danger
- Link (gold) — sponsorship secured
- Scroll (papyrus) — press / Gazette item
- Activity (teal) — training outcome
- Skull (blood) — death

Dividers between entries: `border-border/30`. Rows hover to `bg-white/[0.03]`. Each row clickable → relevant detail page. "Day N begins" markers render with a slightly thicker top border to group bursts.

Empty state: *"The Presses Are Silent."*

---

## 7. Secondary Tabs (under hero, above panels)

Just like the PDF's OVERVIEW / BOUTS / STABLE / FINANCIALS / STORYLINES:

```
OVERVIEW · BOUTS · STABLE · FINANCES · STORYLINES
```
- Text in Cinzel 700, ALL CAPS, `tracking-[0.05em]`.
- Active tab: 2px primary underline + foreground color.
- Inactive: muted-foreground, hover → foreground.

Each tab reconfigures the main column's six-card grid:
- **OVERVIEW** — as specified above (default).
- **BOUTS** — expands bout card full-width, collapses treasury/season into slim strip.
- **STABLE** — foregrounds roster and training, hides banzuke.
- **FINANCES** — expands Treasury card to full grid, adds sponsorships/payroll tables.
- **STORYLINES** — full-width stack of hero cards (rivalries, champion arcs, deaths).

---

## 8. Tokens & Class Hooks (hand-off)

Existing (from bible):
- `bg-background`, `bg-card`, `bg-primary`, `text-foreground`, `text-accent`, `text-muted-foreground`
- `arena-gold`, `arena-blood`, `arena-fame`, `arena-pop`, `arena-steel`, `arena-bone`
- `imperial-ring`, `codex-label`, `glow-blood`, `glow-gold`

New (introduce):
- `.control-grid` — `grid gap-4 lg:grid-cols-[240px_1fr_320px]`
- `.control-panel` — card shell (`variant="glass"` wrapper)
- `.control-statnum` — `font-cinzel font-black text-[40px] leading-none tracking-[0.02em]`
- `.control-delta--up` / `.control-delta--down` — emerald / blood small text
- `.groove-bar` — stat bar with carved-groove spec
- `.hero-story` — hero card row wrapper (supports `data-variant="gold|blood|parchment"`)

---

## 9. Responsive

| Breakpoint | Change |
|---|---|
| ≥1280px | Full three-column layout as drawn. |
| 1024–1279px | Event Log collapses into a right-edge toggle drawer. Main grid stays 2×3. |
| 768–1023px | Single column. Nav → top drawer. Treasury & Season become a 2-up strip. Event log → bottom sheet accessible via bell icon. |
| <768px | Everything stacks. Hero card keeps priority. Cards become full-width. Top bar: date pill + CTA button only; other pills collapse into a popover. |

Secondary tabs scroll horizontally with fade-edge on mobile.

---

## 10. Motion

Per bible §9 — no bouncy, no rotations.
- Page mount: `fade-in + slide-in-from-bottom-2`, stagger cards by 60ms.
- Hero card on storyline change: `fade-in + zoom-in-[0.98]`, 300ms.
- Event log new entry: slide-in-from-top-1, 240ms.
- `EXECUTE WEEK` button idle: `livePulse` on the border glow (2s). Press: flash-brighten 120ms then route.

---

## 11. Copy Examples (dev placeholders)

Hero (champion contender):
> eyebrow: `IMPERIAL LAURELS · CONTENDER`
> title: *Marcus Varro approaches the final laurel.*
> body: The patrons have seen the blood he has spilled. One more tournament victory and the Senate will not be able to refuse his crown.
> meta: `Patrons · 4 / 5 backing`  action: `REVIEW DOSSIER`

Event log samples:
- `YR412 · WK12 · DAY 3 · 09:12` — **Week Twelve Opens** · Card posted. Varro drawn against Octavian (#7). Crowd estimate 11,100.
- `DAY 3 · 08:40` — **Wages Unmet** · Ludus maintenance outstanding. Coffers will not cover without a new patron.
- `DAY 2 · 16:45` — **Varro felled Tiberius** · Yoke-break. Fourth straight victory. Record 9–3.
- `DAY 2 · 11:30` — **Gazette · Senate Watch** · Censor Lucretius: *"One more triumph and the question becomes unavoidable."*

Empty states:
- Event log: *"The Presses Are Silent."*
- No regimens: *"The ludus sleeps. No regimens are inscribed."*
- No scheduled bouts: *"The sand awaits. No bouts declared this week."*

---

## 12. Acceptance Checklist (for the PR)

- [ ] `/` renders the three-column layout at ≥1280px without horizontal scroll.
- [ ] All six main cards present with correct eyebrow / title pattern.
- [ ] Hero storyline card selects based on priority rules in §5.1; falls back gracefully.
- [ ] `EXECUTE WEEK N` button advances the cycle (wires to existing simulate pipeline).
- [ ] Event log filters (ALL / ARENA / NEWS) functional and persist in session state.
- [ ] Player rows in Banzuke and Leading Warriors get `border-l-2 border-primary` treatment.
- [ ] Runway < 4wk renders blood-tint and escalates to the Hero card.
- [ ] No `rounded-xl` anywhere on the route; focus rings warm crimson.
- [ ] AA contrast verified on all muted/papyrus text.
- [ ] `prefers-reduced-motion` disables stagger and pulse.

---

*Stable Lords — Control Center Spec v1.0. Derived from Codex Sanguis Design Bible v1.0. Parallel reference: Basho Manager Pro Edition Control Center (sumo-manager-pro).*
