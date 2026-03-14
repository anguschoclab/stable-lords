# Stable Lords — Kill, Death, and Permadeath Specification v0.2

## 1. Purpose
This document defines how kills, fatal outcomes, hit-location lethality, and permanent consequences should work in Stable Lords.

It expands the existing combat, death, UI, FTUE, Chronicle, Gazette, and reputation design into one focused specification that answers:
- what a kill is
- when a death can happen
- how the player can influence lethality
- how hit location changes death chance
- how the game should surface risk before, during, and after a bout
- what permanent consequences must happen to the dead warrior, killer, stable, and world
- how kill rate and permadeath should be tuned so the game remains brutal, meaningful, and legible

This document does not replace the core bout system, strategy editor, equipment spec, combat log spec, or design bibles. It binds them together into one implementation-ready death and permanence contract.

---

## 2. Design Philosophy

### 2.1 Death must have weight
Stable Lords is not a disposable character battler. A death is a major world event.
A dead warrior is gone from active play permanently and becomes part of the world’s historical memory.

### 2.2 Kills must feel earned, not random
Players should not feel that deaths happen from arbitrary spikes or opaque hidden rolls.
Fatal outcomes should emerge from visible conditions such as:
- accumulated damage
- endurance collapse
- gear mismatch
- bad matchup pressure
- aggressive strategy
- a successfully exploited kill window

### 2.3 The player should influence lethality indirectly
The player should rarely “press a kill button.”
Instead, the player affects lethality through preparation, style choice, loadout, matchup selection, and strategy.

### 2.4 Permadeath must create legacy, not only punishment
Deaths must matter emotionally and systemically.
They should feed Chronicle, Gazette, Hall of Warriors, stable identity, rivalry memory, leaderboards, and future world tone.

### 2.5 Always readable
At every stage, the player must understand:
- how dangerous a fight is
- why a death happened
- what changed because of it

---

## 3. Definitions

### 3.1 Kill
A kill is a bout-ending fatal result where one warrior causes the death of another through simulation-valid combat events.

### 3.2 Death
Death is the permanent state transition from ACTIVE to DEAD.
A dead warrior:
- may not be fielded again
- may not be healed back into play
- remains visible in history, records, and memorial surfaces

### 3.3 Permadeath
Permadeath is the rule that death is irreversible in the default ruleset.
Only optional house rules may alter this, and any such alteration must be explicitly labeled as non-canonical.

### 3.4 Fatal finish
A fatal finish is a kill that occurs after a valid kill window is opened and converted.
This is the preferred canonical path for most deaths.

### 3.5 Stoppage
A stoppage is a non-fatal bout ending caused by incapacitation, inability to continue, or official intervention.
A stoppage can still produce injury and long-term consequences.

### 3.6 Yield
A yield is a rare, honor-driven, non-fatal resolution. It should be uncommon and style/temperament dependent.

### 3.7 Kill window
A kill window is a state where the target is vulnerable to fatal conversion because multiple danger conditions have aligned.

---

## 4. Outcome Taxonomy
Every bout must end in exactly one of the following:
- KILL
- STOPPAGE
- YIELD
- DECISION
- DRAW

### 4.1 KILL subtypes
Each kill should also classify into one primary cause bucket:
- Fatal damage overflow
- Execution after kill window
- Critical injury chain
- Fatigue-collapse conversion
- Armor failure / exposed-location conversion
- Rivalry finish

This subtype is used for analytics, Chronicle phrasing, Gazette synthesis, and AI/world reaction.

---

## 5. Core Death Logic

### 5.1 Baseline death conditions
A warrior may die only when at least one of the following is true:
- damage exceeds fatal tolerance threshold
- critical injuries stack past survivability threshold
- a valid execution event resolves during an open kill window

### 5.2 Canonical kill-window gate
A kill window opens only when all required conditions are met:
- target HP is below the configured threshold band
- target endurance is below the fatigue breakpoint or fully collapsed
- defender fails PAR and/or DEF on the decisive exchange
- attacker passes DEC resolution

