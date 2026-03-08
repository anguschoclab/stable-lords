# Stable Lords — Training Mechanics & Progression Spec v1.0

Generated: 2026-03-08

---

## Document Purpose

This specification defines the **complete training resolution system** — the core management pillar that governs how warriors improve between fights.

It covers:
1. Weekly training actions and resolution
2. Attribute growth limits and caps
3. Training risk (injury during training)
4. Trainer specialty formulas and bonus application
5. Warrior morale and training compatibility
6. Learn-by-doing (XP) progression integration
7. Retirement-to-trainer conversion rules
8. How player training differs from AI training

**Depends on:**
- Warrior Design & Creation Spec v0.3 (attribute model, caps)
- Injury System (`src/engine/injuries.ts`)
- Trainer module (`src/modules/trainers.ts`)
- Progression system (`src/engine/progression.ts`)
- Economy system (`src/engine/economy.ts`)

**Consumed by:**
- `src/pages/Training.tsx` (UI)
- `src/engine/training.ts` (resolution)
- `src/state/gameStore.ts` (`advanceWeek` → `processTraining`)

---

## 1) Design Intent

### Player Value
- **Agency**: Players choose WHAT each warrior trains, creating divergent builds from identical starting points.
- **Risk/Reward**: Training is safer than fighting but slower. Training injuries exist but are rare.
- **Trade-off**: A warrior in training cannot fight that week (mutual exclusion with matchmaking).

### Core Principle
> Training is how the player sculpts a warrior's future. Fighting is how they prove it.

---

## 2) Training Actions

### 2.1 Assignment

Each warrior may be assigned to **one training focus per week**:

| Training Type | Target | Description |
|--------------|--------|-------------|
| **Attribute Training** | Any of ST/CN/SZ/WT/WL/SP/DF | Direct attribute improvement attempt |
| **Skill Drilling** | ATT/PAR/DEF/INI/RIP/DEC | Practice a specific combat skill (future expansion) |
| **Recovery** | — | Accelerate injury healing (see §6) |

**Current implementation scope**: Attribute Training and Recovery only. Skill Drilling is reserved for future expansion.

### 2.2 Mutual Exclusion

A warrior can do exactly ONE of these per week:
- Fight in the arena
- Train an attribute
- Recover from injury

This is the fundamental management decision.

---

## 3) Training Resolution

### 3.1 Base Gain Chance

When a warrior trains an attribute, the chance of gaining +1 is:

```
gainChance = BASE_CHANCE + trainerBonus + wtBonus - agePenalty - injuryPenalty
```

| Factor | Value | Notes |
|--------|-------|-------|
| `BASE_CHANCE` | 0.55 (55%) | Current implementation |
| `trainerBonus` | +0.05 per trainer tier point | Novice +0.05, Seasoned +0.10, Master +0.15 |
| `wtBonus` | +(WT - 10) * 0.01 | Smarter warriors learn faster |
| `agePenalty` | -0.02 per year over 25 | Older warriors learn slower |
| `injuryPenalty` | -0.10 if any active injury | Can train while minorly injured, but less effectively |

**Clamp**: `gainChance` is clamped to [0.15, 0.85] — never guaranteed, never impossible.

### 3.2 Attribute Caps

| Cap | Value | Design Rationale |
|-----|-------|-----------------|
| Single attribute max | 25 | Canonical Duelmasters cap |
| Total attribute sum max | 80 | Starting budget 70 + 10 growth room |
| Growth per attribute per season (13 weeks) | 3 max | Prevents hyper-focused grinding |

**Seasonal growth cap (new)**: No attribute can gain more than 3 points in a single 13-week season. This prevents degenerate strategies of training SP to 25 immediately.

```ts
interface SeasonalGrowth {
  warriorId: string;
  season: Season;
  gains: Partial<Record<keyof Attributes, number>>; // tracks gains per attr this season
}
```

### 3.3 SZ Exception

**Size (SZ) cannot be trained.** It is fixed at creation. This is canonical to Duelmasters — size represents physical frame, not a trainable quality.

### 3.4 Resolution Flow

```
processTraining(state):
  for each training assignment:
    1. Validate warrior exists and is Active
    2. Check attribute is not SZ
    3. Check attribute < 25 and total < 80
    4. Check seasonal growth cap for this attribute
    5. Roll gainChance
    6. If success: +1 to attribute, recompute baseSkills and derivedStats
    7. Roll training injury chance (see §5)
    8. Log result to newsletter
    9. Clear assignment
```

---

## 4) Trainer Integration

### 4.1 How Trainers Affect Training

Trainers provide **passive bonuses** to all warriors in the stable, not direct training assignments.

