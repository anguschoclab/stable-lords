# Stable Lords — Strategy Editor & Fight Plan Specification v1.0

Generated: 2026-03-08

---

## Document Purpose

This is the **definitive strategy editor specification** — the most important player-facing decision system in Stable Lords.

It fully specifies:
1. The fight plan data model (OE, AL, KD, tactics, targets, phase overrides)
2. How minute-plan curves are authored and visualized
3. Per-style strategy guidance and presets
4. How the plan is consumed by the bout engine
5. Validation rules and illegal combinations
6. UI contract for the PlanBuilder component

**Supersedes:** `Stable_Lords_Strategy_Editor_OE_AL_DEC_v0.1.md` (which was a stub).

**Depends on:**
- Warrior Design & Creation Spec v0.3 (attributes, styles)
- Dueling Bout System v0.1 (exchange resolution order)
- Fighting Styles Compendium v0.3 (style-specific tactics)
- Equipment Spec v0.1 (gear affects strategy viability)
- AI Dueling Behavior Spec v0.1 (AI consumes this plan format)

**Consumed by:**
- `src/components/PlanBuilder.tsx` (UI)
- `src/engine/simulate.ts` (bout resolution)
- `src/engine/planBias.ts` (auto-tune)
- AI behavior system

---

## 1) Design Intent

### Player Value
- **Depth**: The strategy editor is where skill expression lives. Two identical warriors with different plans fight completely differently.
- **Readability**: Every number has a clear effect. No hidden interactions.
- **Guidance**: Each style has recommended ranges and presets. New players should never feel lost.

### Core Principle
> The player writes the plan. The warrior executes it. The arena tests it. The results teach.

---

## 2) Fight Plan Data Model

### 2.1 Complete Plan Schema

```ts
interface FightPlan {
  style: FightingStyle;           // locked to warrior's style

  // Base settings (fallback if no phase overrides)
  OE: number;                     // Offensive Effort 1-10
  AL: number;                     // Activity Level 1-10
  killDesire?: number;            // Kill Desire 1-10 (default 5)

  // Targeting
  target?: BodyTarget;            // "Head" | "Chest" | "Abdomen" | "Arms" | "Legs" | "Any"
  protect?: BodyTarget;           // which location to protect (NEW)

  // Tactics (one offensive, one defensive — mutually exclusive per application)
  offensiveTactic?: OffensiveTactic;  // "Lunge" | "Slash" | "Bash" | "Decisiveness" | "none"
  defensiveTactic?: DefensiveTactic;  // "Dodge" | "Parry" | "Riposte" | "Responsiveness" | "none"

  // Equipment
  gear?: Gear;

  // Phase-based overrides
  phases?: {
    opening?: PhaseStrategy;
    mid?: PhaseStrategy;
    late?: PhaseStrategy;
  };
}

interface PhaseStrategy {
  OE: number;
  AL: number;
  killDesire: number;
  offensiveTactic?: OffensiveTactic;   // NEW: per-phase tactic override
  defensiveTactic?: DefensiveTactic;   // NEW: per-phase tactic override
  target?: BodyTarget;                 // NEW: per-phase target override
}
```

### 2.2 Parameter Definitions

| Parameter | Range | Effect on Bout |
|-----------|-------|----------------|
| **OE (Offensive Effort)** | 1-10 | Controls attack frequency. High OE = more attacks per exchange, higher endurance drain. |
| **AL (Activity Level)** | 1-10 | Controls movement and positioning. High AL = better initiative, more dodging, higher endurance drain. |
| **KD (Kill Desire)** | 1-10 | Controls willingness to commit to finishing blows. High KD = more DEC checks, wider kill windows. |
| **Target** | Body part or "Any" | Directs attacks to a specific location. Focused targeting has +accuracy but is predictable. |
| **Protect** | Body part or "Any" | Prioritizes defense of a location. Reduces critical hits there but weakens other areas. |
| **Offensive Tactic** | One of 5 | Modifies HOW attacks are delivered. Style suitability matters. |
| **Defensive Tactic** | One of 5 | Modifies HOW defense is executed. Style suitability matters. |

### 2.3 Phase Definitions

| Phase | Bout Minutes | Engine Trigger |
|-------|-------------|----------------|
| **Opening** | Minutes 1-3 | `currentMinute <= 3` |
| **Mid** | Minutes 4-7 | `currentMinute >= 4 && currentMinute <= 7` |
| **Late** | Minutes 8+ | `currentMinute >= 8` |