### 5.3 No cheap deaths rule
A bout should not produce a fatality from a healthy, unworn target unless the matchup, weapon, and hit severity genuinely justify it.
The common path to death should be:
pressure -> damage -> fatigue -> opening -> conversion
not:
one unexplained roll -> dead

### 5.4 Fatality pacing by phase
- Opening phase: low fatality probability except in extreme mismatches or precision/ambush scenarios
- Mid-bout: meaningful injury accumulation, some kill windows begin to appear
- Late-bout: highest fatality pressure because fatigue, DEC, and defense failure all matter more

---

## 6. Kill Rate Tuning Targets
These are world-balance targets, not hard guarantees.

### 6.1 Recommended default rates
- Normal weekly arena bouts: 8% to 15% kill rate
- More violent arenas / bloodthirsty crowd states: 15% to 25%
- Tournaments, rivalry bouts, or heavy mismatch fights: may spike above that situationally
- Global average above 25% should be treated as intentionally brutal and non-default
- Global average below 5% should be treated as too low for kill-driven fame and notoriety systems to matter

### 6.2 Design intent
The default world should feel dangerous, but not like every fight is a slaughter.
Deaths should be remembered partly because they are not routine.

### 6.3 Tuning guidance
The system should be tuned so that:
- defensive play can meaningfully suppress kills
- aggressive play can materially raise kill chance
- kill-focused builds still require setup and opportunity
- high kill rates come from specific conditions, not universal baseline brutality

---

## 7. How the Player Affects Kill Rate
The player should influence lethality through readable levers.

### 7.1 Strategy plan
The player’s plan should be the strongest direct lever.
Higher OE / AL / DEC should generally:
- increase attack volume or commitment
- widen exposure on both sides
- improve kill conversion when windows appear

Lower-risk plans should:
- reduce lethal conversion
- increase decisions, defensive bouts, and non-fatal outcomes

### 7.2 Style selection
Styles should influence:
- how often kill windows appear
- how effectively those windows are converted
- whether the style thrives in attrition, precision, pressure, or denial

Aggressive or pressure-heavy styles should create more lethal environments.
Deep-defense styles should reduce easy conversions but may still die once collapse arrives.

### 7.3 Matchup selection
Players should be able to affect lethality by choosing who fights whom.
Kill odds should rise when the player creates:
- favorable style matchups
- endurance mismatches
- gear mismatches
- inexperienced vs seasoned pairings
- wounded or poorly prepared opponents vs healthy specialists

### 7.4 Equipment and encumbrance
Loadout must matter heavily.
Players should be able to push lethality upward with:
- stronger damage profiles
- armor penetration
- reach or high-finish weapons
- lighter kits that preserve tempo and pressure

Players should be able to reduce lethality with:
- defensive shields
- mitigation-heavy armor
- safer encumbrance bands
- gear that preserves survivability and endurance

### 7.5 Stable identity and training
Over time the player should shape stable lethality indirectly by training toward:
- aggression
- endurance pressure
- technical defense
- decisive finish behavior
- honorable restraint

### 7.6 Crowd and arena context
Players do not fully control arena temperament, but should be able to read and respond to it.
A bloodthirsty arena makes aggressive play more rewarding and more dangerous.
A solemn or calm arena should dampen kill pressure and shift rewards toward technical success or honor.

---

## 8. System Inputs That Influence Lethality

### 8.1 Fighter build inputs
- HP
- endurance
- damage rating
- activity rating
- ATT / PAR / DEF / INI / RIP / DEC
- style
- current injuries

### 8.2 Fight context inputs
- crowd mood
- tournament stakes
- rivalry heat
- arena ruleset
- fatigue carried into the bout
- equipment legality / freeze state

### 8.3 Tactical inputs
- OE
- AL
- DEC
- target location choices
- protect location choices
- tactic suitability

### 8.4 Gear inputs
- armor mitigation by damage type
- helm mitigation on head hits
- shield coverage and parry bonuses
- initiative penalties
- endurance cost multipliers
- weapon penetration and damage profile
- requirement failures and warnings

---

## 9. Hit-Location Lethality Model
Hit location affects death chance in two layers:
1. **Direct lethality:** how much immediate injury, criticality, and survivability pressure a landed hit creates.
2. **Kill-window conversion:** how strongly that location helps open or convert a fatal kill window later.

