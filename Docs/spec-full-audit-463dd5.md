# DESIGN_PAGE_SYSTEM_v1.0 — Full Code-Verified Spec Audit (v4 — Spec Read)

Every finding is traced to both the spec doc (`Docs/DESIGN_PAGE_SYSTEM_v1.0.md`) and actual source file+line. No assumptions.

> **New in v4**: Spec doc finally read in full. Several previously-missed gaps identified. `eyebrow` prop status corrected. RunRound, PhysicalsSimulator, AdminTools archetypes corrected.

---

## Legend
✅ Compliant | ❌ Gap | ⚠️ Partial/minor

---

## Band 1 — PageHeader: every page, code-verified

| Page | File:Line | Has PageHeader | Verdict |
|---|---|---|---|
| `ControlCenter` | ControlCenter.tsx:429 | ❌ **MISSING** | `return` starts with `<HeroPanel />` then `<KpiBar />` — zero `PageHeader` import or usage |
| `ArenaHub` | ArenaHub.tsx:198 | ✅ | `icon={Swords}`, `subtitle="VIRTUAL_COLOSSEUM // SPECTACLE_ENGINE // WORLD_STATE"` |
| `RunRound` | RunRound.tsx:~95 | ✅ | `icon={Swords}`, dynamic subtitle, CTA in actions |
| `Tournaments` | Tournaments.tsx:124+ | ✅ | `icon={Trophy}`, dynamic subtitle |
| `Training` | Training.tsx:~75 | ✅ | `icon={Dumbbell}`, subtitle with `//` codex notation |
| `TrainingPlanner` | TrainingPlanner.tsx:~300 | ✅ | `icon={BarChart3}`, subtitle with `·` codex notation |
| `StableHall` | StableHall.tsx:~1 | ✅ | `icon={Shield}`, subtitle with player name |
| `Trainers` | Trainers.tsx:~125 | ✅ | `icon={Users}`, subtitle with `//` codex notation |
| `StableEquipment` | StableEquipment.tsx:44 | ⚠️ | `icon={Shield}`, subtitle is **human-readable prose**, not codex notation |
| `StableLedger` | StableLedger.tsx:20 | ✅ | `icon={BookOpen}`, subtitle with `·` codex notation |
| `BookingOffice` | BookingOffice.tsx:~277 | ✅ | `icon={Briefcase}`, subtitle `OPS · CONTRACTS · WEEK N` |
| `PromoterDirectory` | PromoterDirectory.tsx:~243 | ✅ | `icon={Building2}`, subtitle `OPS · PROMOTERS · WEEK N` |
| `Offseason` | Offseason.tsx:~1 | ✅ | `icon={CalendarDays}`, subtitle `YEAR-END · RETROSPECTIVE...` |
| `WorldOverview` | WorldOverview.tsx:179 | ✅ | `icon={Globe}`, subtitle `WEEK N // SEASON // NATIONAL COMMISSION ARCHIVE` |
| `Scouting` | Scouting.tsx:~78 | ✅ | `icon={Search}`, subtitle with `//` codex notation |
| `Gazette` | Gazette.tsx:~1 | ✅ | **Intentionally** uses bespoke `GazetteMasthead` (Archetype E Chronicle masthead variant — correct) |
| `HallOfFame` | HallOfFame.tsx:67 | ⚠️ | Has `PageHeader` (line 67) **AND** a duplicate `<h1>Hall of Fame</h1>` inside ornamental masthead div (line 83) — two competing titles |
| `Graveyard` | Graveyard.tsx:26 | ✅ | `icon={Skull}`, subtitle `IMPERIAL · FALLEN · MEMORIAL ARCHIVE`, stat actions |
| `Recruit` | Recruit.tsx:377 | ✅ | `icon={UserPlus}`, subtitle `STABLE · RECRUITMENT · CONTRACT MARKET` |
| `PhysicalsSimulator` | PhysicalsSimulator.tsx:94 | ❌ **MISSING** | Raw `<h1>Physicals Simulator</h1>` + `<p>` — no `PageHeader` import or usage |
| `AdminTools` | AdminTools.tsx:114 | ❌ **MISSING** | Raw `<h1>Admin_Interface</h1>` inside a flex div — no `PageHeader` import or usage |
| `StableDetail` | StableDetail.tsx:40 | ✅ | Archetype C Dossier — hand-rolled hero banner is **correct per spec** |
| `WarriorDetail` | WarriorDetail.tsx:55 | ✅ | Archetype C Dossier — `WarriorHeroHeader` + `SubNav` is **correct per spec** |
| `PromoterDetail` | PromoterDetail.tsx:171 | ⚠️ | Hand-rolled hero section — not in spec archetype map; treated as Dossier, **acceptable** |
| `Help` | Help.tsx:~1 | ✅ | `icon={BookOpen}`, subtitle `IMPERIAL · KNOWLEDGE · STRATEGY COMPENDIUM` |

