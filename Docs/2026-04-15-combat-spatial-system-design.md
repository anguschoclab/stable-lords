# Combat Spatial System — Unified Design Spec
**Date:** 2026-04-15  
**Status:** Approved for implementation  
**Scope:** Distance State Machine · Phase-Within-Exchange · Spatial/Arena System

---

## 1. Overview

The current Stable Lords combat engine is an abstract exchange engine: no space, no time — just a sequence of opposed skill checks with phase escalation. Position is entirely implied by narrative. Weapons are decorative in the sense that a dagger and a greatsword produce identical mechanical outcomes except for `WEAPON_DAMAGE_TYPE`.

This spec adds three interlocking systems that make **range real**, **commitment meaningful**, and **arenas a first-class tactical variable** — without requiring a full engine rewrite or abandoning the Terrablood attribute/skill foundation.

The three systems ship as one unified feature:

| System | What it adds |
|--------|-------------|
| **Distance State Machine** | Four range bands; weapons have preferred ranges and ATT modifiers per band; fighters contest range each exchange |
| **Phase-Within-Exchange** | `resolveExchange` becomes a 5-sub-phase pipeline: Approach → Feint → Commit → Resolution → Recovery |
| **Spatial / Arena System** | Zone state (Center / Edge / Corner / Obstacle); arena data model with extensible registry; surface and weather hooks |

---

## 2. Architecture

```
simulate.ts
  └─ resolveExchange() — now a pipeline orchestrator
       ├─ Approach   (distance contest → range shifts, zone transitions)
       ├─ Feint      (optional deception roll → commitment bonus)
       ├─ Commit     (OE-driven exposure → ATT/DEF modifiers)
       ├─ Resolution (existing attack/defense/hit logic + accumulated modifiers)
       └─ Recovery   (write recovery debt back to FighterState)
```

### Data model changes summary

| Location | Change |
|----------|--------|
| `ResolutionContext` | Add `range`, `zone`, `arenaConfig` |
| `FighterState` | Add `recoveryDebt: number` |
| `FightPlan` | Add `feintTendency?: number`, `rangePreference?: DistanceRange` |
| `EquipmentItem` | Add `rangeModifiers?: Partial<Record<DistanceRange, number>>` |
| `CombatEventType` | Add `RANGE_SHIFT`, `FEINT_SUCCESS`, `FEINT_FAIL`, `ZONE_SHIFT`, `COMMIT` |
| `GameState` | Add `arenas: ArenaConfig[]`, `activeArenaId?: string` |
| `BoutOffer` | Add `arenaId?: string` |
| `simulateFight` signature | Add optional `arenaConfig?: ArenaConfig` final parameter |

### New files

| File | Purpose |
|------|---------|
| `src/data/arenas.ts` | Arena registry, seed configs, registration helpers |
| `src/engine/combat/distanceResolution.ts` | Distance contest algorithm, zone transition logic |
| `src/engine/combat/exchangeSubPhases.ts` | Approach / Feint / Commit / Recovery sub-phase functions |
| `src/test/distance.test.ts` | Unit tests for distance, feint, commit, zone, arena registry |

### Modified files

| File | Change |
|------|--------|
| `src/types/shared.types.ts` | `DistanceRange`, `ArenaZone`, `ArenaTag`, `CommitLevel`, `ZoneTransitionTable`, `SurfaceMod`, `ArenaWeatherMod` types |
| `src/types/combat.types.ts` | New event types, `FightPlan` additions |
| `src/data/equipment.ts` | `rangeModifiers` field on `EquipmentItem`, populated for all 22 weapons |
| `src/engine/combat/resolution.ts` | `ResolutionContext` additions; `resolveExchange` restructured as pipeline |
| `src/engine/bout/fighterState.ts` | `recoveryDebt` field, initialised to 0 |
| `src/engine/simulate.ts` | `arenaConfig` parameter; arena context initialisation |
| `src/engine/narrativePBP.ts` | New narrative functions for range, feint, zone, commit events |
| `src/data/narrativeContent.json` | New template arrays under `pbp.range_shift`, `pbp.feints`, `pbp.zone`, `pbp.commit`, `pbp.overextended` |
| `src/types/state.types.ts` | `GameState.activeArenaId`, `BoutOffer.arenaId` |
| `src/engine/bout/services/boutProcessorService.ts` | Arena lookup and pass-through to `simulateFight` |
| `src/test/balance.test.ts` | Weapon differentiation, arena, feint, and regression assertions |