Hit location should not usually override the core kill-window structure. Instead, it should shape how quickly a warrior reaches a fatal state and how dangerous a finishing exchange becomes.

### 9.1 Design principles
- Head hits should be the most dangerous per hit.
- Chest hits should be the most common all-around lethal path.
- Arm hits should be primarily setup hits that degrade defense and weapon control.
- Leg hits should be primarily setup hits that degrade tempo, footing, and endurance stability.
- Severe head or chest criticals may sometimes bypass the usual pacing, but this should be rare and clearly justified by damage, armor failure, and fight context.

### 9.2 Hit-location lethality table
| Hit Location | Direct Death Influence | Main Role in the System | Typical System Effects | Finishing Conversion Weight | Notes |
|---|---:|---|---|---:|---|
| **Head** | **Very High** | Criticality / spike lethality | High critical injury chance, strongest per-hit fatal pressure, helm-sensitive outcomes | **Very High** | Best per-hit kill location; should be rare enough to stay dramatic |
| **Chest / Torso** | **High** | Fatal throughput / reliable kill path | Strong HP loss, major wound stacking, armor- and shield-sensitive | **High** | Most likely to drive total kills across the whole game because it is a common target zone |
| **Arms** | **Low direct / Medium indirect** | Defensive breakdown | PAR loss, weapon control degradation, riposte loss, exposed follow-up states | **Medium** | Usually should not kill alone; makes later kill windows easier to open |
| **Legs** | **Low direct / Medium indirect** | Tempo breakdown / collapse setup | INI loss, movement/positioning loss, rising endurance cost, fall/collapse risk | **Medium** | Strong setup zone for attrition and late-bout finishing |

### 9.3 Suggested location weighting model
Use hit location to apply a **location profile** rather than a raw death roll.
Each location contributes to some combination of:
- HP loss multiplier
- critical injury chance
- future PAR/DEF penalty pressure
- future INI/mobility penalty pressure
- kill-window conversion bonus

Recommended qualitative weighting:
- **Head:** high critical multiplier, moderate-to-high damage multiplier, strongest execution bonus
- **Chest:** high damage multiplier, moderate critical multiplier, strong execution bonus
- **Arms:** low damage multiplier, moderate control-debuff multiplier, moderate follow-up vulnerability
- **Legs:** low-to-moderate damage multiplier, high mobility/fatigue-debuff multiplier, moderate follow-up vulnerability

### 9.4 Location-specific rules
#### Head
- Helm mitigation applies here and matters a great deal.
- Head hits should have the highest chance to create critical injury states.
- Repeated head hits should stack fatal pressure quickly.
- A clean unprotected head hit from a high-damage weapon may create an exceptional fast-fatal path, but only rarely.

#### Chest / Torso
- Shield coverage and torso armor should strongly matter here.
- This should be the most dependable route to a clean earned kill across many styles.
- Torso hits should be a major driver of accumulated damage, injury thresholds, and late-bout executions.

#### Arms
- Arm hits should reduce parry quality, weapon handling, and riposte effectiveness.
- They should mostly kill by making the next exchange worse, not by ending the fight directly.
- Narration should frame these as setup wounds, maiming blows, or control losses.

#### Legs
- Leg hits should reduce initiative, mobility, and defensive repositioning.
- They should contribute strongly to fatigue collapse and inability to escape pressure.
- They should often explain why a warrior starts losing exchanges late rather than why the warrior died instantly.

### 9.5 Death-chance composition formula
A useful mental model is:

`fatalPressure = locationSeverity + postArmorDamage + critState + fatigueCollapse + defenseFailure + DECCommitment + styleContext + gearContext`

Where hit location primarily contributes to:
- `locationSeverity`
- `critState`
- future `defenseFailure`
- future `fatigueCollapse`

### 9.6 UI implications for hit location
Pre-bout and post-bout UI should surface hit-location logic clearly:
- pre-bout risk hints should mention head vulnerability, shield coverage, or torso exposure where relevant
- highlight log should explicitly call out decisive head/chest hits and arm/leg setup wounds
- bout summary should explain when a death came from repeated head trauma, torso attrition, arm breakdown, or leg-driven collapse