---

## `eyebrow` prop — SPEC REQUIRES IT, but PageHeader lacks it

**Spec §3** explicitly defines `eyebrow` as a distinct `<PageHeader>` prop (codex ALL_CAPS label, `tracking-[0.4em]`, rendered above the title) — separate from `subtitle` (parchment italic body below title).

**Actual `PageHeader.tsx`**: has only `subtitle` prop (line 7), rendered at line 47 with `text-[10px] font-black uppercase tracking-[0.25em]`. **No `eyebrow` prop exists.** All pages use `subtitle` for this purpose.

**Decision**: The spec calls for `eyebrow` but the component and all call-sites use `subtitle` as a single field covering both. Adding a new `eyebrow` prop would be additive and require updating all 20+ call-sites. The visual result is identical. **This is a spec-vs-implementation naming drift — track but treat as low-priority cosmetic rename if desired. NOT blocking any page compliance.** Skip for now.

---

## Band 2 — Hero/Focus Strip: code-verified against spec §5–6

| Page | Spec §5 Band 2 | Actual Code | Gap? |
|---|---|---|---|
| `ControlCenter` | Yes — storyline/KPI | `HeroPanel` (stable name+record+badges) line 435 + `KpiBar` line 438 = **full Band 2** | ✅ |
| `ArenaHub` | Yes — Crowd Mood card full-width (spec §6.1) | `CrowdMoodWidget` buried in `lg:col-span-4` sidebar (line 227) | ❌ Needs full-width strip |
| `RunRound` | Yes — pinned Stable Readiness 4-pill banner (spec §6.2) | Readiness pills in PageHeader `actions` + `Stable_Readiness` sidebar Card (line 185) — **not a pinned Band 2** | ❌ Needs dedicated strip |
| `Tournaments` | Yes — Active Bracket banner (spec §6.3) | Bracket `Card` directly below PageHeader (line 143) — effectively Band 2 | ✅ |
| `StableHall` | Yes — stable hero: name + crest + Fame/Titles (spec §6.5) | Fame/Titles HUD in PageHeader `actions` — **not a separate Band 2 strip** | ❌ Needs Band 2 |
| `StableLedger` | Yes — runway alert `variant="blood"` if < 4wk (spec §6.11) | PageHeader line 20 → directly into `<Tabs>` line 34. Nothing between | ❌ Missing |
| `Offseason` | Yes — season recap headline with champion (spec §6.16) | `<YearEndRecap />` directly below PageHeader | ✅ |
| `BookingOffice` | Yes — "card preview" strip (spec §5 table) | Nothing — straight to Tabs | ❌ Missing |

---

## Band 3 — Layout Archetype: code-verified against spec §4–5

| Page | Spec Archetype | Actual | Gap? |
|---|---|---|---|
| `ControlCenter` | A Command Grid | `HeroPanel`+`KpiBar`+6-tab grid, all `<Surface variant="glass">` | ✅ |
| `ArenaHub` | A Command Grid | `lg:grid-cols-12` (8+4) Surface widgets | ✅ |
| `Tournaments` | A Command Grid | Single column — bracket card + history list | ⚠️ Minor |
| `Offseason` | A Command Grid | `YearEndRecap` + 3-col nav links | ⚠️ Minor |
| `StableLedger` | A Command Grid | 6-tab layout — acceptable tabs-over-cards | ⚠️ |
| `StableHall` | B Ledger | `lg:grid-cols-12` (5+7) sidebar+RosterWall | ✅ |
| `WorldOverview` | B Ledger | `WorldStats` strip + Tabs | ✅ |
| `Recruit` | B Ledger | Full-width Tabs only — **no left filter sidebar** | ❌ |
| `Training` | B Ledger | `lg:grid-cols-4` + `lg:grid-cols-3` card grid | ⚠️ Acceptable |
| `Scouting` | B Ledger | Full-width tabs | ⚠️ |
| `Trainers` | B Ledger | Full-width tabs | ⚠️ |
| `Admin` | **B Ledger** (spec §6.18) | 3-col card grid — **Archetype A, not B** | ❌ Wrong archetype |
| `WarriorDetail` | C Dossier | `WarriorHeroHeader`+`SubNav`+tabs | ✅ |
| `StableDetail` | C Dossier | Hero banner+stats+tabs+roster | ✅ |
| `TrainingPlanner` | D Planner | `sm:grid-cols-2` card grid — **no left roster + right canvas** | ❌ |
| `BookingOffice` | D Planner | Tabs only — **no left warrior list + right slot canvas** | ❌ |
| `StableEquipment` | D Planner | `lg:col-span-4` + `lg:col-span-8` split | ✅ |
| `PhysicalsSimulator` | **D Planner** (spec §6.17) | Two-column form, no left warrior picker | ❌ Wrong structure |
| `Gazette` | E Chronicle | `GazetteMasthead`+stacked cards — intentional bespoke | ✅ |
| `HallOfFame` | E Chronicle | `PageHeader` + duplicate `<h1>` masthead | ❌ |
| `Graveyard` | E Chronicle | `PageHeader`+Tabs+FallenGrid | ✅ |
| `Help` | E Chronicle | `PageHeader`+`max-w-3xl` Accordion | ✅ |
| `RunRound` | **F Focus** — single hero card centered (spec §6.2) | `lg:grid-cols-3` (2+1 split) — **not a single centered hero** | ❌ |