If no phase override exists for the current phase, the base OE/AL/KD are used.

---

## 3) OE/AL/KD Interaction Model

### 3.1 How OE Affects Combat

```
attacksPerExchange = baseAttacks(style) * (OE / 5)
enduranceDrain += OE * enduranceCostMultiplier
```

| OE | Attacks | Endurance Cost | Best For |
|----|---------|---------------|----------|
| 1-3 | Low (0.5-0.8× base) | Minimal | TP, PR, defensive postures |
| 4-6 | Normal (0.9-1.2× base) | Moderate | Most styles, balanced |
| 7-10 | High (1.3-2.0× base) | Heavy | BA, LU, aggressive openers |

### 3.2 How AL Affects Combat

```
initiativeBonus += (AL - 5) * 2
dodgeChance += (AL - 5) * 0.02
enduranceDrain += AL * 0.8
```

| AL | Initiative | Dodge | Cost | Best For |
|----|-----------|-------|------|----------|
| 1-3 | Penalty | Low | Low | Conserving energy, late-bout |
| 4-6 | Neutral | Normal | Normal | Balanced |
| 7-10 | Bonus | High | Heavy | LU, early aggression, kiting |

### 3.3 How KD Affects Combat

```
killWindowCheck = (KD >= threshold) && (opponentHP < hpThreshold)
finishCommitment = KD * 0.1  // probability of pressing kill window
```

| KD | Kill Behavior | Risk |
|----|-------------|------|
| 1-3 | Almost never commits to kill | Safe, wins by points |
| 4-6 | Commits when opportunity is clear | Balanced |
| 7-10 | Aggressively seeks kills | Dangerous if opponent survives the attempt |

### 3.4 The OE × AL Energy Budget

**Critical interaction**: OE and AL both drain endurance. Running both at 10 is suicidal for most warriors.

```
totalDrain = (OE * attackCost) + (AL * movementCost) + gearEncumbranceCost
survivableMinutes ≈ endurance / totalDrain
```

The strategy editor should show a **projected stamina curve** based on current OE/AL settings so the player can see "my warrior will collapse at minute 6 with these settings."

---

## 4) Tactics

### 4.1 Offensive Tactics

| Tactic | Effect | Best Styles |
|--------|--------|-------------|
| **Lunge** | +ATT, +reach, +endurance cost. Leap attacks. | LU (WS), PL |
| **Slash** | +damage on hit, -PAR. Wide cutting arcs. | SL (WS), BA |
| **Bash** | Attempts to attack through parry. -DEF. | BA (WS), ST |
| **Decisiveness** | +DEC, improves kill window exploitation. +endurance cost. | ST (WS), PS |
| **none** | No modifier. Neutral stance. | Any |

### 4.2 Defensive Tactics

| Tactic | Effect | Best Styles |
|--------|--------|-------------|
| **Parry** | +PAR, -RIP. Block with weapon. | TP (WS), PS, PL |
| **Dodge** | +DEF, uses AL for avoidance. -PAR. | PL (WS), LU |
| **Riposte** | +RIP after successful PAR. Requires parry first. | PR (WS), PS |
| **Responsiveness** | +INI next exchange. Adaptive defense. | WS, PR |
| **none** | No modifier. | Any |

### 4.3 Style × Tactic Suitability

From the Fighting Styles Compendium v0.3, each style has a suitability tier for each tactic:

| Rating | Meaning | Mechanical Effect |
|--------|---------|-------------------|
| **WS (Well Suited)** | Natural fit. Can be set as favorite. | Full tactic bonus |
| **S (Suited)** | Usable but not optimal. | 60% of tactic bonus |
| **U (Unsuited)** | Fighting against the style's nature. | 30% of tactic bonus + warning |

**Validation rule**: Only WS-rated tactics can be set as the warrior's **favorite tactic** (a persistent preference that gives +1 to that tactic roll). S and U tactics can be used situationally (per-phase) but with reduced effectiveness.

### 4.4 Tactic Usage Philosophy

From the Compendium: "Tactics should be used sparingly." This means:
- Setting a tactic in ALL three phases is valid but suboptimal
- The best use is phase-specific: e.g., Bash in Opening to break through, then Parry in Late to close out
- The UI should encourage this through presets and guidance

---

## 5) Per-Style Strategy Presets