### 9.7 Analytics requirements for hit location
Track at minimum:
- fatality rate by hit location
- kill-window openings by prior location chain
- executions by final hit location
- critical injuries by location
- style × location lethality distribution
- weapon family × location lethality distribution

---

## 10. Crowd Mood and Lethality
Crowd mood must affect both the emotional texture and the actual kill environment.

### 10.1 Suggested behavior by mood
- Calm: lower kill pressure, more appreciation for technical control
- Bloodthirsty: greater aggression incentives, higher kill conversion pressure
- Theatrical: rewards dramatic swings and near-finishes; moderate lethality uplift
- Solemn: suppresses bloodlust, emphasizes tragedy and aftermath if death occurs
- Festive: increases spectacle value, but does not necessarily equal maximum lethality

### 10.2 Mood effects should not override simulation
Crowd mood can bias probabilities and rewards, but it must not produce deaths by itself.
It changes pressure, not reality.

---

## 11. Fame, Notoriety, Honor, and Stable Identity
A kill must affect reputation systems differently depending on context.

### 11.1 Killer gains
A killer may gain:
- notoriety always, or almost always
- fame often, especially in dramatic or high-profile bouts
- rivalry heat if the victim had history with them
- title progress for kill-centric awards

### 11.2 Victim legacy
The fallen warrior may still gain:
- Chronicle prominence
- martyr-like crowd memory in some contexts
- memorial recognition
- rivalry closure or escalation for surviving associates

### 11.3 Stable-level effects
A death should update stable identity, not just individual stats.
Possible effects:
- Fame change
- Notoriety change
- Honor change depending on bout tone and finish context
- morale or confidence shifts
- roster urgency and recruitment pressure

### 11.4 Honor-sensitive handling
Not every kill should be celebrated the same way.
The system should recognize distinctions such as:
- clean earned finish
- brutal execution of a collapsed opponent
- revenge/rivalry kill
- dishonorable-feeling overkill

These distinctions should affect crowd response and narrative tone.

---

## 12. Warrior State Transition Rules

### 12.1 On death
When a warrior dies, the game must atomically perform all of the following:
1. set `status = DEAD`
2. lock the warrior out of all active roster and matchmaking flows
3. stamp death metadata
4. append bout result to fight history
5. generate Chronicle entry
6. generate Gazette hook or article candidate
7. update Hall of Warriors / Hall of Fighters inputs
8. update killer stats and stable stats
9. update rivalry state
10. update analytics counters
11. persist the result safely to save data

### 12.2 Required death metadata
Each dead warrior should retain at minimum:
- warrior id
- bout id
- week / season / year
- killer id if applicable
- outcome subtype
- hit location / critical sequence summary
- crowd mood at time of death
- rivalry flag
- tournament flag
- narrative summary ids

### 12.3 No resurrection in default rules
Default canonical rules do not allow returning from DEAD to ACTIVE.
Any alternative must live under House Rules / Mods and be clearly marked non-canonical.

---

## 13. Persistence and Historical Memory

### 13.1 The dead remain visible
Dead warriors must remain queryable and visible in:
- Hall of Warriors
- Chronicle Log
- fighter profile history
- stable history
- Gazette references
- leaderboards where historically relevant

### 13.2 Permanent historical memory
The world should remember:
- who killed whom
- where and when it happened
- how it happened at a readable level
- why it mattered

### 13.3 Save contract
A saved game must fully preserve death state and all generated historical artifacts.
No save migration should silently lose a fallen warrior’s history.

---

## 14. Chronicle, Gazette, and Hall Surfaces

### 14.1 Chronicle
Chronicle is the permanent factual record.
For deaths, it must record:
- participants
- outcome
- primary cause category
- timing context
- concise historical summary

### 14.2 Gazette
Gazette is the narrative retelling layer.
For deaths, it should synthesize tone from:
- crowd mood
- rivalry context
- fame level
- tournament stakes
- style flavor
- brutality profile