---

## 3. Distance State Machine

### 3.1 Type

```ts
export type DistanceRange = "Grapple" | "Tight" | "Striking" | "Extended";
```

Ordered closest → furthest. The distance contest can shift range by at most one step per exchange.

### 3.2 Weapon Range Modifiers

Added as `rangeModifiers: Partial<Record<DistanceRange, number>>` on `EquipmentItem`. Values are flat ATT bonuses/penalties applied during Resolution. Omitted ranges default to 0.

| Weapon | Grapple | Tight | Striking | Extended |
|--------|---------|-------|----------|----------|
| Dagger | +4 | +2 | 0 | −6 |
| Epée | −4 | −1 | +3 | +1 |
| Hatchet | +1 | +3 | 0 | −3 |
| Shortsword | +2 | +2 | 0 | −2 |
| Small Shield | +3 | +2 | 0 | −3 |
| War Hammer | −2 | +2 | +1 | −1 |
| Scimitar | −3 | 0 | +2 | +1 |
| Mace | −1 | +2 | +1 | −2 |
| Longsword | −3 | 0 | +2 | +1 |
| Battle Axe | −4 | −1 | +2 | 0 |
| Broadsword | −2 | +1 | +2 | 0 |
| Medium Shield | +2 | +2 | 0 | −3 |
| Morning Star | −4 | −2 | +2 | +1 |
| Short Spear | −5 | −2 | +3 | +2 |
| War Flail | −4 | −1 | +2 | +1 |
| Large Shield | +1 | +2 | 0 | −4 |
| Quarterstaff | −4 | −1 | +2 | +3 |
| Great Axe | −5 | −2 | +2 | +1 |
| Greatsword | −5 | −1 | +2 | +2 |
| Long Spear | −8 | −4 | +1 | +4 |
| Halberd | −8 | −3 | +1 | +3 |
| Maul | −4 | −1 | +2 | 0 |

### 3.3 Preferred Range

A weapon's preferred range is the `DistanceRange` key with the highest `rangeModifiers` value. If `FightPlan.rangePreference` is set, it overrides the weapon-derived value for the distance contest motivation calculation.

### 3.4 Distance Contest Algorithm

Lives in `src/engine/combat/distanceResolution.ts`.

```
reachScore = INI + (OE − 5) × 2 + motivationBonus − (recoveryDebt × 2)
```

- `motivationBonus = +3` when current range is two or more steps from the fighter's preferred range
- `recoveryDebt × 2` is the Approach penalty for having overextended last exchange

The fighter with the higher `reachScore` shifts range one step toward their preferred zone. Ties leave range unchanged.

Result:
- Range changed → emit `RANGE_SHIFT` event (`metadata: { from, to, actor }`)
- Range unchanged → no event emitted
- Write `rangeMod = getWeaponRangeMod(weaponId, newRange)` to `ExchangeState`

### 3.5 Weapon Range Modifier Lookup

```ts
// src/engine/combat/distanceResolution.ts
export function getWeaponRangeMod(weaponId: string, range: DistanceRange): number {
  const item = getItemById(weaponId);
  return item?.rangeModifiers?.[range] ?? 0;
}
```

---

## 4. Phase-Within-Exchange

### 4.1 Exchange State Accumulator

