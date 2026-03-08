# Stable Lords — Matchmaking, Scheduling & Cross-Stable Combat Spec v1.0

Generated: 2026-03-08

---

## Document Purpose

This specification defines **who fights whom, when, and why** in Stable Lords.  
It closes the integration gap between stable management and bout resolution by specifying:

1. Weekly match scheduling and booking rules
2. Cross-stable matchmaking (player vs AI, AI vs AI)
3. Rest rules and injury-gated eligibility
4. Repeat-matchup avoidance and rivalry-influenced booking
5. Roster disruption handling (death, injury, retirement mid-season)
6. How matchmaking feeds into bout resolution, fame, gazette, and chronicle

**Depends on:**
- Warrior Design & Creation Spec v0.3
- Dueling Bout System & Style × Style Matchup Matrix v0.1
- AI Dueling Behavior Spec v0.1
- Equipment & Encumbrance Spec v0.1
- Strategy Editor Spec v1.0 (companion doc)
- Injury/Recovery Spec (embedded in code: `src/engine/injuries.ts`)
- AI Rival Stables (`src/engine/rivals.ts`)

**Consumed by:**
- `src/pages/RunRound.tsx` (weekly bout execution)
- `src/pages/Tournaments.tsx` (bracket play)
- `src/engine/rivals.ts` (AI stable participation)
- `src/engine/crowdMood.ts` (mood from match quality)
- Gazette / Newsletter system

---

## 1) Design Intent

### Player Value
- **Agency**: Players choose *which* warriors fight (via roster management), but not *whom* they fight. Matchmaking provides opposition.
- **Stakes**: Every week, the player's warriors are tested against external threats they cannot fully predict or control.
- **Narrative**: Cross-stable rivalries emerge naturally from repeated matchups, kills, and fame differential.

### Core Principle
> The arena books fights. The player manages the stable. The intersection is where strategy lives.

---

## 2) Weekly Match Cycle

### 2.1 Phases per Week

| Phase | Timing | Description |
|-------|--------|-------------|
| **Management** | Before \"Run Round\" | Player assigns training, adjusts plans, equips warriors |
| **Booking** | On \"Run Round\" click | Matchmaker generates pairings |
| **Resolution** | Immediate after booking | Bouts simulated in sequence |
| **Processing** | After all bouts | XP, injuries, fame, economy, gazette |
| **Advance** | End | Week counter increments, season checks |

### 2.2 Match Card Size

- **Target bouts per week**: `floor(eligiblePlayerWarriors / 2) + aiVsAiBouts`
- **AI vs AI bouts**: `max(2, rivalStableCount)` — these happen in the background and generate gazette entries
- **Minimum**: 1 player bout + 1 AI bout per week (if warriors available)
- **Maximum**: No hard cap, but bout count scales with roster size

---

## 3) Eligibility Rules

A warrior is **eligible to fight** if ALL of:

| Rule | Check | Reference |
|------|-------|-----------|
| Status is \"Active\" | `w.status === \"Active\"` | types/game.ts |
| Not severely injured | `!isTooInjuredToFight(injuries)` | injuries.ts |
| Not resting | `!isResting(w, state.week)` | New: see §3.1 |
| Not in training this week | `!trainingAssignments.find(a => a.warriorId === w.id)` | Mutual exclusion |

### 3.1 Rest Rule (New)

After a bout, a warrior gains a **fatigue flag** for 0–1 weeks based on bout intensity:

```ts
interface RestState {
  warriorId: string;
  restUntilWeek: number; // warrior cannot fight until this week
}
```

**Rest duration:**
- Normal bout (win or loss by Exhaustion/Stoppage): 0 weeks (fight next week)
- KO loss: 1 week mandatory rest
- Kill (winner): 0 weeks
- Any bout with a Severe injury: determined by injury recovery, not rest rule

**Design note**: Rest is light by design. The injury system provides the real gating. Rest exists to prevent the same warrior from fighting every single week without pause, preserving the management decision of \"who do I field?\"

### 3.2 Training Exclusion