---

## Surface Variant (`bg-glass-card` raw class): code-verified

| File | Lines | Context | Correct Surface |
|---|---|---|---|
| `HallOfFame.tsx` | 73 | Masthead div (being removed anyway) | — |
| `HallOfFame.tsx` | 116 | STABLE_OF_YEAR award card | `variant="gold"` |
| `HallOfFame/InducteeCard.tsx` | 43 | Every inductee card | `variant="gold"` |
| `Graveyard.tsx` | 73 | Empty state `motion.div` | `variant="blood"` |
| `Graveyard.tsx` | 90 | Each fallen warrior card | `variant="blood"` |
| `Tournaments.tsx` | 144 | Active bracket card | `variant="gold"` |
| `AdminTools.tsx` | 130,157,176,221 | All 4 tool cards | `variant="glass"` |
| `BookingOffice.tsx` | 153 | Each offer card | `variant="glass"` |
| `RunRound.tsx` | 159 | Empty state card | `variant="glass"` |
| `RunRound.tsx` | 185 | `Stable_Readiness` card | `variant="glass"` |
| `StableEquipment.tsx` | 53,97,142 | Style selector + champion cards | `variant="glass"` |
| `Recruit.tsx` | 88 | `RecruitCard` wrapper | elites `variant="gold"`, others `variant="glass"` |

---

## Broken Nav / Lint

| File | Line | Issue |
|---|---|---|
| `Training.tsx` | 148 | `window.location.href = '/recruit'` — wrong route + imperative nav; no `useNavigate` import in this file |
| `TrainingPlanner.tsx` | 5 | Unused `React` import |
| `TrainingPlanner.tsx` | 183 | Unused `season` destructuring |

---

## Complete Implementation Plan — 14 Steps, Nothing Deferred

### Step 1 — Add `PageHeader` to 3 missing pages