```ts
export type CommitLevel = "Cautious" | "Standard" | "Full";

interface ExchangeState {
  rangeMod: number;       // ATT delta from weapon range at current distance
  feintBonus: number;     // ATT bonus for feinter on success
  commitLevel: CommitLevel;
  attBonus: number;       // net ATT modifier from Commit
  defPenalty: number;     // net DEF modifier from Commit
  events: CombatEvent[];  // accumulates across all sub-phases
}
```

`resolveExchange` initialises this to zeroes, passes it through each sub-phase, then merges `events` into the main event list before returning.

### 4.2 Sub-phase 1 — Approach

1. Run distance contest (Section 3.4)
2. Write `rangeMod` to `ExchangeState`
3. Run zone transition check (Section 5.3)
4. Emit any `RANGE_SHIFT` and `ZONE_SHIFT` events

### 4.3 Sub-phase 2 — Feint

**Trigger conditions (all must hold):**
- Attacker `WT ≥ 15`
- `plan.feintTendency > 0`
- Current OE ≥ 4

**Roll:**
```
feintRoll = attacker.WT + feintTendency − defender.AL − defender.WT × 0.5
```
Success when `feintRoll > 0`.

| Outcome | Effect |
|---------|--------|
| Success | `feintBonus = +4`, emit `FEINT_SUCCESS` |
| Failure | No bonus, +1 endurance drain on attacker, emit `FEINT_FAIL` |
| Not triggered | No-op |

### 4.4 Sub-phase 3 — Commit

Determines exposure level from OE and fight state. Sets `attBonus` and `defPenalty` on `ExchangeState`. Emits `COMMIT` event.

| Level | Condition | ATT | DEF | Recovery Debt Written |
|-------|-----------|-----|-----|-----------------------|
| Cautious | OE ≤ 3 or HP < 30% | −2 | +2 | 0 |
| Standard | OE 4–6 | 0 | 0 | 0 |
| Full | OE ≥ 7 or momentum ≥ 2 | +3 | −3 | 2 |

Recovery debt is written to the **attacker's** `FighterState.recoveryDebt` after Resolution. Debt is set, not stacked: `recoveryDebt = Math.max(existing, written)`.

### 4.5 Sub-phase 4 — Resolution

Existing `performAttackCheck`, `performDefenseCheck`, `executeHit`, and `executeRiposte` logic runs here. Two additional modifier arguments are injected from `ExchangeState`:

```
extraAttBonus  = rangeMod + feintBonus + attBonus
extraDefPenalty = defPenalty
```

These are summed with existing modifier inputs at the call sites — the same pattern as trainer and psych mods today. No internal logic inside these functions changes.

### 4.6 Sub-phase 5 — Recovery

After Resolution:

1. Decrement both fighters' `recoveryDebt` by 1 (floor 0)
2. If the attacker was riposted this exchange: `attacker.recoveryDebt = Math.max(debt, 1)` (the initiator is caught on the counter)
3. If feint failed: `attacker.recoveryDebt = Math.max(debt, 1)`
4. Merge all `ExchangeState.events` into the main event list

### 4.7 New FighterState Field

```ts
recoveryDebt: number; // 0–3, initialised to 0
```

`recoveryDebt` is capped at 3: `recoveryDebt = Math.min(3, Math.max(existing, written))`. Values above 3 provide no additional penalty — the fighter is already maximally compromised.

### 4.8 New FightPlan Fields

```ts
feintTendency?: number;          // 0–10. 0 = never feint (default). Requires WT ≥ 15 to activate.
rangePreference?: DistanceRange; // overrides weapon-derived preferred range for distance contest
```

---

## 5. Spatial / Arena System

### 5.1 Zone Type

```ts
export type ArenaZone = "Center" | "Edge" | "Corner" | "Obstacle";
```

Zone state lives on `ResolutionContext` alongside `range`. Starts at `arenaConfig.startingZone` (almost always `"Center"`).

### 5.2 Zone DEF Modifiers

