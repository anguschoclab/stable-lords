# Stable Lords — Orphanage & Recruitment System Spec v1.0

Generated: 2026-03-08

---

## Document Purpose

This specification defines the **complete recruitment pipeline** — how warriors enter the game world, from the FTUE orphanage through ongoing recruitment, including AI draft behavior.

It covers:
1. The Orphanage (FTUE warrior selection)
2. Post-FTUE normal recruitment
3. Recruit pool composition, refresh, and rarity
4. Pricing and signing costs
5. AI stable recruitment and draft fairness
6. Roster limits
7. Pool visibility and reroll cadence
8. How FTUE and normal recruitment differ

**Depends on:**
- Warrior Design & Creation Spec v0.3 (attribute model, style assignment)
- Economy system (`src/engine/economy.ts`)
- AI Rival Stables (`src/engine/rivals.ts`)

**Consumed by:**
- `src/pages/Orphanage.tsx` (FTUE)
- `src/pages/Recruit.tsx` (normal recruitment)
- `src/engine/rivals.ts` (AI draft)
- `src/state/gameStore.ts` (roster management)

---

## 1) Design Intent

### Player Value
- **First impressions**: The Orphanage is the player's first decision. It must feel meaningful, not random.
- **Ongoing agency**: Post-FTUE recruitment is the primary way to expand and replace the roster.
- **Scarcity**: Warriors are not infinite. The pool is limited, quality varies, and good warriors cost more.
- **Fairness**: AI stables recruit from the same pool with the same rules (but worse decision-making).

### Core Principle
> Every warrior is a commitment. Recruitment is not shopping — it's scouting, evaluating, and investing.

---

## 2) The Orphanage (FTUE)

### 2.1 Flow

1. Player names stable and owner (StartGame page)
2. Player enters Orphanage with 8 pre-built warriors
3. Player selects 3 warriors
4. Tutorial bout runs between first 2 selected
5. Summary screen → enter main game

### 2.2 Orphanage Pool

The FTUE pool is **fixed and curated** (not random):

| Warrior | Style | Key Attributes | Role |
|---------|-------|---------------|------|
| KRAGOS | Basher | ST 17, CN 14 | Aggressive tank — teaches "power wins early" |
| SILVANE | Parry-Riposte | WT 15, WL 11 | Counter-fighter — teaches "patience wins" |
| THORNE | Lunger | SP 13, ST 12 | Speed demon — teaches "aggression has cost" |
| ASHARA | Aimed-Blow | WT 17, DF 14 | Precision — teaches "skill > stats" |
| GORLAK | Wall of Steel | ST 14, CN 13, WL 13 | Grinder — teaches "endurance matters" |
| VEXIA | Slasher | SP 11, DF 11 | Balanced offense — teaches "consistency" |
| FERRIK | Striker | ST 15, WL 12 | Straightforward — teaches "simplicity works" |
| MORKA | Total-Parry | CN 16, WL 15 | Defense wall — teaches "defense is a win condition" |

### 2.3 Why 8 Warriors, Choose 3

- **8 covers all style archetypes**: offensive (BA, LU, SL, ST), defensive (TP, WS), hybrid (PR, PL → AB, PL mapped to AB and PL)
- **Choose 3**: forces a composition decision. All-offense, all-defense, or mixed?
- **Tutorial bout uses first 2**: demonstrates combat with warriors the player chose (investment in outcome)

### 2.4 FTUE Differences from Normal Recruitment

| Aspect | FTUE | Normal |
|--------|------|--------|
| Cost | Free | 150g per warrior |
| Pool size | 8 fixed warriors | 4-6 randomized warriors |
| Pool quality | Curated, balanced | Random with rarity tiers |
| Selection count | Must pick exactly 3 | Pick 1 at a time |
| Roster limit | N/A (empty roster) | Max 10 warriors |
| Tutorial bout | Mandatory | N/A |

---

## 3) Normal Recruitment (Post-FTUE)

### 3.1 The Recruit Pool

After FTUE, the player accesses the **Recruit Page** to hire new warriors.

**Pool composition:**
- 4-6 warriors available at any time
- Pool refreshes on a cadence (see §3.4)
- Each warrior has a **quality tier** affecting attributes and cost

### 3.2 Quality Tiers

| Tier | Total Attributes | Probability | Cost | Visual |
|------|-----------------|-------------|------|--------|
| **Common** | 66-70 | 50% | 100g | No badge |
| **Promising** | 70-74 | 30% | 150g | ⭐ badge |
| **Exceptional** | 74-78 | 15% | 250g | ⭐⭐ badge |
| **Prodigy** | 78-82 | 5% | 400g | ⭐⭐⭐ badge |