| Trainer Focus | Training Effect | Combat Effect |
|--------------|-----------------|---------------|
| Aggression | +gain chance for ST, SP | +ATT/OE effectiveness in bouts |
| Defense | +gain chance for CN, WL | +PAR/DEF effectiveness in bouts |
| Endurance | +gain chance for CN, WL | +endurance capacity in bouts |
| Mind | +gain chance for WT, DF | +INI/DEC effectiveness in bouts |
| Healing | +injury recovery speed | -death risk from wounds |

### 4.2 Trainer Bonus Application

```
trainerBonus(attribute, trainers, warriorStyle):
  relevantTrainers = trainers where focus maps to this attribute
  bonus = sum(TIER_BONUS[t.tier] for t in relevantTrainers)
  if any trainer has styleBonusStyle === warriorStyle: bonus += 1
  return bonus * 0.05  // each point = +5% gain chance
```

**Focus → Attribute mapping:**

| Focus | Primary Attributes | Secondary |
|-------|-------------------|-----------|
| Aggression | ST, SP | — |
| Defense | CN, WL | — |
| Endurance | CN, WL | ST |
| Mind | WT, DF | — |
| Healing | — (healing only) | — |

### 4.3 Style Affinity

A trainer with `styleBonusStyle` matching the warrior's style provides +1 extra bonus to all training. This makes retired-warrior-to-trainer conversion valuable: a retired Basher trains other Bashers better.

---

## 5) Training Injury Risk

### 5.1 Chance

Training can cause minor injuries (but never death):

```
trainingInjuryChance = 0.03  // 3% base
  + (age > 30 ? (age - 30) * 0.005 : 0)  // older warriors more fragile
  - healingTrainerBonus * 0.01             // healing trainers reduce risk
```

Clamped to [0.01, 0.10].

### 5.2 Training Injuries

Training injuries are always **Minor severity** (1-3 week recovery):

| Injury | Penalty | Weeks |
|--------|---------|-------|
| Pulled Muscle | ST -1 | 1-2 |
| Twisted Knee | SP -1 | 1-2 |
| Sparring Cut | CN -1 | 1 |
| Strained Back | ST -1, CN -1 | 2-3 |
| Practice Concussion | WT -1 | 2-3 |

### 5.3 Healing Trainer Effect

A Healing-focus trainer reduces:
- Training injury chance by `TIER_BONUS * 0.01`
- Injury recovery time by `TIER_BONUS` weeks (minimum 1 week)

---

## 6) Recovery Action

### 6.1 Mechanics

A warrior assigned to **Recovery** instead of training:
- Heals injuries `1 + healingTrainerBonus` weeks faster per actual week
- Cannot fight or train
- 100% safe (no training injury risk)

### 6.2 Natural Healing vs Active Recovery

| Mode | Healing Rate | Notes |
|------|-------------|-------|
| **Natural** (fighting or idle) | 1 week per week | Default, injuries tick down normally |
| **Active Recovery** (assigned) | 1 + healingBonus weeks per week | Requires explicit assignment |
| **With Healing Trainer** | +TIER_BONUS to active recovery | Stacks |

### 6.3 Medical Costs (Economy)

Active recovery costs gold:

```
recoveryCost = 15g per warrior per week  // same as training cost
```

Already accounted for in economy system as "Training fees."

---

## 7) Learn-by-Doing (XP) Integration

### 7.1 Dual Progression Paths

Warriors improve through TWO parallel systems:

| Path | Source | Effect | Speed |
|------|--------|--------|-------|
| **Training** | Weekly assignment | +1 to chosen attribute (55% chance) | Controlled, safe |
| **XP (Learn-by-Doing)** | Fighting | +1 to random attribute every 5 XP | Uncontrolled, risky |

### 7.2 XP Gain Rules (Current Implementation)

| Trigger | XP |
|---------|-----|
| Win | +2 |
| Loss | +1 |
| Draw | +1 |
| Kill (winner only) | +1 bonus |
| Flashy tag | +1 bonus |
| Comeback tag (winner) | +1 bonus |

### 7.3 Level-Up Resolution

Every 5 XP, the warrior "levels up":
1. Select a random improvable attribute (not at max, total not at cap)
2. +1 to that attribute
3. Recompute baseSkills and derivedStats
4. Newsletter: "KRAGOS gained +1 ST through combat experience!"

**Key difference from training**: XP improvements are **random** — the player cannot choose which attribute improves. This makes training the primary lever for intentional character building.

---

## 8) AI Training

### 8.1 How AI Stables Train

AI stables train their warriors automatically each week:

```
aiTrainingDecision(warrior, ownerPersonality):
  if warrior has Severe injury → assign Recovery
  if warrior has Moderate injury and personality !== "Aggressive" → assign Recovery
  else:
    weakestAttr = lowest attribute that isn't SZ
    assign training to weakestAttr
```