Applied as a flat DEF penalty to the pushed fighter during Resolution.

```ts
const ZONE_DEF_MODS: Record<ArenaZone, number> = {
  Center:   0,
  Edge:     -2,
  Corner:   -4,
  Obstacle:  0,  // future: cover blocks ranged/thrown weapons
};
```

Only the fighter who occupies the non-Center zone takes the penalty. Zone ownership is tracked by `actor` on the most recent `ZONE_SHIFT` event.

### 5.3 Zone Transitions

Evaluated in the Approach sub-phase after range is resolved. The fighter who **lost** the distance contest this exchange is the candidate for a zone push.

| Condition | Transition | Default Probability |
|-----------|------------|---------------------|
| Range = Extended, distance contest loser's HP dropped this exchange, `hasEdges` | Center → Edge | 20% |
| Zone = Edge, range = Extended, distance contest lost again, `hasCorners` | Edge → Corner | 15% |
| Zone = Edge or Corner, distance contest won by the pushed fighter | toward Center (one step) | 40% |
| Zone = Obstacle (arena `hasObstacles`, range = Tight) | Enter Obstacle | 10% |

All probabilities are overridable via `arenaConfig.zoneTransitionOverrides`.

Transition emits `ZONE_SHIFT` event: `{ actor: pushedFighter, metadata: { from, to } }`.

### 5.4 Arena Config

```ts
export interface ArenaConfig {
  id: string;
  name: string;
  description: string;
  tier: "Training" | "Standard" | "Championship" | "Grand";
  surface: "Sand" | "Stone" | "Mud" | "Wood" | "Grass";
  startingRange: DistanceRange;
  startingZone: ArenaZone;
  hasEdges: boolean;
  hasCorners: boolean;
  hasObstacles: boolean;
  flavorText?: string;

  // ── Extensibility hooks ──────────────────────────────────────────────────
  tags?: ArenaTag[];
  weatherExposure?: number;                              // 0–1. 0 = enclosed, 1 = fully open
  weatherModifiers?: Partial<Record<WeatherType, ArenaWeatherMod>>;
  zoneTransitionOverrides?: Partial<ZoneTransitionTable>;
  surfaceModifiers?: SurfaceMod;
}

export type ArenaTag =
  | "outdoor" | "indoor" | "underground"
  | "ceremonial" | "seasonal" | "tournament-legal"
  | "gladiatorial" | "execution" | "training";

export interface ArenaWeatherMod {
  edgePushChanceBonus?: number;   // additive on zone push probability
  rangeShiftBonus?: number;       // +/- on distance contest roll
  surfaceSlip?: number;           // flat DEF penalty to both fighters
}

export interface ZoneTransitionTable {
  centerToEdgeChance: number;     // default 0.20
  edgeToCornerChance: number;     // default 0.15
  recoveryChance: number;         // default 0.40
  obstacleEntryChance: number;    // default 0.10
}

export interface SurfaceMod {
  iniMod?: number;                // e.g. Mud: −2 INI both fighters
  enduranceMult?: number;         // e.g. Stone: 1.05× fatigue
  riposteMod?: number;            // e.g. Mud: +3 riposte (slipping = openings)
}
```

### 5.5 Arena Registry

All arena operations go through the registry. The engine never imports arena configs directly.

```ts
// src/data/arenas.ts

const ARENA_REGISTRY = new Map<string, ArenaConfig>();

export function registerArena(config: ArenaConfig): void {
  ARENA_REGISTRY.set(config.id, config);
}

export function getArenaById(id: string): ArenaConfig {
  return ARENA_REGISTRY.get(id) ?? ARENA_REGISTRY.get("standard_arena")!;
}

export function getAllArenas(): ArenaConfig[] {
  return Array.from(ARENA_REGISTRY.values());
}

export function getArenasByTag(tag: ArenaTag): ArenaConfig[] {
  return getAllArenas().filter(a => a.tags?.includes(tag));
}

export function getArenasByTier(tier: ArenaConfig["tier"]): ArenaConfig[] {
  return getAllArenas().filter(a => a.tier === tier);
}
```