**Attribute distribution**: Total points distributed randomly across 7 attributes with a floor of 3 each and ceiling of 21 (recruit cap — not the trained max of 25). This ensures room for growth.

**Style assignment**: Random, weighted slightly toward styles underrepresented in the current arena.

### 3.3 Recruit Warrior Generation

```ts
function generateRecruit(rng: () => number, tier: RecruitTier): PoolWarrior {
  const totalPoints = TIER_POINTS[tier];
  const attrs = distributeAttributes(rng, totalPoints, { min: 3, max: 21 });
  const style = weightedStylePick(rng); // slight weight toward underrepresented
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  
  return {
    id: generateId(),
    name: generateWarriorName(rng),
    style,
    attrs,
    baseSkills,
    derivedStats,
    tier,
    cost: TIER_COST[tier],
    age: 16 + Math.floor(rng() * 6), // 16-21
    lore: generateLore(rng, style, tier),
  };
}
```

### 3.4 Pool Refresh Cadence

| Trigger | Effect |
|---------|--------|
| **Weekly auto-refresh** | 1-2 warriors replaced each week (not full reset) |
| **Manual refresh** | Player can pay 50g to refresh entire pool |
| **Season change** | Full pool reset with fresh warriors |
| **After a death** | +1 warrior added to pool next week |

**Partial refresh logic**: Each week, the oldest 1-2 warriors in the pool are removed and replaced with newly generated ones. This simulates warriors "moving on" if unclaimed.

### 3.5 Visibility

