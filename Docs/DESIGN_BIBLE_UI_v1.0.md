# Stable Lords — UI/Visual Design Bible v1.0
## "Codex Sanguis" Design System

---

> *"In the arena, everything is recorded. Every drop of blood. Every roar of the crowd. Every gold coin that changes hands. The Codex Sanguis is our record."*

---

## 1. Design Philosophy

### The Core Idea

Stable Lords is a gladiatorial management game where you act as a powerful Roman-era patron — a *dominus ludi* (master of games) — who maintains meticulous records of their fighters, finances, and fights. The UI is the physical manifestation of **your office**: dimly lit by torchlight, shelves heavy with wax-sealed scrolls, bronze ornaments on dark wood furniture, parchment ledgers stacked beside iron-bound chests.

The design system is called **Codex Sanguis** (The Blood Record). It renders this ancient record-keeping system in digital form — warm, authoritative, earned through blood and glory.

### What We Are NOT

- ❌ Cold cyberpunk / sci-fi terminal aesthetic
- ❌ Purple gradients on white (generic AI slop)
- ❌ Bright clean Material Design / app-like UI
- ❌ Fantasy RPG with glowing runes (too fantastical)
- ❌ Sports management sterility (too corporate)

### What We ARE

- ✅ Warm torchlit archives — amber, bronze, deep crimson
- ✅ Roman Imperial-era record-keeping aesthetic
- ✅ Hard stone and aged timber surfaces — no rounded corners
- ✅ Engraved/carved typography — text feels cut into stone
- ✅ Parchment-toned foregrounds — not harsh white
- ✅ Authority and weight — this is a blood sport, not a mobile game

---

## 2. Inspiration References

### Direct Inspirations

| Game/Medium | What We Borrow |
|---|---|
| **Darkest Dungeon** | Dark atmosphere, gothic gravitas, narrative weight |
| **Crusader Kings III** | Dynasty/legacy framing, medieval record aesthetics, coat of arms |
| **Hades** | Cohesive warm palette, mythological authority |
| **Football Manager (classic)** | Dense data management, ledger-style tables |
| **Shadow of Rome** | Literal gladiatorial aesthetic, Roman architecture |
| **Gladiator (2000 film)** | Dusty colosseum atmosphere, blood + glory tone |
| **Illuminated Manuscripts** | Ornate borders, decorated headers, parchment feel |

### Visual References

- Roman forum inscription stonework: deep engraved uppercase lettering
- Leather-bound ledger books: warm dark covers, cream pages
- Bronze military seals and signet rings: official stamps of authority  
- Mosaic floor patterns: geometric decorative elements
- Amphitheatre architecture: arched forms, stone colonnades
- Oil lamp / torch lighting: warm amber pools in darkness

---

## 3. Color System

### Primary Palette

```
Background:    #0C0806  (HSL 24 18% 5%)   — Charred wood / near-black
Card Surface:  #140F09  (HSL 26 20% 8%)   — Dark aged leather
Primary:       #872228  (HSL 358 65% 32%) — Deep blood crimson
Accent/Gold:   #BD8A24  (HSL 38 58% 44%)  — Burnished bronze-gold
Foreground:    #E7D3AF  (HSL 34 38% 86%)  — Warm papyrus ivory
Muted Text:    #7B6A50  (HSL 32 16% 48%)  — Aged ink on parchment
Border:        #2A1E13  (HSL 30 18% 16%)  — Weathered wood grain
```

### Arena Color Tokens

```
--arena-gold:   #C9972A  — Burnished arena gold (fame, wealth)
--arena-blood:  #912228  — Arena crimson (kills, danger, warning)
--arena-fame:   #8B5FC4  — Fame purple (prestige, glory)
--arena-pop:    #337F8C  — Crowd teal (popularity, engagement)
--arena-steel:  #93939B  — Cold steel (neutral, secondary stats)
--arena-bone:   #BBA882  — Parchment/bone (historical, archived)
```

### Color Semantics

| Color | Used For |
|---|---|
| **Blood Crimson** (Primary) | Actions, CTAs, danger states, weapon kills |
| **Bronze Gold** (Accent) | Fame, gold/treasury, achievements, trophies |
| **Papyrus** (Foreground) | Primary body text, card content |
| **Arena Fame** (Purple) | Fame scores, legendary status, prestige |
| **Arena Pop** (Teal) | Crowd stats, popularity, event indicators |
| **Destructive** | Permanent actions, death, injury alerts |

### Atmospheric Gradients

The background uses two radial gradients creating a torchlit room:
1. **Warm amber corner glow** (upper-left): Like a torch mounted on the wall
2. **Crimson warmth** (lower-right): The distant memory of the arena