AI training uses the same resolution as player training but:
- AI trainers are implied (each rival stable has an implied Novice trainer of random focus)
- AI training results appear in the gazette only for notable events (+2 or more in a single stat)

### 8.2 AI Growth Rate

AI warriors train at **80% of player training effectiveness** (lower gain chance). This gives the player a structural advantage through better management.

---

## 9) Retirement-to-Trainer Conversion

### 9.1 Eligibility

A retired warrior can become a trainer if:
- Status is "Retired"
- Has not already been converted
- Stable has fewer than `TRAINER_MAX_PER_STABLE` trainers

### 9.2 Conversion Rules (Current Implementation)

```ts
// From modules/trainers.ts
tier = fights >= 15 || kills >= 3 ? "Master"
     : fights >= 7 ? "Seasoned"
     : "Novice";

focus = styleFocusMap[warrior.style]; // e.g., Basher → Aggression
styleBonusStyle = warrior.style;      // bonus for same-style warriors
contractWeeksLeft = 52;               // 1 year
```

### 9.3 Conversion Costs

Converting a retired warrior to a trainer is **free** (the warrior earned it through service). However, the trainer still consumes a trainer slot and salary (35g/week).

### 9.4 Converted Trainer Quality

The conversion produces trainers with:
- **Style affinity**: +1 bonus for warriors of the same style
- **Fame inheritance**: trainer starts with the warrior's fame score
- **Narrative value**: gazette coverage, "KRAGOS hangs up the blade and picks up the chalk"

---

## 10) Data Model

```ts
// Enhanced training assignment
interface TrainingAssignment {
  warriorId: string;
  type: "attribute" | "recovery";  // NEW: recovery option
  attribute?: keyof Attributes;    // required if type === "attribute"
}

// Seasonal growth tracking
interface SeasonalGrowth {
  warriorId: string;
  season: Season;
  gains: Partial<Record<keyof Attributes, number>>;
}

// Add to GameState
interface GameState {
  // ... existing ...
  seasonalGrowth: SeasonalGrowth[];  // NEW
}
```

---

## 11) UI Surfaces

### 11.1 Training Page (Enhanced)

Current: assign attribute per warrior.  
**Additions:**

- **Recovery option**: radio/toggle to assign warrior to recovery instead of training
- **Seasonal growth tracker**: show how many points each attribute has gained this season (X/3 cap)
- **Training chance preview**: show estimated gain % with trainer bonuses
- **SZ locked**: SZ row greyed out with tooltip "Size cannot be trained"
- **Injury status**: show current injuries with "assign recovery" quick action
- **Mutual exclusion warning**: if warrior is in match card, show "Cannot train — fighting this week"

### 11.2 Warrior Detail (Enhanced)

- **XP bar**: show current XP and progress to next level
- **Growth history**: list of all attribute gains with source (training / XP / aging decay)
- **Trainer compatibility**: show which trainers benefit this warrior and by how much

---

## 12) Integration Points

| System | Training Provides | Training Consumes |
|--------|------------------|-------------------|
| Matchmaking | Ineligibility flag | — |
| Injuries | Healing acceleration | Active injury data |
| Economy | Training costs | Gold deduction |
| Progression (XP) | — | Parallel growth path |
| Trainers | — | Bonus calculations |
| Aging | — | Age penalties |
| Gazette | Training news items | — |
| Save State | Growth data | Persistence |

---

## 13) Acceptance Criteria

### Functional
- [ ] Warriors can be assigned to attribute training or recovery
- [ ] Training resolves at week-end with correct gain chance
- [ ] SZ cannot be trained
- [ ] Total attributes capped at 80
- [ ] Seasonal growth cap of 3 per attribute per season
- [ ] Training injury risk exists (3% base, minor only)
- [ ] Healing trainers reduce injury risk and accelerate recovery
- [ ] Active recovery heals faster than natural
- [ ] Warriors in training cannot fight
- [ ] AI stables train automatically

### Behavioral
- [ ] A new warrior with WT 17 trains faster than one with WT 7
- [ ] A 35-year-old warrior trains slower than a 20-year-old
- [ ] A Master trainer gives noticeably better results than no trainer
- [ ] Training feels like a meaningful alternative to fighting
- [ ] Seasonal caps prevent degenerate min-maxing

### Edge Cases
- [ ] Warrior at attribute cap 25: training that attribute does nothing (greyed out)
- [ ] Warrior at total cap 80: all training greyed out
- [ ] Warrior with all 3 seasonal gains used for an attribute: that attribute locked this season
- [ ] Training injury during recovery: impossible (recovery is safe)
- [ ] Trainer contract expires mid-week: bonus lost immediately

---

END OF DOCUMENT