**`ControlCenter.tsx`**: Add `import { PageHeader } from "@/components/ui/PageHeader"` (it's not currently imported). Insert `<PageHeader icon={Swords} title="Command Center" subtitle="COMMAND · HQ · STRATEGIC OVERVIEW" />` at line 433 before `<HeroPanel />`.

**`PhysicalsSimulator.tsx`**: Replace lines 93–100 (`<div><h1>...</h1><p>...</p></div>`) with `<PageHeader icon={Activity} title="Physicals Simulator" subtitle="TOOLS · SIMULATION · NO RECORDS KEPT" />`. Add `import { PageHeader } from "@/components/ui/PageHeader"`.

**`AdminTools.tsx`**: Replace lines 112–127 (the hand-rolled `<div className="flex items-center justify-between border-b...">` header block) with `<PageHeader icon={Settings} title="Administration" subtitle="IMPERIAL CENSOR · ADMIN · SYSTEM OVERRIDE" actions={<Badge variant={ftueComplete ? "outline" : "destructive"} ...>SYSTEM_{ftueComplete ? "UNLOCKED" : "LOCKED"}</Badge>} />`. Add `import { PageHeader } from "@/components/ui/PageHeader"`.

### Step 2 — Remove HallOfFame duplicate `<h1>` masthead
Delete lines 72–99: the `{/* Masthead */}` div containing `bg-glass-card`, the Trophy ornament, and the duplicate `<h1>Hall of Fame</h1>` + subtitle. `PageHeader` (line 67) already renders the title. Also remove now-unused `Separator` import if orphaned.

### Step 3 — Fix Training.tsx broken nav
Add `import { useNavigate } from "@tanstack/react-router"` to imports (line 1–17). Add `const navigate = useNavigate()` in component body. Change line 148: `onClick={() => window.location.href = '/recruit'}` → `onClick={() => navigate({ to: '/stable/recruit' })}`.

### Step 4 — ArenaHub Band 2: CrowdMoodWidget full-width strip
Between `<PageHeader>` (line 212) and the `<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">` (line 214), insert a full-width `<Surface variant="glass" className="flex items-center gap-8 p-5 border-l-4 border-l-accent/50">` strip containing the `CrowdMoodWidget` content in horizontal layout (mood emoji + label left, modifier pills right). Remove `<CrowdMoodWidget />` from the sidebar col-span-4 (line 227). The vacated sidebar slot absorbs the `Arena_Analytics` surface block already in col-span-4.

### Step 5 — RunRound Band 2: Stable Readiness pinned strip (spec §6.2)
Spec says Band 2 = "Stable Readiness — 4 stat pills (healthy / injured / in-training / scheduled)." Currently buried as a sidebar Card (line 185). Move `Stable_Readiness` Card content into a full-width Band 2 strip between `<PageHeader>` and the `lg:grid-cols-3` grid. Strip uses `<Surface variant="glass" className="flex items-center gap-8 p-4">` with 4 pills: MISSION_READY, COMBAT_PAIRED, INJURED, IN_TRAINING. The sidebar Card at line 185 gets removed.

### Step 6 — StableHall Band 2: stable hero strip (spec §6.5)
Spec §6.5: "Hero Strip: stable name (hero Cinzel), crest ornament, Fame/Titles HUD bronze-bordered." Currently the Fame/Titles HUD is packed into `PageHeader.actions`. Extract it: after `<PageHeader>` (line 35), insert `<Surface variant="gold" className="flex items-center gap-8 p-6">` with stable crest icon, `player.stableName` in large Cinzel, and Fame/Titles pills — matching spec. Remove the `actions` prop from the `PageHeader` (or keep minimal).

### Step 7 — StableLedger Band 2: treasury runway alert (spec §6.11)
Between `<PageHeader>` (line 32) and `<Tabs>` (line 34), add `import { computeWeeklyBreakdown } from "@/engine/economy"`. Compute `breakdown` at the top of the component. Insert: `<Surface variant={breakdown.net < 0 ? "blood" : "glass"} className="flex items-center gap-8 p-4">` showing: gold total · weekly delta · runway weeks · Solvent/Impaired badge.

### Step 8 — BookingOffice Band 2: this-week card preview strip (spec §5)
Spec §5 table: BookingOffice has "Yes (card preview)" Band 2. After `<PageHeader>` (line 291), add a full-width `<Surface variant="glass" className="p-4 flex items-center gap-6">` strip showing: total offers this week, highest purse offer, idle warrior count — a quick-glance summary before the tabs.

### Step 9 — Recruit filter sidebar (B Ledger, spec §6.8)
Inside `<TabsContent value="scout">` (line 414), replace flat body with `lg:grid-cols-12`:
- **Left (lg:col-span-3)** `<Surface variant="glass">`: tier checkboxes (4 tiers → `activeTiers` state), style select (`activeStyle` state), sort select (`sortBy` state), Refresh button (moved from line 419), cost key legend.
- **Right (lg:col-span-9)**: filtered+sorted `sm:grid-cols-2` card grid + result count.
- 3 new `useState` hooks + 1 `useMemo` to filter/sort `recruitPool`.
- Lines 415–438 (flat header + tier legend) absorbed into sidebar.

### Step 10 — TrainingPlanner: D Planner split (spec §6.4 / §4D)
Replace `sm:grid-cols-2` grid (lines 349–359) with `lg:grid-cols-12`:
- **Left (lg:col-span-3)** `<Surface variant="glass">`: scrollable warrior selector list — name, potential grade badge, trainability %, burn count. `border-l-2 border-primary` on selected.
- **Right (lg:col-span-9)**: single selected `<WarriorPlannerCard>`.
- Add `selectedWarriorId` state (default first active warrior).
- Legend strip moves above the split (full-width).
- Empty state stays full-width.

### Step 11 — BookingOffice: D Planner left roster sidebar (spec §6.9)
Wrap `<Tabs>` block (line 318) in `lg:grid-cols-12`:
- **Left (lg:col-span-3)** `<Surface variant="glass">`: active warrior list — name, style, fatigue badge, injury badge, has-offer-this-week indicator.
- **Right (lg:col-span-9)**: existing `<Tabs>` unchanged.
- No new state needed. Bulk action buttons stay above the grid.

### Step 12 — RunRound: F Focus archetype (spec §6.2 / §4F)
Spec: "Single hero card centered, minimal chrome, one massive CTA."  
Current: `lg:grid-cols-3` (2+1) split.  
**Change**: Remove the `lg:grid-cols-3` wrapper. Render as a single centered column (`max-w-3xl mx-auto space-y-6`). The `AutosimConsole` and `Stable_Readiness` (now moved to Band 2 in Step 5) no longer need a sidebar column. The match manifest (`MatchCard` list) renders full-width inside a single `<Surface variant="glass">` hero card. The `AutosimConsole` moves below the main card.

### Step 13 — Surface variant migrations (all pages)
**Priority group 1 (semantic):**
- `HallOfFame/InducteeCard.tsx:43`: `<Card className="bg-glass-card">` → `<Surface variant="gold" padding="none">`
- `HallOfFame.tsx:116`: STABLE_OF_YEAR card → `<Surface variant="gold" padding="none">`
- `Graveyard.tsx:73`: empty state → `<Surface variant="blood" className="text-center py-32 border-2 border-dashed">`
- `Graveyard.tsx:90`: each warrior `motion.div` → use `className={cn(surfaceVariants({variant:"blood"}), "group relative...")}` import `surfaceVariants`
- `Tournaments.tsx:144`: bracket card → `<Surface variant="gold" padding="none" className="border-accent/40 shadow-[...]">`

**Priority group 2 (visual parity):**
- `AdminTools.tsx:130,157,176,221`: 4 tool cards → `<Surface variant="glass" padding="none">`
- `BookingOffice.tsx:153`: offer card → `<Surface variant="glass" padding="none">`
- `RunRound.tsx:159,185`: empty state + readiness card → `<Surface variant="glass" padding="none">`
- `StableEquipment.tsx:53,97,142`: 3 cards → `<Surface variant="glass" padding="none">`
- `Recruit.tsx:88`: `RecruitCard` → `<Surface variant={isElite ? "gold" : "glass"} padding="none">`

### Step 14 — PhysicalsSimulator: D Planner restructure (spec §6.17)
Spec §6.17: "Left: warrior picker. Right: simulated fight lab." Currently both fighters are flat form inputs with no roster selector.
**Change** (after Step 1 adds `PageHeader`): Wrap the existing two-fighter form in `lg:grid-cols-12`:
- **Left (lg:col-span-3)** `<Surface variant="glass">`: scrollable active warrior list. Clicking a warrior populates `statsA` (first click) or `statsB` (second click / toggle), auto-filling their attributes. Show which slot each warrior is filling with a badge (FIGHTER A / FIGHTER B).
- **Right (lg:col-span-9)**: existing attribute sliders + simulation results card, unchanged.
- Requires reading `roster` from `useGameStore()` (already imported). Add `fighterAId`, `fighterBId` state to drive auto-fill.

### Step 15 — AdminTools: B Ledger archetype restructure (spec §6.18)
Spec §6.18: "Ledger of game-state toggles." Currently 4-card `lg:grid-cols-3` Command Grid.
**Change**: Restructure to `lg:grid-cols-12`:
- **Left (lg:col-span-3)** `<Surface variant="glass">`: category nav list — Save_Core · Temporal_Drift · Mastery_Toolkit · Telemetry (currently the 4 card titles). Clicking highlights the active category with `border-l-2 border-primary`.
- **Right (lg:col-span-9)**: show only the selected category's card content (the existing `CardContent` JSX) in a full-width `<Surface variant="glass">` panel.
- Add `activeCategory` state (default `"save"`).
- Removes the grid — each card body becomes a panel body.

### Step 16 — Lint + minor fixes
- **`TrainingPlanner.tsx:5`**: remove unused `React` import.
- **`TrainingPlanner.tsx:183`**: remove `season` from `useGameStore()` destructure.
- **`StableEquipment.tsx:46`**: `subtitle="Manage specialized loadouts..."` → `subtitle="OPS · ARMORY · TACTICAL LOADOUTS"`.

---

## Confirmed Already Compliant — No Work Needed
- `WorldOverview`: `WorldStats` 4-block strip already at line 192 between PageHeader and Tabs. ✅
- `StableEquipment`: `lg:col-span-4` + `lg:col-span-8` D Planner split already correct. ✅
- `Gazette`: bespoke `GazetteMasthead` is intentional for Archetype E. ✅
- `WarriorDetail` / `StableDetail`: Archetype C Dossier hero banners are correct per spec. ✅
- `Offseason`: `YearEndRecap` directly below PageHeader satisfies Band 2. ✅
- `Tournaments`: bracket `Card` directly below PageHeader satisfies Band 2. ✅