The four seed arenas are registered at module load. Any future arena — seasonal event, unlockable, procedurally generated — calls `registerArena` at startup or on unlock. The engine only ever calls `getArenaById`.

### 5.6 Seed Arenas

| id | Name | Tier | Surface | Start Range | Edges | Corners | Obstacles | Tags | Weather Exposure |
|----|------|------|---------|-------------|-------|---------|-----------|------|-----------------|
| `training_pit` | The Pit | Training | Sand | Tight | No | No | No | training | 0.3 |
| `standard_arena` | The Arena | Standard | Sand | Striking | Yes | Yes | No | outdoor, tournament-legal | 0.8 |
| `championship_arena` | The Grand Sand | Championship | Stone | Striking | Yes | Yes | No | outdoor, tournament-legal, ceremonial | 0.9 |
| `grand_colosseum` | The Colosseum | Grand | Stone | Striking | Yes | Yes | Yes | outdoor, tournament-legal, ceremonial, gladiatorial | 1.0 |

`standard_arena` is the default when no arena is specified. Its behaviour matches current implicit assumptions — Striking start, standard zone probabilities, no surface modifiers.

**Example custom arena:**
```ts
registerArena({
  id: "mud_pits",
  name: "The Mud Pits",
  tier: "Standard",
  surface: "Mud",
  startingRange: "Tight",
  hasEdges: true, hasCorners: false, hasObstacles: false,
  tags: ["outdoor", "gladiatorial"],
  weatherExposure: 1.0,
  surfaceModifiers: { iniMod: -2, riposteMod: +3 },
  weatherModifiers: {
    Rainy: { surfaceSlip: -2, edgePushChanceBonus: 0.10 },
  },
  zoneTransitionOverrides: { centerToEdgeChance: 0.30 },
});
```

### 5.7 Wiring into the Game

**`simulateFight` signature addition:**
```ts
export function simulateFight(
  planA: FightPlan,
  planD: FightPlan,
  warriorA?: Warrior,
  warriorD?: Warrior,
  providedRng?: (() => number) | number,
  trainers?: Trainer[],
  weather: WeatherType = "Clear",
  arenaConfig?: ArenaConfig           // NEW — defaults to standard_arena
): FightOutcome
```

**`ResolutionContext` additions:**
```ts
range: DistanceRange;        // initialised from arenaConfig.startingRange
zone: ArenaZone;             // initialised from arenaConfig.startingZone
arenaConfig: ArenaConfig;    // full config for zone transition lookups
```

**`boutProcessorService` resolution:**
```ts
const arenaId = bout.arenaId ?? state.activeArenaId ?? "standard_arena";
const arenaConfig = getArenaById(arenaId);
simulateFight(..., arenaConfig);
```

**`GameState` additions:**
```ts
arenas: ArenaConfig[];       // populated from getAllArenas() at game init
activeArenaId?: string;      // which arena is currently active for bouts
```

**`BoutOffer` addition:**
```ts
arenaId?: string;            // optional per-bout arena override
```

---

## 6. Narrative Layer

### 6.1 New Functions in `narrativePBP.ts`

```ts
// "Gornt presses in tight, cutting off Isolde's reach."
rangeShiftLine(rng: RNG, moverName: string, from: DistanceRange, to: DistanceRange): string

// "Gornt feints low — Isolde commits too early."
feintSuccessLine(rng: RNG, attackerName: string, defenderName: string): string

// "Gornt's feint is read immediately."
feintFailLine(rng: RNG, attackerName: string): string

// "Isolde is forced back toward the wall."
zoneShiftLine(rng: RNG, pushedName: string, zone: ArenaZone): string

// "Gornt throws everything into the attack." (Full commit only)
commitLine(rng: RNG, attackerName: string): string

// "Gornt is badly overextended." (debt ≥ 2 written)
overextendedLine(rng: RNG, fighterName: string): string

// "The fighters take the stone floor of THE GRAND SAND. The walls are close."
arenaIntroLine(arena: ArenaConfig): string  // emitted at minute 0, non-default arenas only
```