---

## 4. Typography

### Type Scale

| Role | Font | Treatment |
|---|---|---|
| **Hero Titles** | Cinzel 900 | ALL CAPS, tracking 0.06em, text-shadow carved |
| **Page Headers** | Cinzel 700 | ALL CAPS, tracking 0.05em |
| **Section Labels** | Cinzel 400 | ALL CAPS, tracking 0.4em, bronze/muted color |
| **Body Text** | Inter 400 | Normal case, slightly warm on dark |
| **Stat Numbers** | Inter/mono 700 | Tabular numerals, bold |
| **System Labels** | Inter 900 | UPPERCASE, tracking 0.2-0.4em (the "codex notation") |

### Typography Rules

1. **ALL display text uses Cinzel** — it reads as Roman inscriptions
2. **Heading shadow**: `text-shadow: 0 2px 8px rgba(0,0,0,0.7), 0 1px 0 rgba(0,0,0,0.9)` — creates the engraved look
3. **Stat/data text** should feel like carved ledger entries — monospace or Inter 700
4. **"Codex notation"** for system labels: `UPPERCASE_WITH_UNDERSCORES` in tracking-widest — this is internal record language, like official Roman bureaucratic notation
5. **Body text** is slightly warm (`--foreground: warm papyrus`) — NEVER pure white, which feels cold and digital

### DON'Ts