The recruit page shows:
- Warrior name, style, age
- Full attribute spread (no hidden stats — you're buying, not scouting)
- Derived stats (HP, Endurance, Damage, Encumbrance)
- Quality tier badge
- Cost in gold
- Brief lore blurb
- "Recruit" button (disabled if can't afford or roster full)

---

## 4) Pricing

### 4.1 Recruit Costs

| Quality | Cost | Economy Context |
|---------|------|----------------|
| Common | 100g | ~2 weeks of base income for a small stable |
| Promising | 150g | Current flat rate. Affordable but not trivial. |
| Exceptional | 250g | Requires saving or winning fights. |
| Prodigy | 400g | Major investment. Might require selling/firing. |

### 4.2 Cost Modifiers

Future expansion: costs could be modified by:
- Arena reputation (famous stables get discounts)
- Season (off-season warriors are cheaper)
- Supply (fewer available warriors = higher costs)

For v1.0: costs are fixed by tier.

### 4.3 Signing Bonus (New)

When a warrior is recruited, the player may optionally pay a **signing bonus** (+50g) to:
- Start the warrior with 2 XP instead of 0
- Add a random Minor flair tag
- Gazette mention: "STABLE signs promising newcomer NAME"

This is a soft prestige feature, not a power boost.

---

## 5) AI Recruitment

### 5.1 How AI Stables Recruit

AI stables recruit from the **same pool system** but with automated decision-making:

```
aiRecruitDecision(rival, availablePool):
  if rival.roster.filter(active).length >= 4: return null  // roster full enough
  if rival.roster.filter(active).length <= 1: MUST recruit  // critical need
  
  // Score available warriors
  for each warrior in pool:
    score = styleFitScore(warrior.style, rival.owner.personality)
          + qualityScore(warrior.tier)
          - costPenalty(warrior.cost, rival.impliedGold)
  
  pick = highest scoring warrior
  return pick
```

### 5.2 AI Draft Order

When both the player and AI could recruit the same warrior:
- **Player always gets first pick** within a week
- AI recruitment happens at week-end (during `advanceWeek`)
- If the player recruits a warrior, AI cannot claim them
- This gives the player a structural advantage in recruitment

### 5.3 AI Recruitment Cadence

- AI stables check for recruitment every 4 weeks
- AI stables will recruit if their active roster drops below 2 warriors
- AI stables never have more than 5 warriors (smaller than player max of 10)

### 5.4 Personality-Based Style Preference

| Personality | Preferred Styles | Avoid |
|------------|-----------------|-------|
| Aggressive | BA, LU, SL, ST | TP |
| Methodical | PS, PR, WS | LU |
| Showman | AB, SL, LU | TP |
| Pragmatic | ST, PS, WS | AB |
| Tactician | PR, PL, AB | BA |

---

## 6) Roster Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Player max roster | 10 | Manageable for weekly planning |
| Player min roster | 0 (but game warns below 2) | Freedom to rebuild |
| AI max roster | 5 | Smaller to keep player feeling dominant |
| AI min roster | 1 | Always have at least one opponent |

### 6.1 Over-Limit Handling

If a player is at roster max (10):
- Recruit button disabled with "Roster full — retire or release a warrior"
- Release action: warrior is removed from roster permanently (not retired, not dead — just released)
- Released warriors may appear in the recruit pool later (recycled names)

---

## 7) Warrior Name Generation

### 7.1 Name Pool

Names are drawn from a curated pool of ~100+ arena-appropriate names:
- ALL CAPS (canonical Duelmasters convention)
- 4-8 characters
- Phonetically distinct
- No real-world names

### 7.2 Uniqueness

- No two warriors in the same arena may share a name
- Names of dead warriors are retired (cannot be reused while in graveyard)
- Names of retired warriors may be reused after 52 weeks

### 7.3 Lore Blurbs

Each recruit has a 1-2 sentence lore blurb generated from templates:

```ts
const LORE_TEMPLATES = [
  "Found fighting for scraps in the pit districts. {style_description}.",
  "Orphaned at twelve, trained in the yards. {attribute_highlight}.",
  "A former soldier who lost everything. Now fights for glory.",
  "Quiet, watchful, and deadly. {style_description}.",
  "Born in the arena's shadow. {attribute_highlight}.",
];
```

---

## 8) Data Model

```ts
type RecruitTier = "Common" | "Promising" | "Exceptional" | "Prodigy";

interface PoolWarrior {
  id: string;
  name: string;
  style: FightingStyle;
  attributes: Attributes;
  baseSkills: BaseSkills;
  derivedStats: DerivedStats;
  tier: RecruitTier;
  cost: number;
  age: number;
  lore: string;
  addedWeek: number;  // when this warrior entered the pool
}

// Add to GameState
interface GameState {
  // ... existing ...
  recruitPool: PoolWarrior[];  // NEW: replaces implicit generation
}
```

---

## 9) UI Surfaces

### 9.1 Recruit Page (Enhanced)

Current: WarriorBuilder (manual attribute allocation).
**New model**: Two tabs:

| Tab | Description |
|-----|-------------|
| **Scout Pool** | Browse available pre-generated recruits with full stats, tier badges, costs |
| **Custom Build** | Current WarriorBuilder for players who want full control (costs 200g flat) |

### 9.2 Scout Pool Tab

- Grid of 4-6 warrior cards
- Each card shows: Name, Style, Age, Tier badge, Attributes, Derived stats, Cost, Lore
- "Recruit" button per card
- "Refresh Pool" button (50g)
- Gold display in header
- Roster count: "X/10 warriors"

### 9.3 Custom Build Tab

- Current WarriorBuilder interface
- Fixed cost: 200g (premium for full control)
- All validation rules from Warrior Design Spec apply
- Tip: "Custom warriors start with fewer total attributes (66) but you choose the distribution"

---

## 10) Integration Points

| System | Recruitment Provides | Recruitment Consumes |
|--------|---------------------|---------------------|
| Roster | New warriors | Roster count / limit |
| Economy | Cost deductions, ledger entries | Gold balance |
| Gazette | "Signed newcomer" stories | — |
| AI Rivals | AI recruitment events | Rival roster needs |
| Matchmaking | Eligible warriors | — |
| Training | Warriors to train | — |
| Save State | Pool + roster persistence | — |

---

## 11) Acceptance Criteria

### Functional
- [ ] FTUE presents 8 curated warriors, player picks 3
- [ ] Post-FTUE recruit page shows 4-6 random warriors with tier/cost
- [ ] Quality tiers appear at correct probabilities
- [ ] Costs deduct correctly from gold and create ledger entries
- [ ] Pool partially refreshes weekly (1-2 warriors cycled)
- [ ] Manual refresh costs 50g and replaces entire pool
- [ ] Season change fully refreshes pool
- [ ] AI stables recruit from same pool with draft order disadvantage
- [ ] Roster limit of 10 enforced
- [ ] Warrior names are unique within the arena

### Behavioral
- [ ] A player with 500g starting gold can recruit 2-3 Common warriors
- [ ] Prodigy warriors feel rare and valuable (5% chance)
- [ ] AI stables maintain 2-5 warrior rosters through recruitment
- [ ] The pool feels fresh each week without being overwhelming
- [ ] Custom build option exists for players who want control

### Player Experience
- [ ] FTUE warriors have distinct identities (lore, stats, style)
- [ ] Recruit cards provide enough info to make informed decisions
- [ ] Cost creates meaningful scarcity without frustration
- [ ] "No warriors available" never happens (pool always has at least 2)

---

END OF DOCUMENT