### 6.2 Emit Rules

| Function | Trigger | Frequency |
|----------|---------|-----------|
| `rangeShiftLine` | `RANGE_SHIFT` event | Every shift |
| `feintSuccessLine` | `FEINT_SUCCESS` event | Every occurrence |
| `feintFailLine` | `FEINT_FAIL` event | Every occurrence |
| `zoneShiftLine` | `ZONE_SHIFT` event | Every shift |
| `commitLine` | `COMMIT` event, level = Full | Every Full commit |
| `overextendedLine` | Recovery, debt written ≥ 2 | Once per debt write |
| `arenaIntroLine` | `minute: 0`, `arenaId !== "standard_arena"` | Once per fight |

### 6.3 New Template Paths in `narrativeContent.json`

```json
{
  "pbp": {
    "range_shift": {
      "closing": ["(authored — e.g. '%A presses in tight, cutting off %D's reach.')"],
      "opening": ["(authored — e.g. '%A dances back, creating distance.')"]
    },
    "feints": {
      "success": ["(authored — e.g. '%A feints low — %D commits too early.')"],
      "fail":    ["(authored — e.g. '%A's feint is read immediately.')"]
    },
    "zone": {
      "edge_push":   ["(authored — e.g. '%A is forced back toward the wall.')"],
      "corner_push": ["(authored — e.g. '%A is trapped in the corner with nowhere to retreat.')"],
      "recovery":    ["(authored — e.g. '%A fights back to the centre.')"]
    },
    "commit":       ["(authored — e.g. '%A throws everything into the attack.')"],
    "overextended": ["(authored — e.g. '%A is badly overextended.')"]
  }
}
```

`closing` vs `opening` in `range_shift` distinguishes fighters moving toward Grapple from fighters creating space toward Extended. Token substitution uses the existing `%A` / `%D` convention. Each array should contain 3–6 variants for variety. Template authoring is a separate task from engine implementation.

---

## 7. Testing Strategy

### 7.1 `src/test/distance.test.ts` — New File

**Distance contest**
- Fighter with higher reachScore shifts range one step toward preferred
- Tie leaves range unchanged
- Range cannot shift below Grapple or above Extended
- motivationBonus (+3) fires when two or more steps from preferred range
- recoveryDebt reduces Approach roll by 2 per point

**Weapon range modifiers**
- `getWeaponRangeMod` returns correct ATT delta for each weapon/range combination
- Long spear: +4 at Extended, −8 at Grapple
- Dagger: +4 at Grapple, −6 at Extended
- Broadsword: +2 at Striking, −2 at Grapple (baseline weapon)

**Zone transitions**
- `centerToEdge` fires at correct probability given `arena.hasEdges`
- `edgeToCorner` fires at correct probability given `arena.hasCorners`
- Zone push does not fire when `arena.hasEdges = false` (training_pit)
- `zoneTransitionOverrides` partial merge leaves unspecified fields at defaults

**Feint sub-phase**
- Feint not triggered when `feintTendency = 0`
- Feint not triggered when `WT < 15`
- Feint success sets `feintBonus = +4` on `ExchangeState`
- Feint failure sets no bonus and costs +1 endurance

**Commit sub-phase**
- Full commit writes `recoveryDebt = 2` to attacker
- Cautious commit writes `recoveryDebt = 0`
- Existing debt is not stacked — `max(existing, written)`
- Recovery decays debt by 1 per exchange, floor 0

**Arena registry**
- `getArenaById` returns `standard_arena` as fallback for unknown id
- `registerArena` adds arena to registry, retrievable by id
- `getArenasByTag` filters correctly
- Partial `zoneTransitionOverrides` merge leaves unspecified fields at defaults