### 14.3 Hall of Warriors / Hall of Fighters
This is the memorial/pantheon surface.
Dead warriors should appear with:
- portrait/card
- style
- stable
- record
- kills
- titles
- death summary
- year/week of death
- notable rivals / killer link if relevant

---

## 15. Combat Log and Death Explanation

### 15.1 Debug layer
The engine must capture the full exchange chain that led to death.
This includes:
- exchange index
- phase
- damage
- endurance deltas
- hit location
- kill-window state
- execution flag

### 15.2 Player-facing highlight layer
Players should not need debug math to understand a death.
The highlight layer should clearly show:
- major turning point
- fatigue collapse if relevant
- exposure or armor failure
- decisive hit location when relevant
- final decisive moment

### 15.3 End-of-bout explanation
Every death must produce a short readable explanation such as:
- “Collapsed under pressure after endurance failed in the late bout.”
- “Precise head strike converted an exposed opening after repeated parry failures.”
- “Heavily armored early, but the loadout exhausted him and left him unable to defend.”
- “Arm damage broke his defense; the finishing torso blow came moments later.”
- “Leg wounds stole his footing and initiative before the final execution.”

### 15.4 Cause attribution buckets
The explanation system should attribute fatal outcomes to one or more of:
- style edge
- gear edge
- fatigue collapse
- targeted location
- defensive failure
- strategic overcommitment
- existing injuries
- rivalry pressure

---

## 16. FTUE and First Death Handling
The tutorial must teach that outcomes matter permanently without traumatizing or confusing the player.

### 16.1 FTUE teaching goals for permadeath
The FTUE should explain:
- that warriors can die permanently
- that dead warriors remain in history
- that risk can be read before the bout
- that losses and deaths still create story value

### 16.2 First-bout presentation
The first bout should teach:
- initiative and tempo in plain language
- fatigue collapse
- kill-window or stoppage risk
- hit-location importance in simple language
- deterministic outcome framing

### 16.3 First death safeguards
The FTUE should not hide death as a concept, but early onboarding should be curated.
Recommended rules:
- the first fight may allow death, but risk must be telegraphed clearly
- if the player suffers an early death, the game must immediately show the world-memory payoff so the loss feels meaningful, not just punishing
- the player should still have enough roster depth to continue

### 16.4 Post-death FTUE consequence screen
If a death occurs in FTUE or early play, immediately show:
- Chronicle entry preview
- Gazette teaser
- fame / notoriety changes
- roster vacancy / next-step guidance
- reminder that the fallen remain in Hall/Chronicle history

---

## 17. AI Behavior Around Kills

### 17.1 Owner personality influence
AI owners should influence lethality through personality.
Examples:
- Conservative: suppresses unnecessary kill risk
- Bloodthirsty: pushes aggression and finish attempts
- Experimental: accepts volatility for meta exploration
- Traditionalist: favors honorable, stable patterns

### 17.2 Mid-bout AI adaptation
AI should use real fight state to decide whether to:
- push for finish
- protect a lead
- stall for decision
- avoid reckless overcommitment

### 17.3 World-level meta effect
If a style, stable, or owner archetype produces many kills, the world should react through:
- Gazette framing
- crowd shifts
- recruitment perception
- counter-meta adaptation by other stables

---

## 18. Roster and Economy Consequences
A death must have practical management consequences.

### 18.1 Immediate roster impact
- active roster count decreases
- future scheduling options may narrow
- tournament readiness may change
- the stable may need to recruit sooner than planned

### 18.2 Long-tail impact
- trainer focus may shift
- stable identity may drift toward caution or brutality
- orphanage demand may rise
- grief, revenge, or succession story hooks may appear

### 18.3 No dead-slot confusion
The UI must never make a dead warrior look selectable for active participation.
Memorial visibility must be high, but active-play affordances must be removed.

---

## 19. UI Contracts for Lethality Readability

### 19.1 Pre-bout risk surfacing
Before a fight, the UI should show:
- style matchup signal
- gear legality / encumbrance warnings
- fatigue or injury warning
- crowd mood
- simple lethality hint such as Low / Moderate / High risk
- head / torso exposure hints where the matchup or loadout justifies it