A warrior assigned to training **cannot fight that week**. This is a meaningful management trade-off:
- Train → guaranteed growth chance, no risk, no fame
- Fight → XP, fame, risk of injury/death, no training gain

---

## 4) Matchmaking Algorithm

### 4.1 Player Warriors: Cross-Stable Pairing

Player warriors are matched **against rival stable warriors**, not against each other (post-FTUE).

```
Algorithm: WeeklyMatchmaking(playerRoster, rivalStables)
  1. Collect eligible player warriors → playerPool
  2. Collect eligible rival warriors → rivalPool (all stables combined)
  3. For each warrior in playerPool:
     a. Score all rivalPool candidates (see §4.2)
     b. Pick highest-scoring unpaired candidate
     c. Pair them; remove both from pools
  4. Remaining unpaired player warriors sit out (gazette note: \"no opponent available\")
  5. Return pairings[]
```

### 4.2 Matchmaking Scoring

Each potential pairing (player warrior P, rival warrior R) is scored:

```
score = baseScore
      + fameProximityBonus(P.fame, R.fame)
      + rivalryBonus(P, R)
      + styleDiversityBonus(P.style, R.style, recentHistory)
      - repeatPenalty(P, R, recentHistory)
      + randomJitter
```

| Factor | Weight | Description |
|--------|--------|-------------|
| `baseScore` | 100 | Ensures any match is possible |
| `fameProximityBonus` | 0–30 | Prefer opponents within ±5 fame. `30 - abs(P.fame - R.fame) * 3` clamped to 0 |
| `rivalryBonus` | 0–50 | If P's stable and R's stable have an active rivalry, +50 |
| `styleDiversityBonus` | 0–20 | +20 if this style matchup hasn't occurred in last 4 weeks |
| `repeatPenalty` | -100 | -100 if P fought R in the last 2 weeks |
| `randomJitter` | 0–15 | Seeded random to prevent deterministic booking |

### 4.3 AI vs AI Background Bouts

Each week, rival stables also fight each other:

```
Algorithm: AIvsAI(rivalStables)
  1. Collect all eligible rival warriors across stables
  2. Pair warriors from DIFFERENT stables (never same-stable)
  3. Simulate bouts (same engine, same rules)
  4. Update rival warrior records (W/L/K, fame)
  5. Generate gazette entries for notable outcomes (kills, upsets)
  6. Feed results into meta drift and crowd mood
```

**AI bout count**: `min(totalEligibleRivalWarriors / 2, 4)` per week — enough to keep the world alive without overwhelming the gazette.

### 4.4 Rivalry Detection

A **rivalry** is automatically detected when:

```ts
interface Rivalry {
  stableIdA: string;
  stableIdB: string;
  intensity: number; // 1-5
  reason: string;    // \"KRAGOS killed BRUTUS in Week 4\"
  startWeek: number;
}
```

Triggers:
- A kill between stables → intensity 3 + rivalry created
- 3+ bouts between same stables in 8 weeks → intensity 1
- Tournament elimination → intensity 2
- Existing rivalry + another kill → intensity +2 (max 5)