### 7.2 `src/test/balance.test.ts` — Additions

The existing 10k-fight style matrix test must still pass: no style > 65% win rate, no style < 35%, kill rate 8–12%. The distance system is active in all these fights via the default `standard_arena`.

**Weapon range differentiation**
- Long spear vs dagger: long spear win rate > 60% at default Striking start
- Long spear vs dagger: win rate drops below 55% when starting range = Tight (training_pit)
- Dagger warrior win rate in training_pit > dagger warrior win rate in standard_arena

**Arena surface modifiers**
- Mud surface applies −2 INI to both fighters (verified via average initiative wins)
- Stone `enduranceMult = 1.05` produces measurably shorter fight durations at equal OE vs Sand baseline

**Feinting**
- Warrior with WT = 17, `feintTendency = 8` lands statistically more first-exchange hits than identical warrior with `feintTendency = 0` over 500 fights

**Style balance regression**
- All existing style win-rate assertions still pass after spatial system is enabled

### 7.3 Integration Smoke Tests

- `simulateFight` with `arenaConfig = grand_colosseum` completes without throw
- `simulateFight` with `arenaConfig = training_pit` produces fights where range never reaches Extended (starting Tight, no Extended weapons in test loadout)
- `FightOutcome.log` contains at least one `RANGE_SHIFT` narrative line in a 200-fight sample
- `FightOutcome.log` contains at least one `ZONE_SHIFT` narrative line in `standard_arena` over 500 fights
- `arenaIntroLine` is present in log for non-default arena
- Balance suite runtime stays under 10 seconds (performance gate)

---

## 8. Future Features

These are explicitly **not in scope** for this implementation. They are designed for — the data model and zone state machine support them — but the triggering logic and outcome handling are deferred.

### 8.1 Ring-Outs

When a fighter at `zone: "Edge"` or `zone: "Corner"` takes a hit above a damage threshold, a ring-out roll occurs. On success the fight ends with a new `FightOutcomeBy` value `"RingOut"`. Requires:
- Adding `"RingOut"` to `FightOutcomeBy` union
- New narrative templates under `conclusions.RingOut`
- `injuryHandler` consideration (ring-out landing injury)
- Balance suite update for new outcome type

### 8.2 Corner Pin

When a fighter at `zone: "Corner"` loses the distance contest, the `retreat` step in Approach is skipped — range cannot improve that exchange. The pinned fighter cannot move range toward their preferred zone regardless of contest outcome. Requires:
- A `pinned: boolean` flag on `FighterState`
- Approach sub-phase pin check before contest resolution
- Narrative line for pin state entry and escape

### 8.3 Obstacle Cover

When a fighter enters `zone: "Obstacle"`, thrown and ranged weapon attacks against them miss automatically. Melee attacks are unaffected. Requires defining thrown/ranged weapon subtypes in `EquipmentItem`.

### 8.4 Weather-Zone Interactions

Gale weather pushing fighters toward edges; Blood Moon suppressing zone recovery rolls. The `ArenaWeatherMod` interface is already defined and wired — these are authored data changes, not engine changes.

### 8.5 Arena Unlocks

Arenas gated behind progression milestones (fame threshold, season ranking, career wins). Requires a `unlockCondition` field on `ArenaConfig` and evaluation logic in the progression pipeline.

---

## 9. Open Questions / Known Risks

| Risk | Mitigation |
|------|-----------|
| Range modifiers shift existing style balance | Balance suite must pass before merge; tune modifier magnitudes if needed |
| Phase-Within-Exchange adds ~5× sub-calls to hot path | Profile against 10-second performance gate; flatten if needed |
| `resolveExchange` restructure is the highest-risk change | Wrap existing logic without touching internals; validate with full fight log comparison against pre-change baseline |
| Weapon range table values are design estimates | Treat as v1 starting point; tune after balance suite results |