### 19.2 In-bout surfacing
During a fight, player-facing highlights should surface:
- initiative swings
- big hits
- fatigue collapse
- kill window opened
- execution attempt
- death or stoppage
- decisive hit location when it matters

### 19.3 Post-bout surfacing
After a death, show:
- bout summary
- death explanation
- Chronicle card
- Gazette teaser
- rep changes
- memorial link

### 19.4 Accessibility
Death information must be readable without relying only on color.
Use icons, labels, and plain-language summaries.
Reduced-motion mode must preserve all critical death-state information.

---

## 20. Analytics and Telemetry
Kill Analytics should treat death as a first-class analytics domain.

### 20.1 Required analytics slices
- kill rate by week / season / year
- kill rate by style
- kill rate by matchup
- kill rate by arena mood
- kill rate by encumbrance band
- kill rate by weapon family
- kill rate by strategy profile
- kill rate by tournament tier
- death cause chain distribution
- hit location fatality distribution

### 20.2 Tuning use
Analytics should answer:
- are deaths too common?
- are deaths too rare?
- are certain styles converting too reliably?
- are certain gear setups creating degenerate lethality?
- are deaths clustering too early in bouts?
- are head hits too decisive relative to torso play?
- are arm/leg hits doing enough setup work before kills happen?

### 20.3 Player-facing analytics
A player-facing version may show simplified world trends, but debug-level balancing panels can go deeper.

---

## 21. House Rules and Mods

### 21.1 Canonical default
Default Stable Lords uses full permadeath.

### 21.2 Optional variants
Optional rules may include:
- reduced death rate
- no-death exhibitions
- severe-injury-instead-of-death
- narrative mercy bias

### 21.3 Labeling requirement
Any mode that weakens or disables permadeath must be labeled as a house rule, not the canonical game.

---

## 22. Data Model Additions
Suggested minimum additions to warrior and bout outcome schemas:

```ts
type DeathOutcome = {
  isDead: boolean;
  killerId?: string;
  causeBucket?:
    | "FATAL_DAMAGE"
    | "EXECUTION"
    | "CRITICAL_CHAIN"
    | "FATIGUE_COLLAPSE"
    | "ARMOR_FAILURE"
    | "RIVALRY_FINISH";
  killWindowOpened: boolean;
  executionAttempted: boolean;
  fatalExchangeIndex?: number;
  fatalHitLocation?: string;
  crowdMoodAtDeath?: string;
  tournamentId?: string;
  rivalryFlag?: boolean;
  chronicleEntryId?: string;
  gazetteHookId?: string;
};
```

Also add persistent warrior fields:
- `status`
- `deathAtWeek`
- `deathAtSeason`
- `deathAtYear`
- `deathBoutId`
- `deathKillerId`
- `deathSummary`
- `memorialTags[]`

---

## 23. Acceptance Criteria

### 23.1 Simulation
- Death cannot occur without valid simulation conditions.
- Kill windows are required for normal fatal conversions.
- Fatigue and endurance materially affect late-bout lethality.
- Strategy, gear, style, and hit location all influence kill rate in measurable ways.

### 23.2 UX
- Players can read danger before the bout.
- Players can understand why a death happened after the bout.
- The dead remain visible in memorial/history surfaces.
- No dead warrior can be accidentally used again.

### 23.3 World consequence
- Every death creates a Chronicle entry.
- Every death creates a Gazette hook or narrative output.
- Killer and stable reputation update correctly.
- Hall / memorial systems reflect the death.

### 23.4 FTUE
- The player is taught that outcomes are permanent.
- The player sees that death creates story and world state, not just loss.
- Early deaths never hard-stop progression.

### 23.5 Analytics
- Death events are queryable by cause, style, gear, mood, phase, and hit location.
- Designers can tune kill rate from real telemetry.

---

## 24. Final Design Rule
Stable Lords should not treat death as a random punishment or a cosmetic blood effect.
It should treat death as the game’s clearest expression of risk, legacy, and world memory.
A kill changes records, reputation, strategy, and history.
That is what makes permadeath worth having in the first place.