Each style has 2-3 recommended presets that populate the plan editor:

### Aimed-Blow (AB)
| Preset | Opening | Mid | Late |
|--------|---------|-----|------|
| **Patient Surgeon** | OE 4, AL 5, KD 3 | OE 6, AL 5, KD 5 | OE 7, AL 4, KD 7 |
| **Aggressive Precision** | OE 6, AL 6, KD 5 | OE 7, AL 5, KD 6 | OE 5, AL 3, KD 8 |

### Basher (BA)
| Preset | Opening | Mid | Late |
|--------|---------|-----|------|
| **Steamroller** | OE 8, AL 5, KD 6 | OE 7, AL 4, KD 7 | OE 5, AL 3, KD 9 |
| **Measured Brute** | OE 6, AL 4, KD 4 | OE 7, AL 5, KD 6 | OE 8, AL 3, KD 8 |

### Lunger (LU)
| Preset | Opening | Mid | Late |
|--------|---------|-----|------|
| **Blitz** | OE 8, AL 8, KD 5 | OE 6, AL 6, KD 6 | OE 4, AL 4, KD 7 |
| **Sustained Pressure** | OE 6, AL 7, KD 4 | OE 6, AL 6, KD 5 | OE 5, AL 5, KD 6 |

### Parry-Lunger (PL)
| Preset | Opening | Mid | Late |
|--------|---------|-----|------|
| **Counter-Strike** | OE 4, AL 5, KD 3 | OE 6, AL 6, KD 5 | OE 7, AL 5, KD 7 |
| **Explosive Opener** | OE 7, AL 7, KD 5 | OE 5, AL 5, KD 5 | OE 4, AL 4, KD 6 |

### Parry-Riposte (PR)
| Preset | Opening | Mid | Late |
|--------|---------|-----|------|
| **Classic Counter** | OE 3, AL 4, KD 3 | OE 4, AL 5, KD 4 | OE 5, AL 4, KD 6 |
| **Aggressive Riposte** | OE 5, AL 5, KD 4 | OE 5, AL 5, KD 5 | OE 6, AL 4, KD 7 |

### Parry-Striker (PS)
| Preset | Opening | Mid | Late |
|--------|---------|-----|------|
| **Measured Defense** | OE 5, AL 5, KD 3 | OE 5, AL 5, KD 5 | OE 6, AL 4, KD 7 |
| **Quick Finish** | OE 6, AL 6, KD 5 | OE 7, AL 5, KD 6 | OE 5, AL 3, KD 8 |

### Slasher (SL)
| Preset | Opening | Mid | Late |
|--------|---------|-----|------|
| **Pressure Cutter** | OE 7, AL 6, KD 5 | OE 7, AL 6, KD 6 | OE 6, AL 4, KD 7 |
| **Cautious Slasher** | OE 5, AL 5, KD 3 | OE 6, AL 6, KD 5 | OE 7, AL 5, KD 7 |

### Striker (ST)
| Preset | Opening | Mid | Late |
|--------|---------|-----|------|
| **Fast Finish** | OE 7, AL 6, KD 6 | OE 7, AL 5, KD 7 | OE 6, AL 3, KD 9 |
| **Technical Striker** | OE 5, AL 5, KD 4 | OE 6, AL 5, KD 5 | OE 6, AL 4, KD 7 |

### Total-Parry (TP)
| Preset | Opening | Mid | Late |
|--------|---------|-----|------|
| **Endurance Wall** | OE 2, AL 3, KD 1 | OE 3, AL 3, KD 2 | OE 4, AL 3, KD 4 |
| **Opportunistic** | OE 3, AL 4, KD 2 | OE 4, AL 4, KD 4 | OE 5, AL 4, KD 6 |

### Wall of Steel (WS)
| Preset | Opening | Mid | Late |
|--------|---------|-----|------|
| **Iron Curtain** | OE 5, AL 6, KD 3 | OE 5, AL 5, KD 4 | OE 4, AL 4, KD 5 |
| **Aggressive Wall** | OE 6, AL 7, KD 5 | OE 6, AL 6, KD 5 | OE 5, AL 5, KD 6 |

---

## 6) Validation Rules

### 6.1 Hard Constraints

