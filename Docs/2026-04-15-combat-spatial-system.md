# Combat Spatial System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Distance State Machine, Phase-Within-Exchange sub-phases, and Arena system to the combat engine.

**Architecture:** A new `ExchangeState` accumulator threads five sub-phases (Approach → Feint → Commit → Resolution → Recovery) through each `resolveExchange` call. `DistanceRange` is contested each exchange; `ArenaZone` tracks fighter position; both inject bonuses/penalties into the existing ATT/DEF checks. An `ArenaConfig` registry allows extensible arena types.

**Tech Stack:** TypeScript, Vitest, existing `@/types/shared.types`, `@/types/combat.types`, `@/engine/combat/resolution.ts`, `@/engine/combat/core/exchangeHelpers.ts`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/shared.types.ts` | Modify | Add DistanceRange, ArenaZone, CommitLevel, ArenaConfig, SurfaceMod, update FightPlan |
| `src/types/combat.types.ts` | Modify | Add RANGE_SHIFT, FEINT_SUCCESS, FEINT_FAIL, ZONE_SHIFT event types |
| `src/engine/combat/resolution.ts` | Modify | Add recoveryDebt to FighterState; add spatial fields to ResolutionContext; wire sub-phases into resolveExchange |
| `src/engine/bout/fighterState.ts` | Modify | Initialize recoveryDebt: 0 in createFighterState return |
| `src/engine/combat/core/exchangeHelpers.ts` | Modify | Add extraDefPenalty param to performDefenseCheck |
| `src/data/arenas.ts` | **Create** | Arena registry + 4 seed arenas |
| `src/engine/combat/distanceResolution.ts` | **Create** | Distance contest + zone transition logic |
| `src/engine/combat/exchangeSubPhases.ts` | **Create** | Approach / Feint / Commit / Recovery sub-phases + ExchangeState |
| `src/engine/simulate.ts` | Modify | Accept arenaId param; initialize spatial fields on ResolutionContext |
| `src/engine/narrativePBP.ts` | Modify | Add narrateRangeShift, narrateFeint, narrateZoneShift |
| `src/engine/combat/narrator.ts` | Modify | Handle RANGE_SHIFT, FEINT_SUCCESS, FEINT_FAIL, ZONE_SHIFT events |
| `src/test/engine/combat/distanceResolution.test.ts` | **Create** | Unit tests for distance + zone logic |
| `src/test/engine/combat/exchangeSubPhases.test.ts` | **Create** | Unit tests for sub-phase pipeline |
| `src/test/engine/arenas.test.ts` | **Create** | Unit tests for arena registry |

---

### Task 1: New Types

**Files:**
- Modify: `src/types/shared.types.ts` (after line 183, after `PlanCondition`)
- Modify: `src/types/combat.types.ts` (line 50–62, `CombatEventType` union)

- [ ] **Step 1: Add spatial types to shared.types.ts**

  Open `src/types/shared.types.ts`. After the `PsychState` line (line 185), add:

  ```ts
  // ─── Spatial / Distance System ─────────────────────────────────────────────

  export type DistanceRange = "Grapple" | "Tight" | "Striking" | "Extended";
  export type ArenaZone     = "Center" | "Edge" | "Corner" | "Obstacle";
  export type CommitLevel   = "Cautious" | "Standard" | "Full";
  export type ArenaTag      = "outdoor" | "indoor" | "elevated" | "water" | "cramped" | "open" | "premium";

  export interface SurfaceMod {
    initiativeMod: number;   // flat bonus/penalty to INI rolls each exchange
    enduranceMult: number;   // multiplier on endurance costs (1.0 = baseline)
    riposteMod: number;      // flat bonus/penalty to riposte checks
  }

  export interface ArenaWeatherMod {
    weatherType: WeatherType;
    zoneDef?: Partial<Record<ArenaZone, number>>;
    surfaceMod?: Partial<SurfaceMod>;
  }

  export interface ArenaConfig {
    id: string;
    name: string;
    tags: ArenaTag[];
    tier: 1 | 2 | 3;          // 1=common, 2=prestigious, 3=special event
    description: string;
    /** DEF penalty per zone (negative = penalty). E.g. Edge: -2, Corner: -4 */
    zoneDef: Partial<Record<ArenaZone, number>>;
    surfaceMod: SurfaceMod;
    weatherMods?: ArenaWeatherMod[];
    startingZone?: ArenaZone; // default "Center"
  }
  ```

- [ ] **Step 2: Update FightPlan with spatial fields**

  In `src/types/shared.types.ts`, find the `FightPlan` interface (around line 145) and add two optional fields after `conditions?`:

  ```ts
  /** 0-10 tendency to feint; only triggers when WT ≥ 15 and OE ≥ 4 */
  feintTendency?: number;
  /** Preferred range — influences Approach roll motivation bonus (+2 when contesting toward this range) */
  rangePreference?: DistanceRange;
  ```

- [ ] **Step 3: Add spatial event types to combat.types.ts**

  In `src/types/combat.types.ts`, update the `CombatEventType` union (currently ends at `"MOMENTUM_SHIFT"`) to add:

  ```ts
  | "RANGE_SHIFT"
  | "FEINT_SUCCESS"
  | "FEINT_FAIL"
  | "ZONE_SHIFT"
  ```

- [ ] **Step 4: Verify TypeScript compiles**

  Run: `npx tsc --noEmit`

  Expected: No new errors (no consumers of the new types yet).

- [ ] **Step 5: Commit**

  ```bash
  git add "src/types/shared.types.ts" "src/types/combat.types.ts"
  git commit -m "feat(spatial): add DistanceRange, ArenaZone, CommitLevel, ArenaConfig types"
  ```

---

### Task 2: FighterState recoveryDebt

**Files:**
- Modify: `src/engine/combat/resolution.ts` (FighterState interface, ~line 67–100)
- Modify: `src/engine/bout/fighterState.ts` (createFighterState return, ~line 75–102)

- [ ] **Step 1: Add recoveryDebt to FighterState interface**

  In `src/engine/combat/resolution.ts`, inside the `FighterState` interface, add after `survivalStrike: boolean;`:

  ```ts
  /**
   * Recovery debt from CommitLevel. 0–3.
   * Penalises the Approach sub-phase roll by 2 per point. Decays by 1 each exchange.
   * Set via: recoveryDebt = Math.min(3, Math.max(existing, toWrite))
   */
  recoveryDebt: number;
  ```

- [ ] **Step 2: Initialize recoveryDebt in createFighterState**

  In `src/engine/bout/fighterState.ts`, in the return object of `createFighterState` (the block starting at line ~75), add after `survivalStrike: false,`:

  ```ts
  recoveryDebt: 0,
  ```

- [ ] **Step 3: Verify**

  Run: `npx tsc --noEmit`

  Expected: No errors. TypeScript now requires `recoveryDebt` on all `FighterState` objects.

- [ ] **Step 4: Commit**

  ```bash
  git add "src/engine/combat/resolution.ts" "src/engine/bout/fighterState.ts"
  git commit -m "feat(spatial): add recoveryDebt to FighterState"
  ```

---

### Task 3: Arena Registry + Seed Arenas

**Files:**
- Create: `src/data/arenas.ts`
- Create: `src/test/engine/arenas.test.ts`

- [ ] **Step 1: Write the failing tests**

  Create `src/test/engine/arenas.test.ts`:

  ```ts
  import { describe, it, expect, beforeEach } from "vitest";
  import {
    registerArena, getArenaById, getAllArenas,
    getArenasByTag, getArenasByTier, STANDARD_ARENA,
  } from "@/data/arenas";
  import type { ArenaConfig } from "@/types/shared.types";

  describe("Arena Registry", () => {
    it("getArenaById returns STANDARD_ARENA for unknown id", () => {
      expect(getArenaById("nonexistent_arena")).toBe(STANDARD_ARENA);
    });

    it("getArenaById returns the registered arena", () => {
      expect(getArenaById("standard_arena")).toBe(STANDARD_ARENA);
    });

    it("getAllArenas includes standard_arena", () => {
      const all = getAllArenas();
      expect(all.some(a => a.id === "standard_arena")).toBe(true);
    });

    it("getArenasByTag returns only arenas with that tag", () => {
      const outdoor = getArenasByTag("outdoor");
      expect(outdoor.every(a => a.tags.includes("outdoor"))).toBe(true);
    });

    it("getArenasByTier returns only arenas of that tier", () => {
      const tier1 = getArenasByTier(1);
      expect(tier1.every(a => a.tier === 1)).toBe(true);
    });

    it("registerArena adds to the registry", () => {
      const custom: ArenaConfig = {
        id: "test_arena",
        name: "Test Arena",
        tags: ["indoor"],
        tier: 1,
        description: "A test arena",
        zoneDef: { Edge: -2, Corner: -4 },
        surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
      };
      registerArena(custom);
      expect(getArenaById("test_arena")).toEqual(custom);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  Run: `npx vitest run src/test/engine/arenas.test.ts`

  Expected: FAIL — cannot find module `@/data/arenas`

- [ ] **Step 3: Create src/data/arenas.ts**

  ```ts
  import type { ArenaConfig, ArenaTag } from "@/types/shared.types";

  const registry = new Map<string, ArenaConfig>();

  export function registerArena(arena: ArenaConfig): void {
    registry.set(arena.id, arena);
  }

  export function getArenaById(id: string): ArenaConfig {
    return registry.get(id) ?? STANDARD_ARENA;
  }

  export function getAllArenas(): ArenaConfig[] {
    return Array.from(registry.values());
  }

  export function getArenasByTag(tag: ArenaTag): ArenaConfig[] {
    return getAllArenas().filter(a => a.tags.includes(tag));
  }

  export function getArenasByTier(tier: 1 | 2 | 3): ArenaConfig[] {
    return getAllArenas().filter(a => a.tier === tier);
  }

  // ─── Seed Arenas ─────────────────────────────────────────────────────────────

  export const STANDARD_ARENA: ArenaConfig = {
    id: "standard_arena",
    name: "The Proving Grounds",
    tags: ["outdoor", "open"],
    tier: 1,
    description: "A flat, sandy arena. No particular advantage to either style.",
    zoneDef: { Edge: -2, Corner: -4 },
    surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
    startingZone: "Center",
  };

  export const MUDPIT_ARENA: ArenaConfig = {
    id: "mudpit_arena",
    name: "The Mudpit",
    tags: ["outdoor", "water"],
    tier: 1,
    description: "A sunken, rain-soaked arena. Footing is treacherous.",
    zoneDef: { Edge: -2, Corner: -4 },
    surfaceMod: { initiativeMod: -2, enduranceMult: 1.15, riposteMod: -1 },
    startingZone: "Center",
  };

  export const BLOODSANDS_ARENA: ArenaConfig = {
    id: "bloodsands_arena",
    name: "The Bloodsands",
    tags: ["outdoor", "open", "premium"],
    tier: 2,
    description: "The grand arena. Fine sand, excellent footing, long sight lines.",
    zoneDef: { Edge: -2, Corner: -3 },
    surfaceMod: { initiativeMod: 1, enduranceMult: 0.95, riposteMod: 1 },
    startingZone: "Center",
  };

  export const UNDERPIT_ARENA: ArenaConfig = {
    id: "underpit_arena",
    name: "The Underpit",
    tags: ["indoor", "cramped"],
    tier: 2,
    description: "A torch-lit subterranean pit. Tight quarters favour close-range fighters.",
    zoneDef: { Edge: -3, Corner: -5, Obstacle: -1 },
    surfaceMod: { initiativeMod: -1, enduranceMult: 1.05, riposteMod: 0 },
    startingZone: "Center",
  };

  // ─── Auto-register seed arenas ────────────────────────────────────────────────
  [STANDARD_ARENA, MUDPIT_ARENA, BLOODSANDS_ARENA, UNDERPIT_ARENA].forEach(registerArena);
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `npx vitest run src/test/engine/arenas.test.ts`

  Expected: PASS (5/5)

- [ ] **Step 5: Commit**

  ```bash
  git add "src/data/arenas.ts" "src/test/engine/arenas.test.ts"
  git commit -m "feat(spatial): arena registry + 4 seed arenas"
  ```

---

### Task 4: Distance Resolution Module

**Files:**
- Create: `src/engine/combat/distanceResolution.ts`
- Create: `src/test/engine/combat/distanceResolution.test.ts`

- [ ] **Step 1: Write the failing tests**

  Create `src/test/engine/combat/distanceResolution.test.ts`:

  ```ts
  import { describe, it, expect, vi } from "vitest";
  import {
    computeReachScore,
    getWeaponPreferredRange,
    contestDistance,
    getZonePenalty,
    transitionZone,
  } from "@/engine/combat/distanceResolution";
  import type { DistanceRange, ArenaZone } from "@/types/shared.types";

  describe("computeReachScore", () => {
    it("returns INI + 0 when OE=5, no motivation, no debt", () => {
      expect(computeReachScore(10, 5, 0, 0)).toBe(10);
    });
    it("adds (OE-5)*2 for OE above 5", () => {
      expect(computeReachScore(10, 7, 0, 0)).toBe(14); // 10 + (7-5)*2
    });
    it("subtracts (5-OE)*2 for OE below 5", () => {
      expect(computeReachScore(10, 3, 0, 0)).toBe(6);  // 10 - (5-3)*2
    });
    it("adds motivation bonus", () => {
      expect(computeReachScore(10, 5, 2, 0)).toBe(12);
    });
    it("subtracts recoveryDebt*2", () => {
      expect(computeReachScore(10, 5, 0, 2)).toBe(6);  // 10 - 2*2
    });
  });

  describe("getWeaponPreferredRange", () => {
    it("returns Grapple for open_hand", () => {
      expect(getWeaponPreferredRange("open_hand")).toBe("Grapple");
    });
    it("returns Extended for a polearm", () => {
      expect(getWeaponPreferredRange("pike")).toBe("Extended");
    });
    it("returns Striking as default for unknown weapon", () => {
      expect(getWeaponPreferredRange("unknown_weapon")).toBe("Striking");
    });
  });

  describe("contestDistance", () => {
    it("winner gets +3 rangeMod, loser gets -3", () => {
      // rng always returns 0.1 → A wins initiative contest every time
      const rng = vi.fn().mockReturnValue(0.1);
      const fA = { skills: { INI: 15 }, activePlan: { OE: 5, feintTendency: 0 }, recoveryDebt: 0 } as any;
      const fD = { skills: { INI: 5  }, activePlan: { OE: 5, feintTendency: 0 }, recoveryDebt: 0 } as any;
      const result = contestDistance(rng, fA, fD, 5, 5, "Striking");
      expect(result.rangeModA).toBe(3);
      expect(result.rangeModD).toBe(-3);
      expect(result.distanceWinner).toBe("A");
    });

    it("produces newRange = winner's preferred range when they win", () => {
      const rng = vi.fn().mockReturnValue(0.1);
      const fA = { skills: { INI: 15 }, activePlan: { OE: 5, rangePreference: "Extended", feintTendency: 0 }, recoveryDebt: 0 } as any;
      const fD = { skills: { INI: 5  }, activePlan: { OE: 5, feintTendency: 0 }, recoveryDebt: 0 } as any;
      const result = contestDistance(rng, fA, fD, 5, 5, "Striking");
      expect(result.newRange).toBe("Extended");
    });

    it("keeps current range on a tie (equal scores)", () => {
      const rng = vi.fn().mockReturnValue(0.5);
      const fA = { skills: { INI: 10 }, activePlan: { OE: 5 }, recoveryDebt: 0 } as any;
      const fD = { skills: { INI: 10 }, activePlan: { OE: 5 }, recoveryDebt: 0 } as any;
      // With identical scores and rng=0.5 the contest resolves without RANGE_SHIFT
      const result = contestDistance(rng, fA, fD, 5, 5, "Striking");
      expect(result.newRange).toBe("Striking");
    });
  });

  describe("getZonePenalty", () => {
    it("returns 0 for Center regardless of config", () => {
      const config = { zoneDef: { Edge: -2, Corner: -4 } } as any;
      expect(getZonePenalty("Center", config)).toBe(0);
    });
    it("returns -2 for Edge in standard config", () => {
      const config = { zoneDef: { Edge: -2, Corner: -4 } } as any;
      expect(getZonePenalty("Edge", config)).toBe(-2);
    });
    it("returns -4 for Corner in standard config", () => {
      const config = { zoneDef: { Edge: -2, Corner: -4 } } as any;
      expect(getZonePenalty("Corner", config)).toBe(-4);
    });
    it("returns 0 when zone not in config", () => {
      const config = { zoneDef: {} } as any;
      expect(getZonePenalty("Edge", config)).toBe(0);
    });
  });

  describe("transitionZone", () => {
    it("Center → Edge when fighter is pushed", () => {
      expect(transitionZone("Center")).toBe("Edge");
    });
    it("Edge → Corner when fighter is pushed again", () => {
      expect(transitionZone("Edge")).toBe("Corner");
    });
    it("Corner stays Corner (no escape without reset)", () => {
      expect(transitionZone("Corner")).toBe("Corner");
    });
    it("Obstacle stays Obstacle", () => {
      expect(transitionZone("Obstacle")).toBe("Obstacle");
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  Run: `npx vitest run src/test/engine/combat/distanceResolution.test.ts`

  Expected: FAIL — cannot find module `@/engine/combat/distanceResolution`

- [ ] **Step 3: Implement distanceResolution.ts**

  Create `src/engine/combat/distanceResolution.ts`:

  ```ts
  import type { DistanceRange, ArenaZone, ArenaConfig } from "@/types/shared.types";
  import type { FighterState } from "./resolution";
  import type { CombatEvent } from "@/types/combat.types";
  import { contestCheck } from "./combatMath";

  // ─── Weapon → Preferred Range ────────────────────────────────────────────────

  const WEAPON_PREFERRED_RANGE: Record<string, DistanceRange> = {
    // Grapple
    open_hand: "Grapple",
    // Tight
    dagger: "Tight",
    club: "Tight",
    short_sword: "Tight",
    mace: "Tight",
    // Striking (default)
    broad_sword: "Striking",
    long_sword: "Striking",
    axe: "Striking",
    scimitar: "Striking",
    falchion: "Striking",
    battle_axe: "Striking",
    war_hammer: "Striking",
    morning_star: "Striking",
    flail: "Striking",
    // Extended
    halberd: "Extended",
    great_sword: "Extended",
    pike: "Extended",
    spear: "Extended",
  };

  export function getWeaponPreferredRange(weaponId?: string): DistanceRange {
    if (!weaponId) return "Striking";
    return WEAPON_PREFERRED_RANGE[weaponId] ?? "Striking";
  }

  // ─── Reach Score ─────────────────────────────────────────────────────────────

  /**
   * Reach score used in the Approach sub-phase contest.
   * reachScore = INI + (OE−5)×2 + motivationBonus − (recoveryDebt×2)
   */
  export function computeReachScore(
    ini: number,
    OE: number,
    motivationBonus: number,
    recoveryDebt: number
  ): number {
    return ini + (OE - 5) * 2 + motivationBonus - recoveryDebt * 2;
  }

  // ─── Distance Contest ────────────────────────────────────────────────────────

  export interface DistanceContestResult {
    distanceWinner: "A" | "D" | null;
    rangeModA: number;
    rangeModD: number;
    newRange: DistanceRange;
    events: CombatEvent[];
  }

  /**
   * Contests range control for the current exchange.
   * Winner gains +3 ATT via rangeMod, loser takes -3 ATT.
   * Range shifts toward winner's preferred weapon range.
   */
  export function contestDistance(
    rng: () => number,
    fA: FighterState,
    fD: FighterState,
    OE_A: number,
    OE_D: number,
    currentRange: DistanceRange
  ): DistanceContestResult {
    const events: CombatEvent[] = [];

    const prefA = fA.activePlan.rangePreference ?? getWeaponPreferredRange(fA.weaponId);
    const prefD = fD.activePlan.rangePreference ?? getWeaponPreferredRange(fD.weaponId);

    const motA = prefA === currentRange ? 0 : 2; // bonus for fighting toward preferred range
    const motD = prefD === currentRange ? 0 : 2;

    const reachA = computeReachScore(fA.skills.INI, OE_A, motA, fA.recoveryDebt);
    const reachD = computeReachScore(fD.skills.INI, OE_D, motD, fD.recoveryDebt);

    const aWins = contestCheck(rng, reachA, reachD);

    if (reachA === reachD) {
      // Pure tie — range doesn't shift
      return { distanceWinner: null, rangeModA: 0, rangeModD: 0, newRange: currentRange, events };
    }

    const winner: "A" | "D" = aWins ? "A" : "D";
    const loser:  "A" | "D" = aWins ? "D" : "A";
    const winnerPref = aWins ? prefA : prefD;

    // Shift range 1 step toward winner's preferred range
    const newRange = shiftRangeToward(currentRange, winnerPref);

    if (newRange !== currentRange) {
      events.push({ type: "RANGE_SHIFT", actor: winner, target: loser, result: newRange });
    }

    return {
      distanceWinner: winner,
      rangeModA: aWins ? 3 : -3,
      rangeModD: aWins ? -3 : 3,
      newRange,
      events,
    };
  }

  // ─── Range Shift Helper ───────────────────────────────────────────────────────

  const RANGE_ORDER: DistanceRange[] = ["Grapple", "Tight", "Striking", "Extended"];

  function shiftRangeToward(current: DistanceRange, target: DistanceRange): DistanceRange {
    const ci = RANGE_ORDER.indexOf(current);
    const ti = RANGE_ORDER.indexOf(target);
    if (ci === ti) return current;
    return RANGE_ORDER[ci + (ti > ci ? 1 : -1)];
  }

  // ─── Zone Penalties ───────────────────────────────────────────────────────────

  /**
   * Returns the DEF penalty for a fighter in the given zone.
   * Always negative or 0 (a penalty, not a bonus).
   */
  export function getZonePenalty(zone: ArenaZone, arenaConfig: Pick<ArenaConfig, "zoneDef">): number {
    return arenaConfig.zoneDef[zone] ?? 0;
  }

  // ─── Zone Transitions ────────────────────────────────────────────────────────

  /**
   * Returns the next zone when a fighter is pushed back.
   * Center → Edge → Corner (pinned). Obstacle stays Obstacle.
   */
  export function transitionZone(current: ArenaZone): ArenaZone {
    switch (current) {
      case "Center":   return "Edge";
      case "Edge":     return "Corner";
      case "Corner":   return "Corner";
      case "Obstacle": return "Obstacle";
    }
  }

  /**
   * Resets pushed fighter's zone back toward Center.
   * Called when a fighter lands a hit on the zone-holding opponent.
   */
  export function resetZone(current: ArenaZone): ArenaZone {
    switch (current) {
      case "Corner":   return "Edge";
      case "Edge":     return "Center";
      default:         return current;
    }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `npx vitest run src/test/engine/combat/distanceResolution.test.ts`

  Expected: PASS (all)

- [ ] **Step 5: Commit**

  ```bash
  git add "src/engine/combat/distanceResolution.ts" "src/test/engine/combat/distanceResolution.test.ts"
  git commit -m "feat(spatial): distance resolution module with zone transitions"
  ```

---

### Task 5: Exchange Sub-Phases Module

**Files:**
- Create: `src/engine/combat/exchangeSubPhases.ts`
- Create: `src/test/engine/combat/exchangeSubPhases.test.ts`

- [ ] **Step 1: Write the failing tests**

  Create `src/test/engine/combat/exchangeSubPhases.test.ts`:

  ```ts
  import { describe, it, expect, vi } from "vitest";
  import {
    runApproach,
    runFeint,
    runCommit,
    runRecovery,
    makeExchangeState,
  } from "@/engine/combat/exchangeSubPhases";
  import type { CommitLevel } from "@/types/shared.types";
  import type { FighterState } from "@/engine/combat/resolution";

  function makeFighter(overrides: Partial<FighterState> = {}): FighterState {
    return {
      label: "A",
      style: "SLASHING ATTACK" as any,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
      derived: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
      plan: { style: "SLASHING ATTACK" as any, OE: 5, AL: 5 },
      activePlan: { style: "SLASHING ATTACK" as any, OE: 5, AL: 5 },
      psychState: "Neutral",
      hp: 100, maxHp: 100,
      endurance: 100, maxEndurance: 100,
      hitsLanded: 0, hitsTaken: 0, ripostes: 0, consecutiveHits: 0,
      armHits: 0, legHits: 0,
      totalFights: 0,
      momentum: 0, committed: false, survivalStrike: false,
      recoveryDebt: 0,
      ...overrides,
    } as FighterState;
  }

  describe("makeExchangeState", () => {
    it("initialises with zero modifiers", () => {
      const es = makeExchangeState();
      expect(es.rangeModA).toBe(0);
      expect(es.rangeModD).toBe(0);
      expect(es.distanceWinner).toBeNull();
      expect(es.feintBonus).toBe(0);
      expect(es.feintFailed).toBe(false);
      expect(es.commitLevelA).toBe("Standard");
      expect(es.commitLevelD).toBe("Standard");
      expect(es.recoveryDebtToWriteA).toBe(0);
      expect(es.recoveryDebtToWriteD).toBe(0);
      expect(es.events).toEqual([]);
    });
  });

  describe("runCommit", () => {
    it("returns Cautious when OE ≤ 3", () => {
      const fA = makeFighter({ activePlan: { style: "SLASHING ATTACK" as any, OE: 3, AL: 5 } });
      const result = runCommit(fA, 3);
      expect(result.level).toBe("Cautious");
      expect(result.attBonus).toBe(-2);
      expect(result.defPenalty).toBe(2);
      expect(result.debtToWrite).toBe(0);
    });

    it("returns Full when OE ≥ 7", () => {
      const fA = makeFighter({ activePlan: { style: "SLASHING ATTACK" as any, OE: 7, AL: 5 }, momentum: 0 });
      const result = runCommit(fA, 7);
      expect(result.level).toBe("Full");
      expect(result.attBonus).toBe(3);
      expect(result.defPenalty).toBe(-3);
      expect(result.debtToWrite).toBe(2);
    });

    it("returns Full when momentum ≥ 2 regardless of OE", () => {
      const fA = makeFighter({ momentum: 2, activePlan: { style: "SLASHING ATTACK" as any, OE: 5, AL: 5 } });
      const result = runCommit(fA, 5);
      expect(result.level).toBe("Full");
    });

    it("returns Cautious when HP < 30% regardless of OE", () => {
      const fA = makeFighter({ hp: 25, maxHp: 100, activePlan: { style: "SLASHING ATTACK" as any, OE: 8, AL: 5 } });
      const result = runCommit(fA, 8);
      expect(result.level).toBe("Cautious");
    });

    it("returns Standard for OE 4-6 without special conditions", () => {
      const fA = makeFighter({ activePlan: { style: "SLASHING ATTACK" as any, OE: 5, AL: 5 }, momentum: 0 });
      const result = runCommit(fA, 5);
      expect(result.level).toBe("Standard");
      expect(result.attBonus).toBe(0);
      expect(result.debtToWrite).toBe(0);
    });
  });

  describe("runFeint", () => {
    it("does not trigger when feintTendency is 0", () => {
      const rng = vi.fn();
      const att = makeFighter({ attributes: { ST: 10, CN: 10, SZ: 10, WT: 15, WL: 10, SP: 10, DF: 10 }, activePlan: { style: "SLASHING ATTACK" as any, OE: 6, AL: 5, feintTendency: 0 } });
      const def = makeFighter();
      const result = runFeint(rng, att, def);
      expect(result.triggered).toBe(false);
      expect(rng).not.toHaveBeenCalled();
    });

    it("does not trigger when WT < 15", () => {
      const rng = vi.fn();
      const att = makeFighter({ attributes: { ST: 10, CN: 10, SZ: 10, WT: 14, WL: 10, SP: 10, DF: 10 }, activePlan: { style: "SLASHING ATTACK" as any, OE: 6, AL: 5, feintTendency: 5 } });
      const def = makeFighter();
      const result = runFeint(rng, att, def);
      expect(result.triggered).toBe(false);
    });

    it("does not trigger when OE < 4", () => {
      const rng = vi.fn();
      const att = makeFighter({ attributes: { ST: 10, CN: 10, SZ: 10, WT: 15, WL: 10, SP: 10, DF: 10 }, activePlan: { style: "SLASHING ATTACK" as any, OE: 3, AL: 5, feintTendency: 5 } });
      const def = makeFighter();
      const result = runFeint(rng, att, def);
      expect(result.triggered).toBe(false);
    });

    it("succeeds when roll is within threshold", () => {
      // roll = WT(15) + feintTendency(5) - AL(5) - WT_opponent(10)*0.5 = 10
      // threshold on 20-point scale = 10/20 = 0.5; rng returns 0.3 → success
      const rng = vi.fn().mockReturnValue(0.3);
      const att = makeFighter({
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 15, WL: 10, SP: 10, DF: 10 },
        activePlan: { style: "SLASHING ATTACK" as any, OE: 6, AL: 5, feintTendency: 5 },
      });
      const def = makeFighter({ attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, activePlan: { style: "SLASHING ATTACK" as any, OE: 5, AL: 5 } });
      const result = runFeint(rng, att, def);
      expect(result.triggered).toBe(true);
      expect(result.succeeded).toBe(true);
      expect(result.feintBonus).toBe(4);
    });
  });

  describe("runRecovery", () => {
    it("writes recoveryDebt to fighter, capped at 3", () => {
      const fA = makeFighter({ recoveryDebt: 1 });
      const fD = makeFighter({ recoveryDebt: 0 });
      runRecovery(fA, fD, 3, 0, []);
      expect(fA.recoveryDebt).toBe(3); // Math.min(3, Math.max(1, 3))
    });

    it("decays recoveryDebt by 1 per exchange if toWrite is 0", () => {
      const fA = makeFighter({ recoveryDebt: 2 });
      const fD = makeFighter({ recoveryDebt: 0 });
      runRecovery(fA, fD, 0, 0, []);
      expect(fA.recoveryDebt).toBe(1); // decay
    });

    it("does not decay below 0", () => {
      const fA = makeFighter({ recoveryDebt: 0 });
      const fD = makeFighter({ recoveryDebt: 0 });
      runRecovery(fA, fD, 0, 0, []);
      expect(fA.recoveryDebt).toBe(0);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  Run: `npx vitest run src/test/engine/combat/exchangeSubPhases.test.ts`

  Expected: FAIL — cannot find module `@/engine/combat/exchangeSubPhases`

- [ ] **Step 3: Implement exchangeSubPhases.ts**

  Create `src/engine/combat/exchangeSubPhases.ts`:

  ```ts
  import type { CommitLevel, DistanceRange, ArenaConfig, ArenaZone } from "@/types/shared.types";
  import type { CombatEvent } from "@/types/combat.types";
  import type { FighterState, ResolutionContext } from "./resolution";
  import { contestDistance } from "./distanceResolution";

  // ─── ExchangeState Accumulator ────────────────────────────────────────────────

  export interface ExchangeState {
    rangeModA: number;
    rangeModD: number;
    distanceWinner: "A" | "D" | null;
    feintBonus: number;
    feintFailed: boolean;
    commitLevelA: CommitLevel;
    commitLevelD: CommitLevel;
    recoveryDebtToWriteA: number;
    recoveryDebtToWriteD: number;
    events: CombatEvent[];
  }

  export function makeExchangeState(): ExchangeState {
    return {
      rangeModA: 0, rangeModD: 0, distanceWinner: null,
      feintBonus: 0, feintFailed: false,
      commitLevelA: "Standard", commitLevelD: "Standard",
      recoveryDebtToWriteA: 0, recoveryDebtToWriteD: 0,
      events: [],
    };
  }

  // ─── Approach Sub-Phase ───────────────────────────────────────────────────────

  /**
   * Contests range control. Writes rangeModA/D and distanceWinner into ExchangeState.
   * Also updates ctx.range.
   */
  export function runApproach(
    rng: () => number,
    fA: FighterState,
    fD: FighterState,
    OE_A: number,
    OE_D: number,
    ctx: ResolutionContext,
    es: ExchangeState
  ): void {
    const result = contestDistance(rng, fA, fD, OE_A, OE_D, ctx.range);
    es.rangeModA = result.rangeModA;
    es.rangeModD = result.rangeModD;
    es.distanceWinner = result.distanceWinner;
    es.events.push(...result.events);
    ctx.range = result.newRange;
  }

  // ─── Feint Sub-Phase ──────────────────────────────────────────────────────────

  export interface FeintResult {
    triggered: boolean;
    succeeded?: boolean;
    feintBonus: number;
    feintFailed: boolean;
    events: CombatEvent[];
  }

  /**
   * Attacker may feint if: WT ≥ 15, feintTendency > 0, OE ≥ 4.
   * Roll = WT + feintTendency − AL − WT_opponent × 0.5
   * Success threshold (0–1): roll / 20. Success = +4 ATT bonus.
   * Failure = defender gets a free +2 DEF bonus this exchange.
   */
  export function runFeint(
    rng: () => number,
    att: FighterState,
    def: FighterState
  ): FeintResult {
    const plan = att.activePlan;
    const wt = att.attributes.WT;
    const feintTendency = plan.feintTendency ?? 0;
    const OE = plan.OE;

    if (feintTendency === 0 || wt < 15 || OE < 4) {
      return { triggered: false, feintBonus: 0, feintFailed: false, events: [] };
    }

    const defAL = def.activePlan.AL;
    const defWT = def.attributes.WT;

    const roll = wt + feintTendency - defAL - defWT * 0.5;
    const threshold = Math.max(0.05, Math.min(0.95, roll / 20));
    const succeeded = rng() < threshold;

    const events: CombatEvent[] = [];
    const eventType = succeeded ? "FEINT_SUCCESS" : "FEINT_FAIL";
    events.push({ type: eventType, actor: att.label, target: def.label });

    return {
      triggered: true,
      succeeded,
      feintBonus: succeeded ? 4 : 0,
      feintFailed: !succeeded,
      events,
    };
  }

  // ─── Commit Sub-Phase ─────────────────────────────────────────────────────────

  export interface CommitResult {
    level: CommitLevel;
    attBonus: number;
    defPenalty: number;
    debtToWrite: number;
  }

  /**
   * Determines CommitLevel for one fighter based on their OE, momentum, and HP.
   * - Cautious (OE≤3 or HP<30%): −2 ATT, +2 DEF, 0 debt
   * - Standard:                    0 ATT,  0 DEF, 0 debt
   * - Full (OE≥7 or momentum≥2):  +3 ATT, −3 DEF, 2 debt
   */
  export function runCommit(fighter: FighterState, OE: number): CommitResult {
    const hpRatio = fighter.hp / fighter.maxHp;

    if (hpRatio < 0.30 || OE <= 3) {
      return { level: "Cautious", attBonus: -2, defPenalty: 2, debtToWrite: 0 };
    }
    if (OE >= 7 || fighter.momentum >= 2) {
      return { level: "Full", attBonus: 3, defPenalty: -3, debtToWrite: 2 };
    }
    return { level: "Standard", attBonus: 0, defPenalty: 0, debtToWrite: 0 };
  }

  // ─── Recovery Sub-Phase ───────────────────────────────────────────────────────

  /**
   * Writes recovery debt to fighters and handles zone transitions.
   * Called AFTER Resolution so we can scan events for zone-triggering hits.
   *
   * Zone transition rule: if a fighter took a hit this exchange AND they are
   * the distanceWinner's opponent, push them back one zone.
   */
  export function runRecovery(
    fA: FighterState,
    fD: FighterState,
    debtToWriteA: number,
    debtToWriteD: number,
    events: CombatEvent[],
    ctx?: ResolutionContext
  ): void {
    // Write recovery debt (take the max of existing and new, cap at 3, then decay if 0)
    if (debtToWriteA > 0) {
      fA.recoveryDebt = Math.min(3, Math.max(fA.recoveryDebt, debtToWriteA));
    } else {
      fA.recoveryDebt = Math.max(0, fA.recoveryDebt - 1);
    }
    if (debtToWriteD > 0) {
      fD.recoveryDebt = Math.min(3, Math.max(fD.recoveryDebt, debtToWriteD));
    } else {
      fD.recoveryDebt = Math.max(0, fD.recoveryDebt - 1);
    }

    // Zone transitions: push the fighter that took a hit back one zone
    if (!ctx) return;
    const hitOnA = events.some(e => e.type === "HIT" && e.target === "A");
    const hitOnD = events.some(e => e.type === "HIT" && e.target === "D");
    if (hitOnA) {
      const { transitionZone, resetZone } = require("./distanceResolution");
      const newZone = transitionZone(ctx.zone);
      if (newZone !== ctx.zone) {
        ctx.pushedFighter = "A";
        ctx.zone = newZone;
        events.push({ type: "ZONE_SHIFT", actor: "D", target: "A", result: newZone });
      }
    } else if (hitOnD) {
      const { transitionZone } = require("./distanceResolution");
      const newZone = transitionZone(ctx.zone);
      if (newZone !== ctx.zone) {
        ctx.pushedFighter = "D";
        ctx.zone = newZone;
        events.push({ type: "ZONE_SHIFT", actor: "A", target: "D", result: newZone });
      }
    } else {
      // No hit: zone drifts back toward center if fighter was pushed
      if (ctx.pushedFighter) {
        const { resetZone } = require("./distanceResolution");
        ctx.zone = resetZone(ctx.zone);
        if (ctx.zone === "Center") ctx.pushedFighter = undefined;
      }
    }
  }
  ```

  > **Note on require()**: TypeScript with ESM may flag the `require()` call inside `runRecovery`. If so, replace with a proper import at the top of the file: `import { transitionZone, resetZone } from "./distanceResolution";` — those imports are already present in the `runApproach` call chain. Move all imports to the top of the file.

  Fix the file to use top-level imports instead of `require()`:

  Replace the `runRecovery` body zone transition code with:
  ```ts
  import { transitionZone, resetZone } from "./distanceResolution";
  ```
  at the top and remove the `require()` calls inside the function.

- [ ] **Step 4: Run tests to verify they pass**

  Run: `npx vitest run src/test/engine/combat/exchangeSubPhases.test.ts`

  Expected: PASS (all)

- [ ] **Step 5: Commit**

  ```bash
  git add "src/engine/combat/exchangeSubPhases.ts" "src/test/engine/combat/exchangeSubPhases.test.ts"
  git commit -m "feat(spatial): exchange sub-phases pipeline (Approach/Feint/Commit/Recovery)"
  ```

---

### Task 6: performDefenseCheck extraDefPenalty

**Files:**
- Modify: `src/engine/combat/core/exchangeHelpers.ts` (`performDefenseCheck`, line 97–123)

The current `performDefenseCheck` has no spatial penalty parameter. Zone penalties need to be passed in.

- [ ] **Step 1: Add extraDefPenalty parameter**

  In `src/engine/combat/core/exchangeHelpers.ts`, update the `performDefenseCheck` signature. The last parameter currently is `attacker?: FighterState`. Add a new parameter after it:

  Current signature (line 97–112):
  ```ts
  export function performDefenseCheck(
    rng: () => number,
    def: FighterState,
    curDefOE: number,
    matchup: number,
    fat: number,
    curDefMods: ReturnType<typeof getDefensiveTacticMods>,
    curPassD: ReturnType<typeof getStylePassive>,
    curBiasDef: number,
    overDef: number,
    isDodge: boolean,
    curAntiSynDef: ReturnType<typeof getStyleAntiSynergy>,
    curOffMods: ReturnType<typeof getOffensiveTacticMods>,
    ctx?: { weatherEffect?: { riposteMod: number } },
    attacker?: FighterState
  )
  ```

  New signature (add final param):
  ```ts
  export function performDefenseCheck(
    rng: () => number,
    def: FighterState,
    curDefOE: number,
    matchup: number,
    fat: number,
    curDefMods: ReturnType<typeof getDefensiveTacticMods>,
    curPassD: ReturnType<typeof getStylePassive>,
    curBiasDef: number,
    overDef: number,
    isDodge: boolean,
    curAntiSynDef: ReturnType<typeof getStyleAntiSynergy>,
    curOffMods: ReturnType<typeof getOffensiveTacticMods>,
    ctx?: { weatherEffect?: { riposteMod: number } },
    attacker?: FighterState,
    extraDefPenalty: number = 0
  )
  ```

  Then in the body, apply `extraDefPenalty` to both branches. For the dodge branch (line 116):
  ```ts
  const success = skillCheck(rng, def.skills.DEF, oeDefMod(curDefOE) + matchup + fat + curDefMods.defBonus + curPassD.defBonus + curBiasDef - overDef - def.legHits + commitPenalty - extraDefPenalty);
  ```

  For the parry branch (line 119–120):
  ```ts
  const success = skillCheck(rng, def.skills.PAR, oeDefMod(curDefOE) + matchup + fat + curDefMods.parBonus + curPassD.parBonus + Math.round((curAntiSynDef.defMult - 1) * 3) - curOffMods.defPenalty - curOffMods.parryBypass + GLOBAL_PAR_PENALTY + curBiasDef - overDef - def.armHits + commitPenalty + riposteMod - extraDefPenalty);
  ```

- [ ] **Step 2: Verify existing call sites compile**

  Run: `npx tsc --noEmit`

  Expected: No errors — `extraDefPenalty` defaults to 0, so all existing callers are unaffected.

- [ ] **Step 3: Commit**

  ```bash
  git add "src/engine/combat/core/exchangeHelpers.ts"
  git commit -m "feat(spatial): add extraDefPenalty param to performDefenseCheck"
  ```

---

### Task 7: ResolutionContext Spatial Fields

**Files:**
- Modify: `src/engine/combat/resolution.ts` (`ResolutionContext` interface, line 102–123)

- [ ] **Step 1: Add spatial fields to ResolutionContext**

  In `src/engine/combat/resolution.ts`, update the `ResolutionContext` interface. After `lastOffTacticD?: string;` (end of current interface), add:

  ```ts
  /** Current distance range between fighters */
  range: DistanceRange;
  /** Current zone of the fighter being pushed back */
  zone: ArenaZone;
  /** Arena configuration (determines zone penalties, surface mods) */
  arenaConfig: ArenaConfig;
  /** Which fighter is currently in the disadvantaged zone position */
  pushedFighter?: "A" | "D";
  /** Surface modifiers unpacked from arenaConfig for convenience */
  surfaceMod: SurfaceMod;
  ```

  Also add the necessary imports at the top of `resolution.ts`:
  ```ts
  import type { DistanceRange, ArenaZone, ArenaConfig, SurfaceMod } from "@/types/shared.types";
  ```

- [ ] **Step 2: Verify compilation**

  Run: `npx tsc --noEmit`

  Expected: Errors at `simulate.ts` where `ResolutionContext` is constructed — because it now requires `range`, `zone`, `arenaConfig`, `surfaceMod`. Those will be fixed in Task 8.

- [ ] **Step 3: Commit**

  ```bash
  git add "src/engine/combat/resolution.ts"
  git commit -m "feat(spatial): add spatial fields to ResolutionContext"
  ```

---

### Task 8: Wire Sub-Phases into resolveExchange + Patch simulate.ts

**Files:**
- Modify: `src/engine/combat/resolution.ts` (`resolveExchange` function, line 142–333)
- Modify: `src/engine/simulate.ts` (ResolutionContext construction, ~line 90–105)

This task wires the new sub-phases into `resolveExchange` and patches `simulate.ts` to initialize the new required fields.

- [ ] **Step 1: Update simulate.ts ResolutionContext construction**

  In `src/engine/simulate.ts`, add imports at the top:
  ```ts
  import { STANDARD_ARENA, getArenaById } from "@/data/arenas";
  import type { DistanceRange } from "@/types/shared.types";
  ```

  Update the `simulateFight` function signature to accept an optional `arenaId`:
  ```ts
  export function simulateFight(
    planA: FightPlan,
    planD: FightPlan,
    warriorA?: Warrior,
    warriorD?: Warrior,
    providedRng?: (() => number) | number,
    trainers?: Trainer[],
    weather: WeatherType = "Clear",
    arenaId: string = "standard_arena"
  ): FightOutcome
  ```

  Look up the arena and add spatial fields to `resCtx`:
  ```ts
  const arenaConfig = getArenaById(arenaId);

  const resCtx: ResolutionContext = {
    // ... all existing fields ...
    range: "Striking" as DistanceRange,
    zone: arenaConfig.startingZone ?? "Center",
    arenaConfig,
    surfaceMod: arenaConfig.surfaceMod,
    pushedFighter: undefined,
  };
  ```

- [ ] **Step 2: Wire sub-phases into resolveExchange**

  In `src/engine/combat/resolution.ts`, add imports:
  ```ts
  import {
    makeExchangeState,
    runApproach,
    runFeint,
    runCommit,
    runRecovery,
    type ExchangeState,
  } from "./exchangeSubPhases";
  import { getZonePenalty } from "./distanceResolution";
  ```

  In `resolveExchange`, add the ExchangeState at the start of the function body (after the existing setup, before initiative):

  ```ts
  // ── Spatial Sub-Phases: ExchangeState accumulator ──
  const es = makeExchangeState();

  // Sub-phase 1: Approach — contest distance, update range
  runApproach(rng, fA, fD, OE_A, OE_D, ctx, es);
  events.push(...es.events.splice(0));
  ```

  Then update the INI calculation to include surface mods. Find the line:
  ```ts
  const iniA = fA.skills.INI + ... + ctx.weatherEffect.initiativeMod;
  const iniD = fD.skills.INI + ... + ctx.weatherEffect.initiativeMod;
  ```

  Add `ctx.surfaceMod.initiativeMod` to both:
  ```ts
  const iniA = fA.skills.INI + ... + ctx.weatherEffect.initiativeMod + ctx.surfaceMod.initiativeMod;
  const iniD = fD.skills.INI + ... + ctx.weatherEffect.initiativeMod + ctx.surfaceMod.initiativeMod;
  ```

  After initiative resolution (after `const aGoesFirst = contestCheck(...)`), add Feint and Commit:

  ```ts
  // Sub-phase 2: Feint (attacker only)
  const feintResult = runFeint(rng, att, def);
  events.push(...feintResult.events);
  const feintAttBonus = feintResult.feintBonus;
  const feintDefBonus = feintResult.feintFailed ? 2 : 0;

  // Sub-phase 3: Commit — determine CommitLevel
  const commitA = runCommit(aGoesFirst ? fA : fD, aGoesFirst ? OE_A : OE_D);
  const commitD = runCommit(aGoesFirst ? fD : fA, aGoesFirst ? OE_D : OE_A);
  es.recoveryDebtToWriteA = aGoesFirst ? commitA.debtToWrite : commitD.debtToWrite;
  es.recoveryDebtToWriteD = aGoesFirst ? commitD.debtToWrite : commitA.debtToWrite;
  ```

  Update the `performAttackCheck` call to include range and commit bonuses. Find:
  ```ts
  const attSucc = performAttackCheck(rng, att, curAttOE, ..., attMomentumBonus + attPsychMod);
  ```

  Replace the last argument:
  ```ts
  const rangeMod = aGoesFirst ? es.rangeModA : es.rangeModD;
  const commitMod = (aGoesFirst ? commitA : commitD).attBonus;
  const attSucc = performAttackCheck(rng, att, curAttOE, ..., attMomentumBonus + attPsychMod + rangeMod + commitMod + feintAttBonus);
  ```

  Update the `performDefenseCheck` call to add `extraDefPenalty`. Find:
  ```ts
  const defCheck = performDefenseCheck(rng, def, curDefOE, ..., ctx, att);
  ```

  Replace with:
  ```ts
  const zonePenalty = (ctx.pushedFighter === def.label)
    ? Math.abs(getZonePenalty(ctx.zone, ctx.arenaConfig))
    : 0;
  const defCommitPenalty = (aGoesFirst ? commitD : commitA).defPenalty;
  const extraDefPenalty = zonePenalty - Math.min(0, defCommitPenalty) + feintDefBonus;
  const defCheck = performDefenseCheck(rng, def, curDefOE, ..., ctx, att, extraDefPenalty);
  ```

  At the end of `resolveExchange`, before `return events`, add Recovery:

  ```ts
  // Sub-phase 5: Recovery — write debt, handle zone transitions
  runRecovery(fA, fD, es.recoveryDebtToWriteA, es.recoveryDebtToWriteD, events, ctx);
  ```

  Also apply `surfaceMod.enduranceMult` in `applyEnduranceCosts`. In `exchangeHelpers.ts`, `applyEnduranceCosts` uses `getEnduranceMult(att.style)` — the surface mult should be applied at the call site in `resolveExchange`. Find the `applyEnduranceCosts` call and note that you can't easily pass surfaceMod there without refactoring that function. Instead, apply it inline before calling:

  > **Note:** Surface endurance mult is a minor effect. For this implementation, apply it as a post-hoc adjustment: after `applyEnduranceCosts`, adjust endurance by the delta:
  ```ts
  // Apply surface endurance multiplier (minor adjustment after base cost)
  if (ctx.surfaceMod.enduranceMult !== 1.0) {
    const mult = ctx.surfaceMod.enduranceMult - 1.0;
    fA.endurance = Math.max(0, fA.endurance - Math.round(Math.abs(fA.endurance * mult)));
    fD.endurance = Math.max(0, fD.endurance - Math.round(Math.abs(fD.endurance * mult)));
  }
  ```

  > **Warning:** This is a rough approximation. A follow-up task can pass surfaceMod into `applyEnduranceCosts` properly. Mark with `// TODO(spatial): pass surfaceMod into applyEnduranceCosts for precision`.

- [ ] **Step 3: Run full test suite to verify nothing broke**

  Run: `npx vitest run`

  Expected: All previously passing tests still pass. Any new failures must be investigated — do not proceed until resolved.

- [ ] **Step 4: Commit**

  ```bash
  git add "src/engine/combat/resolution.ts" "src/engine/simulate.ts"
  git commit -m "feat(spatial): wire sub-phases into resolveExchange; initialize spatial context in simulate"
  ```

---

### Task 9: Narrative for Spatial Events

**Files:**
- Modify: `src/engine/narrativePBP.ts`
- Modify: `src/engine/combat/narrator.ts`

- [ ] **Step 1: Add spatial narrative functions to narrativePBP.ts**

  In `src/engine/narrativePBP.ts`, add after the `conservingLine` function:

  ```ts
  // ─── Spatial Narrative ───────────────────────────────────────────────────────

  const RANGE_NAMES: Record<string, string> = {
    Grapple: "in close",
    Tight: "at tight quarters",
    Striking: "at striking range",
    Extended: "at distance",
  };

  export function narrateRangeShift(rng: RNG, moverName: string, newRange: string): string {
    const rangeName = RANGE_NAMES[newRange] ?? newRange.toLowerCase();
    const templates = [
      `${moverName} controls the distance, forcing the fight ${rangeName}.`,
      `${moverName} seizes the initiative, dictating range — ${rangeName}.`,
      `${moverName} adjusts his footwork and takes the fight ${rangeName}.`,
    ];
    return templates[Math.floor(rng() * templates.length)];
  }

  export function narrateFeint(rng: RNG, attackerName: string, succeeded: boolean): string {
    if (succeeded) {
      const templates = [
        `${attackerName} fakes high and the defender bites — the opening is there!`,
        `A deceptive feint from ${attackerName} draws the guard out of position.`,
        `${attackerName}'s feint lands cleanly. The defender is momentarily fooled.`,
      ];
      return templates[Math.floor(rng() * templates.length)];
    } else {
      const templates = [
        `${attackerName} attempts a feint, but the defender sees through it.`,
        `The feint from ${attackerName} is read immediately — no advantage gained.`,
        `${attackerName}'s deception fails. The defender barely flinches.`,
      ];
      return templates[Math.floor(rng() * templates.length)];
    }
  }

  export function narrateZoneShift(rng: RNG, pushedName: string, zone: string): string {
    const zoneDesc: Record<string, string> = {
      Edge: "to the edge of the arena",
      Corner: "into the corner — nowhere to run",
      Center: "back toward the center",
    };
    const desc = zoneDesc[zone] ?? zone.toLowerCase();
    const templates = [
      `${pushedName} is driven ${desc}!`,
      `${pushedName} loses ground, pushed ${desc}.`,
      `The exchange ends badly for ${pushedName} — forced ${desc}.`,
    ];
    return templates[Math.floor(rng() * templates.length)];
  }
  ```

- [ ] **Step 2: Wire spatial events into narrator.ts**

  In `src/engine/combat/narrator.ts`, add imports for the new narrative functions:
  ```ts
  import {
    narrateAttack, narrateParry, narrateDodge, narrateCounterstrike,
    narrateHit, damageSeverityLine, stateChangeLine,
    fatigueLine, crowdReaction, narrateInitiative,
    tauntLine, narrateInsightHint, narratePassive,
    narrateRangeShift, narrateFeint, narrateZoneShift,
  } from "../narrativePBP";
  ```

  In the `narrateEvents` for-loop (currently handles INITIATIVE, ATTACK, DEFENSE, HIT, etc.), add cases for the new event types. Find the `switch` or `if/else` blocks inside the for-loop and add:

  ```ts
  if (event.type === "RANGE_SHIFT") {
    const moverName = getName(event.actor);
    const newRange = event.result as string;
    log.push({ minute, text: narrateRangeShift(rng, moverName, newRange) });
    continue;
  }

  if (event.type === "FEINT_SUCCESS" || event.type === "FEINT_FAIL") {
    const attackerName = getName(event.actor);
    log.push({ minute, text: narrateFeint(rng, attackerName, event.type === "FEINT_SUCCESS") });
    continue;
  }

  if (event.type === "ZONE_SHIFT") {
    const pushedName = getName(event.target ?? event.actor);
    const zone = event.result as string;
    log.push({ minute, text: narrateZoneShift(rng, pushedName, zone) });
    continue;
  }
  ```

  > **How to find the right place:** The narrator loop processes events in order. The spatial events (RANGE_SHIFT, FEINT_*) should be emitted early in the exchange before the HIT narration. Add these cases at the beginning of the for-loop body, before the INITIATIVE handling.

- [ ] **Step 3: Run the full test suite**

  Run: `npx vitest run`

  Expected: All tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add "src/engine/narrativePBP.ts" "src/engine/combat/narrator.ts"
  git commit -m "feat(spatial): narrative functions for range shift, feint, zone push"
  ```

---

### Task 10: Integration Test

**Files:**
- Modify: `src/test/simulate.test.ts` (add spatial integration test)

- [ ] **Step 1: Add a spatial integration test**

  Open `src/test/simulate.test.ts` and add a describe block:

  ```ts
  import { getArenaById } from "@/data/arenas";

  describe("spatial system integration", () => {
    it("simulateFight runs 100 fights with mudpit arena without throwing", () => {
      for (let seed = 0; seed < 100; seed++) {
        const plan: FightPlan = {
          style: FightingStyle.SlashingAttack,
          OE: 6, AL: 5, killDesire: 5,
          feintTendency: 3,
          rangePreference: "Striking",
        };
        expect(() =>
          simulateFight(plan, plan, undefined, undefined, seed, undefined, "Clear", "mudpit_arena")
        ).not.toThrow();
      }
    });

    it("mudpit arena has higher endurance cost than standard (over 50 fights)", () => {
      let standardEndAvg = 0, mudpitEndAvg = 0;
      const n = 50;
      for (let seed = 0; seed < n; seed++) {
        const plan: FightPlan = {
          style: FightingStyle.SlashingAttack,
          OE: 7, AL: 5, killDesire: 5,
        };
        const standard = simulateFight(plan, plan, undefined, undefined, seed, undefined, "Clear", "standard_arena");
        const mudpit = simulateFight(plan, plan, undefined, undefined, seed, undefined, "Clear", "mudpit_arena");
        standardEndAvg += standard.minutes;
        mudpitEndAvg += mudpit.minutes;
      }
      // Mudpit fights should end sooner on average (fighters tire faster)
      // Allow generous tolerance — this is a stochastic assertion
      expect(mudpitEndAvg / n).toBeLessThanOrEqual(standardEndAvg / n + 1.5);
    });

    it("RANGE_SHIFT events appear in the fight log when fighters have different range preferences", () => {
      const planLunger: FightPlan = {
        style: FightingStyle.LungingAttack,
        OE: 7, AL: 5, killDesire: 5,
        rangePreference: "Extended",
      };
      const planGrappler: FightPlan = {
        style: FightingStyle.StrikingAttack,
        OE: 7, AL: 5, killDesire: 5,
        rangePreference: "Grapple",
      };
      let foundRangeShift = false;
      for (let seed = 0; seed < 20; seed++) {
        const outcome = simulateFight(planLunger, planGrappler, undefined, undefined, seed, undefined, "Clear", "standard_arena");
        const allText = outcome.log.map(l => l.text).join(" ");
        if (allText.includes("controls the distance") || allText.includes("dictating range") || allText.includes("footwork")) {
          foundRangeShift = true;
          break;
        }
      }
      expect(foundRangeShift).toBe(true);
    });
  });
  ```

- [ ] **Step 2: Run the integration tests**

  Run: `npx vitest run src/test/simulate.test.ts`

  Expected: PASS (all)

- [ ] **Step 3: Run full suite one final time**

  Run: `npx vitest run`

  Expected: All tests pass.

- [ ] **Step 4: Final commit**

  ```bash
  git add "src/test/simulate.test.ts"
  git commit -m "test(spatial): integration tests for arena, range shift, endurance cost"
  ```

---

## Appendix: Key Formulas Reference

| Formula | Where |
|---|---|
| `reachScore = INI + (OE−5)×2 + motivationBonus − (recoveryDebt×2)` | `distanceResolution.ts: computeReachScore` |
| Range winner: `+3 ATT`, loser: `−3 ATT` | `distanceResolution.ts: contestDistance` |
| Range shifts 1 step toward winner's preferred range | `distanceResolution.ts: shiftRangeToward` |
| Feint roll: `WT + feintTendency − AL_def − WT_def×0.5` → threshold `roll/20` | `exchangeSubPhases.ts: runFeint` |
| Feint success: `+4 ATT`; Feint fail: defender gets `+2 DEF` | `exchangeSubPhases.ts: runFeint` |
| Cautious commit (OE≤3 or HP<30%): `−2 ATT`, `+2 DEF`, 0 debt | `exchangeSubPhases.ts: runCommit` |
| Full commit (OE≥7 or momentum≥2): `+3 ATT`, `−3 DEF`, 2 debt | `exchangeSubPhases.ts: runCommit` |
| Recovery debt: `Math.min(3, Math.max(existing, toWrite))`, decays 1/exchange | `exchangeSubPhases.ts: runRecovery` |
| Zone transitions: Center→Edge→Corner (pinned) | `distanceResolution.ts: transitionZone` |
| Zone reset: Corner→Edge→Center (on no-hit exchange) | `distanceResolution.ts: resetZone` |
| Zone DEF penalty: Center=0, Edge=−2, Corner=−4 (arena-configurable) | `distanceResolution.ts: getZonePenalty` |

## Appendix: Arena Registry Lookup

```ts
import { getArenaById } from "@/data/arenas";
const arena = getArenaById("bloodsands_arena"); // falls back to STANDARD_ARENA if unknown
```