Rivalry effects:
- +50 matchmaking score (more likely to be paired)
- +1 fame multiplier for bouts between rivals
- Gazette special coverage (\"The blood feud between X and Y continues...\")

---

## 5) Tournament Matchmaking

Tournaments use a **separate bracket system** (already implemented in `Tournaments.tsx`):

- Entry: all active, non-injured, non-resting player warriors
- Bracket: single elimination, randomized seeding
- AI warriors may be seeded into tournaments if player roster < 8 (fills the bracket)
- Tournament bouts follow the same resolution engine but with:
  - +1 crowd mood bonus (Festive modifier)
  - Kill desire +1 for all warriors (higher stakes)
  - Champion receives fame +5, popularity +3, title

### 5.1 Tournament Scheduling

- One tournament per season (every 13 weeks)
- Auto-triggered at week 1 of each season if `settings.featureFlags.tournaments === true`
- Player can decline (no penalty, but no rewards)

---

## 6) Roster Disruption Handling

| Event | Effect on Schedule |
|-------|-------------------|
| **Death** | Immediate removal. Opponent gets a \"bye\" if mid-round. |
| **Severe Injury** | Warrior ineligible until healed. No replacement. |
| **Retirement** | Warrior removed from pool. Newsletter note. |
| **All warriors injured** | Week skipped for that stable. Gazette: \"stable rests.\" |
| **Rival stable eliminated** | New rival stable generated at next season boundary. |

### 6.1 Minimum Viable Arena

The arena requires **at least 2 eligible warriors across all stables** to run a week. If fewer:
- Skip combat phase
- Process only economy, training, aging
- Gazette: \"A quiet week in the arena. No challengers stepped forward.\"

---

## 7) Data Model Additions

```ts
// Add to GameState
interface GameState {
  // ... existing fields ...
  restStates: RestState[];       // warriors on mandatory rest
  rivalries: Rivalry[];          // detected cross-stable rivalries
  matchHistory: MatchRecord[];   // last 8 weeks of pairings for repeat avoidance
}

interface RestState {
  warriorId: string;
  restUntilWeek: number;
}

interface Rivalry {
  stableIdA: string;
  stableIdB: string;
  intensity: number;
  reason: string;
  startWeek: number;
}

interface MatchRecord {
  week: number;
  playerWarriorId: string;
  opponentWarriorId: string;
  opponentStableId: string;
}
```

---

## 8) UI Surfaces

### 8.1 Run Round Page (Enhanced)

Current: shows results only.  
**New additions:**

- **Pre-bout card**: Before clicking \"Simulate Round,\" show the upcoming match card:
  - Each pairing with warrior names, styles, fame, injury status
  - Rivalry indicator (🔥 icon) on rivalry bouts
  - \"Rest\" badges on warriors sitting out
  - AI vs AI bout count indicator
- **Post-bout**: Results as current, plus AI bout summary section

### 8.2 Dashboard Gazette

AI vs AI bout results appear as gazette items:
- \"In rival action: BRUTUS (Iron Wolves) defeated SHADE (Blood Ravens) by KO.\"
- \"A quiet week in the rival arenas — no notable bouts.\"

### 8.3 Rivalry Panel (New)

On Dashboard or dedicated sub-section:
- Active rivalries with intensity meter
- Kill history between stables
- \"Most Wanted\" — rival warrior with most wins against player

---

## 9) Integration Points

| System | Matchmaking Provides | Matchmaking Consumes |
|--------|---------------------|---------------------|
| Bout Engine | Pairing data (warrior refs, plans) | Fight outcomes |
| Injury System | — | Eligibility checks |
| Fame/Crowd | — | Rivalry bonuses |
| Economy | — | Fight purse triggers |
| Gazette | Bout summaries, AI results | — |
| Meta Drift | AI bout style data | — |
| Scouting | — | Rival warrior data |
| Progression | — | XP triggers |

---

## 10) Acceptance Criteria

### Functional
- [ ] Player warriors fight rival warriors, not each other (outside FTUE/tournaments)
- [ ] AI vs AI bouts happen each week and update rival records
- [ ] Repeat matchups are avoided for 2 weeks
- [ ] Severely injured warriors cannot be booked
- [ ] Warriors in training cannot fight
- [ ] Rivalries are auto-detected from kills
- [ ] Rivalry bouts get gazette coverage
- [ ] Tournament brackets can include AI warriors as fill

### Behavioral
- [ ] A new player with 3 warriors sees 1-3 bouts per week
- [ ] No warrior fights the same opponent 3 weeks in a row
- [ ] Killing a rival's warrior creates a visible rivalry
- [ ] AI stables develop their own win/loss records over a season
- [ ] The gazette feels alive even when the player doesn't run a round (AI activity)

### Edge Cases
- [ ] 0 eligible warriors → week skipped gracefully
- [ ] 1 eligible warrior → no combat, newsletter note
- [ ] All rival stables eliminated → new stables generated
- [ ] Rivalry intensity cannot exceed 5
- [ ] Rest states clear correctly on week advance

---

END OF DOCUMENT