| Rule | Enforcement |
|------|------------|
| OE range 1-10 | Clamp on input |
| AL range 1-10 | Clamp on input |
| KD range 1-10 | Clamp on input |
| Cannot set both offensiveTactic AND defensiveTactic in same phase | UI mutual exclusion |
| Tactic must be at least S-rated for the style | Warning, not block |
| Favorite tactic must be WS-rated | Block |
| Two-handed weapon → no shield | Block (handled by equipment system) |

### 6.2 Soft Warnings

| Condition | Warning Text |
|-----------|-------------|
| OE + AL > 14 | "Extreme energy burn — warrior may collapse early" |
| OE 1-2 with aggressive style (BA/LU/SL) | "Very low OE conflicts with style identity" |
| OE 8+ with defensive style (TP/PR) | "High OE may undermine defensive advantages" |
| AL 8+ with BA | "Bashers lack mobility — high AL may be wasted" |
| KD 1-2 with kill-focused style | "Low kill desire wastes finishing opportunities" |
| Tactic is U-rated for style | "This tactic is unsuited to your style — reduced effectiveness" |

---

## 7) How the Engine Consumes the Plan

### 7.1 Per-Exchange Resolution

```
getCurrentPlan(plan, currentMinute):
  phase = currentMinute <= 3 ? "opening"
        : currentMinute <= 7 ? "mid"
        : "late"
  
  if plan.phases?.[phase]:
    return merge(plan, plan.phases[phase])  // phase overrides base
  return plan  // use base values
```

### 7.2 OE → Attack Count

```
attackAttempts = floor(baseRate * (OE / 5))
  where baseRate = styleBaseRate[style] (1-3 depending on style)
```

### 7.3 AL → Initiative Modifier

```
iniBonus = (AL - 5) * 2
```

### 7.4 KD → Kill Window

```
killWindowOpen = opponentHP < hpThreshold
  AND attacker passes DEC check
  AND KD >= 3
  
killCommitChance = KD * 0.1 + (DEC / 20)
```

### 7.5 Tactic Application

```
tacticBonus = rawBonus * suitabilityMultiplier
  where suitabilityMultiplier = WS: 1.0, S: 0.6, U: 0.3
```

---

## 8) UI Contract: PlanBuilder Component

### 8.1 Required Elements

| Element | Description |
|---------|-------------|
| **OE/AL/KD Sliders** | 1-10 with current value displayed. Color-coded by intensity. |
| **Phase Tabs** | Opening / Mid / Late tabs to set per-phase overrides |
| **Phase Toggle** | Enable/disable per-phase overrides (collapsed by default) |
| **Target/Protect Dropdowns** | Body part selection |
| **Tactic Selectors** | Offensive and Defensive dropdowns with suitability indicators |
| **Preset Buttons** | 2-3 style-specific presets that populate all fields |
| **Stamina Projection** | Visual curve showing estimated endurance over bout duration |
| **Warning Bar** | Displays active soft warnings |
| **Style Guidance** | Collapsed section with style-specific tips from the Compendium |

### 8.2 Visual Language

- OE 1-3: Cool blue (conservative)
- OE 4-6: Neutral gray (balanced)
- OE 7-10: Hot red (aggressive)
- Same color scale for AL and KD

### 8.3 Stamina Curve (New)

A small sparkline showing projected endurance:

```
X axis: Minutes 1-12
Y axis: Endurance % (100 → 0)
Line: declines based on OE+AL+gear cost
Red zone: below 20% (collapse risk)
```

This is the single most impactful UI addition for strategy literacy.

---

## 9) Acceptance Criteria

### Functional
- [ ] Plan supports base OE/AL/KD + per-phase overrides
- [ ] Tactics can be set per-phase
- [ ] Target and Protect locations work
- [ ] Presets populate plan correctly for each style
- [ ] Suitability reduces tactic effectiveness for S/U ratings
- [ ] Warnings fire for extreme combinations

### Behavioral
- [ ] A Basher with OE 8 attacks noticeably more than OE 3
- [ ] A Lunger with AL 9 wins initiative more often but collapses faster
- [ ] KD 10 with high DEC reliably finishes wounded opponents
- [ ] Phase overrides visibly change warrior behavior mid-bout
- [ ] Stamina curve accurately predicts collapse timing

### Player Experience
- [ ] A new player can use a preset and have a competitive plan
- [ ] An experienced player can craft phase-specific tactics that feel rewarding
- [ ] The UI makes it clear WHY a plan works or doesn't (warnings + guidance)

---

END OF DOCUMENT