- ❌ Never use Inter for headers
- ❌ Never use pure white (#FFFFFF) for text
- ❌ Never use small tracking on display text (it should breathe)
- ❌ Never use light/thin font weights on dark backgrounds (unreadable)

---

## 5. Spacing & Layout

### Grid System

- **Max content width**: 7xl (1280px) — allows breathing room
- **Page padding**: `pb-20` at minimum on main pages
- **Section spacing**: `space-y-12` between major page sections
- **Card grid**: 3-column default (`grid-cols-3`) with `gap-4` to `gap-8`
- **Sidebar layouts**: `lg:col-span-4 / lg:col-span-8` split for detail pages

### Border Radius

**Radius is 0px** throughout — all surfaces are **hard-edged**. This evokes stone-cut tablets, wax impressions, and iron-bound chests. No rounded softness — this is a blood sport management system.

The *only* exceptions:
- Tooltips (slight 2px for readability)
- Badges (2px so text doesn't clip)
- Progress bars (full rounding for the fill metaphor)

### Depth Hierarchy

| Level | Element | Treatment |
|---|---|---|
| 0 | Page background | `#0C0806` + texture |
| 1 | Main content area | Inherits background |
| 2 | Cards / Surfaces | `#140F09` + subtle gradient |
| 3 | Active/hover states | +brightness, border glow |
| 4 | Modals / Popovers | Darker + backdrop blur |

---

## 6. Surface Variants

### `variant="glass"` — Primary card surface
Dark warm surface with subtle gradient overlay. The workhorse card style.
```
bg: rgba(#120D09, 0.7) with backdrop-blur
border: 1px warm dark (#2A1E13)
top-border: slightly lighter for depth
```

### `variant="gold"` — Trophy/achievement surfaces
Bronze-gold accented for fame and glory elements.
```
border: arena-gold/30 with gold glow shadow
```

### `variant="blood"` — Danger/kill surfaces
Crimson accented for lethal results and warnings.
```
border: arena-blood/30 with blood glow shadow
```

### `variant="parchment"` — Historical/archive surfaces
Aged warm surface for Gazette, Hall of Fame, chronicle content.
```
bg: very dark warm with parchment-texture overlay
border-double style effect
```

---

## 7. Component Patterns

### Page Headers

Every page has a `<PageHeader>` with:
- **Icon**: Displayed in an `imperial-ring` container (bronze-bordered square)
- **Title**: Large Cinzel display font with carved text-shadow
- **Subtitle**: Small ALL_CAPS_CODEX_NOTATION in muted/60 opacity
- **Separator**: Gradient line from primary/40 to transparent
- **Actions**: Right-aligned HUD elements (gold/fame stats, mode toggles)

### Section Labels

Section dividers use the pattern:
```jsx
<span className="codex-label">SECTION_NAME</span>
<div className="h-px flex-1 bg-gradient-to-r from-accent/20 via-border/20 to-transparent" />
```

This creates a "scratched into stone" visual for each major content area.

### Data Tables

Tables follow these conventions:
- Header row: `bg-white/[0.03]` — barely visible distinction
- Header text: `text-[9px] font-black uppercase tracking-widest` — tiny but authoritative
- Rows: Alternating subtle hover states
- Player rows: `bg-primary/[0.03] border-l-2 border-l-primary` — your empire is marked
- Numbers: `font-mono font-black` — precision ledger entries

### Badges

Tiers use color-coded outlines:
```
Common:     border-border/40 text-muted-foreground
Promising:  border-blue-500/30 text-blue-400 bg-blue-500/10
Exceptional: border-purple-500/50 text-purple-400 (+ subtle glow)
Prodigy:    border-arena-gold text-arena-gold bg-arena-gold/10 (+ stronger glow)
```

### Stat Bars

Progress/stat bars should feel like **sand filling a carved groove**:
- Track: `bg-secondary/30 border border-border/20` — dark carved groove
- Fill: `bg-primary` or gradient — warm fill
- Height: 1.5px or 3px — delicate but precise

### Buttons

Primary buttons use the crimson brand color:
```
bg: primary (blood crimson) 
hover: brightness up + slight scale
text: warm papyrus white
shadow: subtle glow-blood on primary actions
```

Secondary buttons:
```
bg: neutral-900/60 border border-white/5
text: muted-foreground 
hover: subtle white/5 increase
```

---

## 8. Screen-by-Screen Design Intent

### Title Screen (`/start`)

**Atmosphere**: Stone threshold before the arena gates. Torch flames in the corners. The game title carved into the arch above.

**Key Elements**:
- Large `STABLE LORDS` title in Cinzel 900 with carved text-shadow and faint gold glow
- Subtitle: "Build a stable. Train warriors. Fight for glory." — italic, parchment-toned
- Save slots displayed as engraved stone tablets (dark cards with header-ornament border treatment)
- Wax seal decorative element alongside the title (CSS — crimson circle with sword icon)
- Animated torch warmth in the background (ambient radial gradient breathes slightly)
- `CONTINUE` button: Primary crimson — most prominent action
- `NEW GAME` button: Gold outline — secondary importance
- Footer: "Stable Lords v2.0 — All records stored in the Imperial Registry"

### Orphanage FTUE (`/welcome`)

**Atmosphere**: A cold anteroom where warriors are assessed. Official bureaucratic intake process.

**Key Elements**:
- Progress bar looks like a scroll being unrolled (fills left to right with warmth)
- Step labels in codex notation: "ESTABLISH_IDENTITY / CHOOSE_WARRIORS / FIRST_BLOOD / YOUR_STORY_BEGINS"
- Warrior selection cards: Each has a "gladiatorial registration" feel — name prominent, style badge like a wax seal, stats as engraved numbers
- The "First Blood" result card: Dramatic — blood-border variant, winner announced in large crimson
- Final step: Warm arrival — "Your Story Begins" with golden accents, entering the main game

### Dashboard (`/`)

**Atmosphere**: The *tablinum* (patron's office) — everything you need to manage your empire at a glance.

**Key Elements**:
- Stable name in hero Cinzel as the page title
- Owner name below in small muted italic — "By [Name] • Command Center"
- Gold/Fame stats in a warm-bordered HUD panel in the header actions
- Widget grid: `grid-cols-3` of glass-card surfaces
- Draggable edit mode: Warm highlight rings instead of cold blue
- Widgets should feel like documents laid on a desk — each has its own "ink and parchment" feel

### Arena Command Hub (`/arena`)

**Atmosphere**: Standing in the sponsor's box overlooking the colosseum floor.

**Key Elements**:
- PageHeader with Swords icon in imperial-ring
- Leaderboard: Stone-carved table with rank numbers in `font-mono font-black`
- Crowd Mood widget: Large mood icon (like an omen/auspice) + bronze modifier stats
- The "ARENA_ANALYTICS" panel feels like a carved wall of statistics

### Run Round (`/run-round`)

**Atmosphere**: The arena floor is prepared. Warriors are ready. The signal must be given.

**Key Elements**:
- `EXECUTE WEEK [N] CYCLE` button: Maximum visual weight — primary large, blood crimson
- Match cards: Each bout looks like an official bout declaration — fighter names prominent, vs divider
- "Stable Readiness" sidebar: Quick data panel, like an official manifest
- After results: Cards show win/loss/kill with appropriate color weight (kills in blood crimson, wins in gold)

### Stable Hall (`/stable`)

**Atmosphere**: The trophy room and great hall of your stable. Warrior portraits line the walls.

**Key Elements**:
- Stable name as the massive header title
- Fame and Titles displayed in bronze-bordered HUD
- Roster displayed as a wall of warrior portraits (cards with fighter stats)
- Trainer table: Official staff registry format
- Reputation sliders: Carved groove fills in warm red

### Training Grounds (`/training`)

**Atmosphere**: The gymnasium — dusty, functional, purposeful.

**Key Elements**:
- Three stat surfaces at top: "Active Drills / Medical Bay / Reserve Pool" — clean data panels
- Training cards: Assignment feels like writing a training mandate on a wax tablet
- Recovery state: Subtle warm red tint — medical/healing connotation
- "RESET_ALL" button: Secondary style — clears the training manifest

### Recruitment (`/recruit`)

**Atmosphere**: The fighter market — browsing warrior contracts at the forum.

**Key Elements**:
- Warrior cards feel like fighter contracts/dossiers
- Tier badges use the wax-seal visual language — increasingly ornate for higher tiers
- Cost display: Gold coin icon + bronze-colored number
- Custom builder tab: "Forge a Warrior" — creation process feels deliberate

### The Gazette (`/gazette`)

**Atmosphere**: The *acta diurna* — Rome's daily gazette, pinned at the forum.

**Key Elements**:
- This is the most distinctive screen — it should feel like an actual historical newspaper
- Masthead: Ornate, centered, `THE ARENA GAZETTE` in largest Cinzel with decorative rules above/below
- Issue numbers: "Week 12 // Season Autumn // Est. 412 AE"
- Articles: Generous typography, parchment surface backgrounds for article cards
- Leaderboards: Feel like official rankings posted at the forum — stone tablet style
- No page-wide glass UI feel — this is a *newspaper*, so more contrast and legibility

### Warrior Detail (`/warrior/:id`)

**Atmosphere**: The official gladiatorial dossier — everything we know about this fighter.

**Key Elements**:
- Hero header: Fighter name in massive Cinzel + style badge as a seal
- Tabs: "BIOMETRICS / MISSION_CONTROL / CHRONICLE" — official records categories
- Stats: Engraved table format — attribute scores feel carved into stone
- Career timeline: Chronicle feels like a historical record being written in real-time
- Equipment: Visual "loadout" display — equipment items as official armory entries

### World Overview (`/world`)

**Atmosphere**: The Imperial Census and Rankings Board.

**Key Elements**:
- "NATIONAL COMMISSION ARCHIVE" subtitle
- Tabs: STABLES / WARRIORS / INTELLIGENCE — official record categories
- Rankings tables: Player's stable highlighted with crimson left-border
- World stats: Four large carved numbers at the top — total stables, warriors, kills, top stable

### Graveyard (`/graveyard`)

**Atmosphere**: The memorial wall. Solemn, heavy, permanent.

**Key Elements**:
- Skull icon with blood shadow in the page header
- Cards feel like memorial plaques — darker, more solemn than regular warrior cards
- "Cause of death" in small muted italic
- Two tabs: "MY FALLEN" and "WORLD MEMORIAL" — player's losses vs. all
- Minimal color — this is a place of death and memory

### Hall of Fame (`/hall-of-fame`)

**Atmosphere**: The shrine room. Legendary warriors immortalized.

**Key Elements**:
- Crown icon + golden glow treatment
- Inductee cards feel like commemorative plaques — bordered in gold
- Annual award sections with ornate year headings
- All-time greats at the top — the most famous warriors displayed largest

---

## 9. Animation Philosophy

### Principle: Authority, Not Playfulness

Animations should feel like a page being turned or a door being opened — **purposeful and weighty**. Not bouncy, not sparkly.

### Used Animations

| Animation | Where | Effect |
|---|---|---|
| `fade-in + slide-in-from-bottom` | Page content on load | 300-500ms, ease-out |
| `fade-in + zoom-in-95` | Cards and widgets | 200-400ms |
| `staggered children` | Lists and grids | 50-100ms delay per item |
| `torchFlicker` | Background glow | 3s, very subtle |
| `livePulse` | Status indicators | 2s breathe |
| Page transitions | Route changes | Instant with fade — no sliding pages |

### DON'Ts

- ❌ No bouncy spring animations (easing should be ease-out or [0.16, 1, 0.3, 1])
- ❌ No rotation animations (unless a weapon is literally spinning)
- ❌ No emoji or sparkle animations in serious UI contexts
- ❌ Animations should complete within 700ms max for navigation-critical elements

---

## 10. Icon Language

### Icon Sources

**Primary**: Lucide React — clean, consistent, professional
**Supplemental**: Custom CSS ornaments for decorative elements

### Semantic Icon Mapping

| Icon | Meaning |
|---|---|
| `Swords` | Combat, battles, arena, fight actions |
| `Shield` | Stable identity, defense, protection |
| `Crown` | Champion status, tournament wins, titles |
| `Trophy` | Rankings, leaderboards, achievements |
| `Skull` | Death, kills, graveyard |
| `Flame / Zap` | Energy, action, immediate execution |
| `Star` | Fame, rating, quality tier |
| `Globe` | World overview, world state |
| `Newspaper` | Gazette, news, narrative |
| `Dumbbell` | Training, strength, physical development |
| `Coins / Gold` | Treasury, economy, gold values |
| `Users` | Roster, group, stable members |
| `Activity` | Stats, performance, live data |
| `Brain` | Intelligence, scouting, strategy |
| `Heart` | Health, recovery, medical |

### Icon Containers

Icons in page headers use the `imperial-ring` class:
```jsx
<div className="imperial-ring">
  <Icon className="h-5 w-5 text-accent" />
</div>
```

This creates a bronze-framed appearance — like official imperial seals.

---

## 11. Writing & Copy Style

### Voice

The game uses a dual-voice system:

1. **Codex Notation** (system/UI labels): `UPPERCASE_WITH_UNDERSCORES` — official, bureaucratic, terse. Like Roman legal documents. Used for: section labels, status indicators, system messages, table headers.
   - Examples: `STABLE_COMPOSITION`, `ARENA_ANALYTICS`, `WEEK_12_CYCLE`

2. **Narrative Voice** (game content): Dramatic, period-appropriate prose. Used in: Gazette articles, flavor text, lore descriptions, warrior bios.
   - Examples: *"The orphanage doors creak open. Beyond them lies the roar of the crowd..."*

### UI Text Rules

- Section labels: ALWAYS `UPPERCASE_WITH_UNDERSCORES` in the `codex-label` class
- Button text: Title Case for primary actions, UPPERCASE for secondary/system buttons
- Stat labels: Short, ALL CAPS, 2-4 characters preferred (`ATK`, `END`, `HP`)
- Numbers: Never spell out numbers for stats — always numerals
- Empty states: Use evocative language: *"The Presses Are Silent"* not *"No data available"*

---

## 12. Responsive Design

### Breakpoints

| Breakpoint | Content Width | Layout Changes |
|---|---|---|
| Mobile (< 768px) | Full width + padding | Single column, stacked headers |
| Tablet (768-1024px) | Full width | 2-column grids, condensed nav |
| Desktop (> 1024px) | Max-w-7xl centered | Full 3-column layouts, expanded headers |

### Key Responsive Behaviors

- Page headers: Stack actions below title on mobile
- Dashboard widgets: `md:grid-cols-3` — 1 col on mobile, 3 on desktop
- Tables: Horizontal scroll on mobile — use overflow-x-auto
- Sidebar layouts: Stack vertically on mobile (col-span-full)
- Codex notation labels: Hidden on mobile when they'd cause wrapping (use `hidden sm:flex`)

---

## 13. Accessibility

### Contrast Requirements

- Body text on background: minimum 7:1 ratio (AAA target)
- UI labels on cards: minimum 4.5:1 ratio (AA required)
- Interactive elements: minimum 3:1 for boundaries

### Focus States

Focus rings use `--ring` (crimson) with a warm offset:
```css
focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background
```

### Motion Preferences

Respect `prefers-reduced-motion`:
- All CSS animations reference `animation` properties that can be disabled
- Key functional transitions (accordion, dialog) should use instant state change as fallback

---

## 14. Design Debt & Antipatterns to Avoid

When building new screens or updating existing ones, watch for:

1. **Cold glow effects**: The old system used `hsl(var(--primary) / X)` for glows with cold blue tones. New glows should be warm amber or blood crimson.

2. **White-on-dark without warmth**: Pure `text-white` should be replaced with `text-foreground` (warm papyrus).

3. **Over-muted states**: 40% opacity muted-foreground text should be reserved for truly secondary info. Data should be readable.

4. **Rounded corners creeping in**: The `rounded-xl` default from shadcn needs consistent override. Keep `rounded-none` on structural elements.

5. **Purple gradient backgrounds**: Never add purple or blue-purple gradients — this is the signature look of generic AI interfaces.

6. **Missing codex-label treatment**: New sections should always have the `<span className="codex-label">SECTION_NAME</span>` + gradient divider pattern.

---

*Codex Sanguis Design System — Stable Lords UI/Visual Design Bible v1.0*
*Reference games: Darkest Dungeon, Crusader Kings III, Hades, Gladiator (2000), Shadow of Rome*
*Maintained by: Design team. Last updated: April 2026*
