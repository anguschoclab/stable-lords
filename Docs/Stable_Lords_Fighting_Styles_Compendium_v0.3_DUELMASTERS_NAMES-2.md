# Stable Lords — Fighting Styles Compendium (Duelmasters-Accurate Naming) v0.3

**Purpose:** This document defines Stable Lords’ *ten* canonical fighting styles using the **original Duelmasters / Duel2 naming** and aliases used in the community and in our project history. It is written to be **implementable**: each style includes identity, mechanical intent, AI/strategy constraints, match-up logic hooks, and UI requirements.

**Canonical naming sources (external):**
- Duel2 “Roll Up Rules / Ten fighting styles” (contains the ten style names and short descriptions)【turn11search3】  
- Duel2 individual style pages for: Bashing Attack【turn5search7】, Slashing Attack【turn7search3】, Lunging Attack【turn7search2】, Striking Attack【turn8search0】, Total Parry【turn7search1】, Parry‑Lunge【turn8search1】, Parry‑Strike【turn5search2】, Parry‑Riposte【turn8search2】, plus the “styles & tactics” overview【turn7search6】  
- Community shorthand style names and style↔tactic suitability table【turn4view0】  

---

## 1) Naming Standard (what we will use everywhere)

Stable Lords uses **two parallel names** for every style:

1) **Display Name (UI / player-facing)**  
   - Uses *Duelmasters community shorthand* from the “styles & tactics” table (hyphenated).  
   - Examples: **Parry‑Striker**, **Wall of Steel**, **Aimed‑Blow**.

2) **Rules Name (simulation canonical)**  
   - Uses *Duel2/RSI official style labels* (as seen in rules pages and newsletters).  
   - Examples: **PARRY‑STRIKE**, **WALL OF STEEL**, **AIMED BLOW**.

### 1.1 Canonical 10-style roster (locked)

| Style ID | Display Name (Stable Lords) | Rules Name (Duel2/RSI) | Common Abbrev |
|---|---|---|---|
| AB | **Aimed‑Blow** | **AIMED BLOW** (Aimed Blow Attack Style)【turn11search3】 | AB |
| BA | **Basher** | **BASHING ATTACK**【turn11search3】 | BA |
| LU | **Lunger** | **LUNGING ATTACK**【turn11search3】 | LU |
| PL | **Parry‑Lunger** | **PARRY‑LUNGE**【turn11search3】 | PL |
| PR | **Parry‑Riposte** | **PARRY‑RIPOSTE**【turn11search3】 | PR |
| PS | **Parry‑Striker** | **PARRY‑STRIKE**【turn11search3】 | PS |
| ST | **Striker** | **STRIKING ATTACK**【turn11search3】 | ST |
| SL | **Slasher** | **SLASHING ATTACK**【turn11search3】 | SL |
| TP | **Total‑Parry** | **TOTAL PARRY**【turn11search3】 | TP |
| WS | **Wall of Steel** | **WALL OF STEEL**【turn11search3】 | WS |

**Important:** Any prior internal names (e.g., “Balanced Front”, “Execution Path”) are **deprecated aliases** and must not appear in UI, save data, or simulation logs once v0.3 is adopted.

---

## 2) Shared System Assumptions (applies to all styles)

### 2.1 Combat loop primitives Stable Lords must expose
Stable Lords’ duel resolution must allow these knobs (because Duel2 explicitly differentiates styles by how they respond to them)【turn7search6】:

- **Offensive Effort (OE)**: 1–10
- **Activity Level (AL)**: 1–10【turn7search9】
- **Kill Desire (KD)**: 1–10 (present in rules overview)【turn11search3】
- **Minute plan**: at least minutes 1–5 are explicitly scripted (classic Duel2 structure)【turn11search3】
- **Offensive/Defensive Tactics** (mutually exclusive within a minute)【turn7search6】
  - Offensive: **Lunge, Slash, Bash, Decisiveness**
  - Defensive: **Parry, Dodge, Riposte, Responsiveness**【turn5search5】
- **Attack Location** + **Protect Location** (classic DM/Duel2 plan)【turn11search3】

### 2.2 Style vs Tactic suitability (must be in the game data)
The community shorthand table provides a full style↔tactic suitability grid (WS/S/U) and the constraint that **only “Well Suited” tactics can be set as favorites**【turn4view0】. Stable Lords must implement:

- `styleTacticSuitability[styleId][tacticId] => { WellSuited | Suited | Unsuited }`
- Validation rules:
  - Favorite tactic must be `WellSuited`
  - Non-favorite tactics can be used but are penalized proportional to suitability tier

---

## 3) Style Specs (granular, implementable)

Each style section below follows a fixed template:

- **Identity & fantasy**
- **Core mechanical posture** (attack vs defense, endurance burn, initiative profile)
- **Best-fit attributes** (what stats matter, with “why”)
- **Tactic synergy rules** (what is WS/S/U and why)
- **Strategy editor guidance** (OE/AL/KD patterns + early minute plans)
- **AI heuristics** (how AI should pick plans, not random)
- **Matchup tendencies** (high-level edges; not deterministic)
- **UI requirements** (tooltips, icons, warnings, recommended presets)

> Note: Duel2 emphasizes that style advantages are “edges” not guarantees and that there are 100 style matchups【turn7search6】. Stable Lords should treat matchups as probabilistic modifiers, not hard counters.

---

# AB — Aimed‑Blow (AIMED BLOW)

### Identity & fantasy
Aimed‑Blow is the “surgeon” style: it holds attacks until a precise opening appears, targeting a pre‑designated location or weak point【turn11search3】.

### Core mechanical posture
- **Tempo:** Low-attack frequency, high selectivity.
- **Endurance:** “Relatively effortless” in official description【turn11search3】.
- **Risk:** If openings don’t appear, AB can look passive; success depends on discipline and positioning.

### Best-fit attributes (why)
- **Wit (WT):** decision quality (choosing openings), learning.
- **Deftness (DF):** precision and control (fits “great precision” weapon requirement)【turn11search3】.
- **Speed (SP):** secondary—helps create openings and protect chosen body locations, but not the main driver.

### Weapon/kit identity
- Classic weapon: **Quarterstaff**【turn11search3】
- General: any weapon usable with precision; note that “fist and kick” are best used with this style【turn11search3】 (Stable Lords: if unarmed exists, it maps to AB).

### Tactic synergy rules
From the shorthand table, AB is **Well‑Suited** to Bash/Slash/Lunge/Parry/Dodge/Riposte in many combinations【turn4view0】—but implementation should interpret this as:
- AB can “borrow” an offensive mode (strike/lunge/bash) **without becoming that style**, because it’s still gated by target selection.

### Strategy editor guidance (starter presets)
- **Minute 1–2:** OE 3–5, AL 4–6, KD low–mid. Goal: read opponent and establish target pressure.
- **Minute 3–5:** OE 5–7 if opponent is opening up; otherwise keep OE moderate and let precision win.

### AI heuristics
- If opponent armor is heavy: prefer **precision targeting** into weak locations; do not inflate OE blindly.
- If opponent is exhaustion-prone (WS/LU): keep OE moderate and let them burn out.

### Matchup tendencies
- AB tends to punish **predictable, heavy-commitment** attackers that create readable openings (BA, sometimes SL).  
- AB can struggle vs deep defense (TP/PR) if openings are scarce.

### UI requirements
- Tooltip: “Waits for openings; fewer attacks but higher quality.”
- Warnings: “High OE may reduce AB’s advantage; don’t over-force.”

---

# BA — Basher (BASHING ATTACK)

### Identity & fantasy
Brutal, physical brawling. Attempts to smash through defenses and overwhelm with force【turn11search3】.

### Core mechanical posture
- **Tempo:** medium to low frequency, high force.
- **Mobility:** weakness is “lack of mobility and ability to dodge”【turn11search3】.
- **Endurance:** stable (doesn’t require constant motion like LU/WS).

### Best-fit attributes
- **Strength (ST) + Size (SZ):** damage and “mass” identity【turn11search3】.
- **Constitution (CN):** keeps you in the pocket.
- **Will (WL):** toughness and consistency.

### Weapon identity
- Classic: **Mace**【turn11search3】  
- General: any weapon that “smashes” into the target.

### Tactic synergy rules
- Bash tactic is explicitly tied to BA and attempts to attack “through a parry”【turn5search1】.
- BA is well-suited to **Bash** and **Decisiveness**; other offensive tactics reduce overall ability (official BA page)【turn5search7】.

### Strategy guidance
- BA is typically **low AL** (stable stance) and **mid-high OE** when committing.
- Don’t pair BA with high-mobility plans unless you want a deliberate off-meta gamble.

### AI heuristics
- If opponent is LU/WS: try to force engagement early (OE up) before being kited.
- If opponent is TP: add Decisiveness in mid rounds; don’t spam Bash every minute (tactics should be used sparingly)【turn7search6】.

### UI requirements
- Preset tags: “Stable stance”, “Break parries”.
- Warning: “Poor mobility; avoid extreme AL unless build supports it.”

---

# LU — Lunger (LUNGING ATTACK)

### Identity & fantasy
Frantic, jabbing, constantly moving—hard to hit, attacks from unexpected angles【turn11search3】.

### Core mechanical posture
- **Tempo:** high activity, frequent thrust windows.
- **Endurance:** explicitly “requires a tremendous amount of endurance and stamina”【turn11search3】.
- **Signature:** “Keep moving!” and angles of thrust; good retreat/leap-back capability【turn7search2】.

### Best-fit attributes
- **Constitution (CN):** endurance budget.
- **Speed (SP):** movement + initiative.
- **Deftness (DF):** point control and thrust accuracy.

### Weapon identity
- Classic: **Short Spear**【turn11search3】  
- General: any “jabbing” weapon.

### Tactic synergy rules
- LU is “very well suited to the Lunge tactic; lunging is what the style is all about”【turn7search2】.

### Strategy guidance
- Default: **higher AL**, moderate OE early to avoid self-exhaustion.
- Spike OE when opponent is hurt/out of position.

### AI heuristics
- If opponent is BA (slow, heavy): kite and pick angles; this is a classic advantage example【turn7search6】.
- If opponent is TP/PR: avoid wasteful OE; use AL to deny their preferred tempo.

### UI requirements
- Endurance warning: “High AL + high OE burns stamina rapidly.”
- Preset slider suggestion: AL high, OE mid early.

---

# PL — Parry‑Lunger (PARRY‑LUNGE)

### Identity & fantasy
Defense-first posture that explodes into a full lunge when openings appear【turn11search3】.

### Core mechanical posture
- **Tempo:** patient; attacks are “sudden, total attack” bursts【turn11search3】.
- **Balance:** marketed as “best all around” defense + sudden offense【turn11search3】.

### Best-fit attributes
- **Wit (WT):** choosing openings.
- **Speed (SP):** explosive transitions.
- **Deftness (DF):** clean parry-to-thrust conversion.

### Weapon identity
- Classic: **Longsword**【turn11search3】  
- General: any weapon that can parry and jab.

### Tactic synergy rules
- Defensive: explicitly well-suited to **Parry** and **Dodge**【turn8search1】.
- Riposte works “to some effect” but is not well-suited【turn8search1】.

### Strategy guidance
- Early minutes: defensive posture; mid OE, mid AL.
- If opponent over-commits: convert to lunge bursts.

### AI heuristics
- If opponent is SL: prefer Parry/Dodge, then punish whiffs with lunge bursts.
- If opponent is BA: stay mobile enough to avoid being pinned.

### UI requirements
- “Burst windows” tooltip: “Parry first; lunge when openings appear.”
- Suggested minute plan presets: (1) conservative opener, (2) punish opener.

---

# PR — Parry‑Riposte (PARRY‑RIPOSTE)

### Identity & fantasy
Flashy counter-fighter: waits for errors and punishes with counterstrikes【turn11search3】.

### Core mechanical posture
- **Aggression:** “very unaggressive” but dangerous vs clumsy foes【turn11search3】.
- **Endurance:** “untaxing… husbands stamina”【turn11search3】.
- **OE paradox:** PR may attack *more* with low OE by counterstriking than with high OE (official strategy note)【turn7search6】.

### Best-fit attributes
- **Wit (WT) and Deftness (DF) are paramount**【turn8search2】.
- **Speed (SP):** helps riposte ability【turn8search2】.

### Weapon identity
- Classic: **Epee**【turn8search2】.

### Tactic synergy rules
- Poorly suited (but possible) to **Dodge** and **Responsiveness**【turn8search2】.
- PR’s defining payoff is riposte/counter timing; avoid plans that turn PR into a generic striker.

### Strategy guidance
- Use lower OE early; let the opponent create riposte triggers.
- KD should be moderate; PR wins by accumulated punishment.

### AI heuristics
- Against BA/SL (higher error rates): lean into PR identity.
- Against TP (few openings): raise OE slightly but don’t abandon counter core.

### UI requirements
- Special tooltip: “Low OE can increase attacks (counterstrikes).”【turn7search6】
- Preset: “Counterfighter (low OE opener)”.

---

# PS — Parry‑Striker (PARRY‑STRIKE)

### Identity & fantasy
Economy-of-motion defender who attacks swiftly in the shortest paths—defensive focus with swift strikes【turn5search2】.

### Core mechanical posture
- Concepts: “Waste no motion… shortest distance” for both strike and parry【turn5search2】.
- Defensive focus vs Striking Attack【turn5search2】.
- Efficient endurance profile.

### Best-fit attributes
- **Wit (WT):** timing and efficiency.
- **Speed (SP):** swift attacks.
- **Will (WL):** steadiness under pressure.

### Weapon identity
- General: wide variety; must parry effectively.

### Tactic synergy rules
- PS is suited to parry-centric tactics; don’t over-modify every minute (tactics sparingly)【turn7search6】.

### Strategy guidance
- Moderate AL (don’t overburn), mid OE with frequent parry posture.
- KD scales with opponent injury—PS can end cleanly once advantage is built.

### AI heuristics
- If opponent is SL: PS should be happy—capitalize on their reduced parry.
- If opponent is LU: keep OE disciplined; don’t chase.

### UI requirements
- “Efficiency” icon (stopwatch / minimal motion).
- Recommended preset: “Measured Defense → Quick Finish”.

---

# ST — Striker (STRIKING ATTACK)

### Identity & fantasy
Basic, efficient downward striking—finish the foe quickly with minimal wasted motion【turn8search0】.

### Core mechanical posture
- “Simplest in concept… wasting no motion”【turn8search0】.
- Often wants to end fights before complex stamina games.

### Best-fit attributes
- **Strength (ST):** payoff per hit.
- **Speed (SP):** initiative edge.
- **Will (WL):** commitment/finishing mentality.

### Weapon identity
- Classic: **Broadsword**【turn11search3】.
- Very broad weapon compatibility【turn11search3】.

### Tactic synergy rules
- Offensively “begs to be Decisiveness modified”【turn8search0】.

### Strategy guidance
- Start OE mid-high; AL moderate.
- If opponent is TP/PR, consider Decisiveness spikes later rather than early waste.

### AI heuristics
- Against BA: avoid mirror brawl if you’re lighter; use AL to reposition.
- Against WS: do not let it become a stamina race you lose.

### UI requirements
- Preset: “Fast finish”.
- Warning: “Overcommitting early can reduce defense.”

---

# SL — Slasher (SLASHING ATTACK)

### Identity & fantasy
Whirling slashes; gains attack ability at the loss of parrying—often leaves the fighter “not unscathed”【turn11search3】.

### Core mechanical posture
- Requires balanced weapon; slash wound logic is distinct (long cutting arcs)【turn7search3】.
- High offense, reduced parry.

### Best-fit attributes
- **Deftness (DF):** edge control and accurate arcs.
- **Speed (SP):** positioning to land slashes safely.
- **Constitution (CN):** because you take hits more often.

### Weapon identity
- Classic: **Scimitar**【turn11search3】.
- Any weapon that slashes.

### Tactic synergy rules
- Slash tactic is the natural modification; but remember “tactics sparingly” guideline【turn7search6】.

### Strategy guidance
- OE mid-high; AL mid.
- Protect Location selection matters: you will get hit.

### AI heuristics
- Against TP/PR: SL must create openings—use controlled OE ramps.
- Against PS: expect stronger defense; consider KD spikes after first wound.

### UI requirements
- Warning: “Lower parry; plan armor accordingly.”
- Preset: “Pressure Cutter”.

---

# TP — Total‑Parry (TOTAL PARRY)

### Identity & fantasy
Defense-first shield/parry wall; attacks are “an afterthought” and the style depends on defending being cheaper than attacking【turn7search1】.

### Core mechanical posture
- “Focuses on defense… keeping a parrying weapon in front”【turn11search3】.
- Relatively effortless【turn11search3】.

### Best-fit attributes
- **Will (WL):** toughness, staying composed.
- **Constitution (CN):** outlast.
- **Speed (SP):** helps parry/defend and protect chosen area (rules overview)【turn11search3】.

### Weapon identity
- Classic: **Shield** emphasis【turn11search3】.

### Tactic synergy rules
- Defensive tactics are natural; TP is WS to multiple defensive tactics in the shorthand table【turn4view0】.

### Strategy guidance
- OE low early; AL low-mid; KD low.
- Raise OE only when opponent is exhausted or wounded.

### AI heuristics
- Against LU/WS: let them burn out; do not chase.
- Against AB: avoid giving openings; keep posture compact.

### UI requirements
- Tooltip: “Defense first; win by exhaustion and mistakes.”
- Preset: “Endurance Wall”.

---

# WS — Wall of Steel (WALL OF STEEL)

### Identity & fantasy
Surround yourself with a constantly swinging weapon arc—danger zone control with continuous motion【turn11search3】.

### Core mechanical posture
- “Whirl… gives many options to attack and parry” but costs “tremendous stamina and endurance”【turn11search3】.
- Historically appears in multiple cultures and weapon traditions【turn11search1】.

### Best-fit attributes
- **Constitution (CN):** stamina budget.
- **Will (WL):** keep rhythm under fatigue.
- **Strength (ST):** to keep large continuous arcs effective.

### Weapon identity
- Classic: **Morning Star**【turn11search3】.
- Any medium/long weapon that can be swung continuously【turn11search3】.

### Tactic synergy rules
- WS is well-suited to multiple tactics in shorthand table【turn4view0】, but in Stable Lords:
  - WS’s identity is already “continuous arc”; tactics should accentuate specific beats, not override.

### Strategy guidance
- AL mid-high, OE mid.
- Avoid maxing both AL and OE early unless you’re deliberately “burning hot”.

### AI heuristics
- Against ST: zone them out; punish entries.
- Against SL: expect them to exploit fatigue windows—manage endurance carefully.

### UI requirements
- Fatigue indicator emphasis (WS is endurance-sensitive).
- Preset: “Arc Control (mid OE, mid-high AL)”.

---

## 4) Canonical Style ↔ Tactic Suitability Table (import-ready)

Stable Lords should store the shorthand WS/S/U grid exactly as published in the community table【turn4view0】 (converted into machine data). The table header in that source is:

**Bash, Slash, Lunge, Decise, Parry, Dodge, Riposte, Response**【turn4view0】

> Implementation note: “Decise” = Decisiveness, “Response” = Responsiveness.

(Include the full grid in the data file; keep this doc as the human explanation.)

---

## 5) Migration Notes (from prior internal naming)

If a save file or config references any of these deprecated labels, map them to the nearest Duelmasters style ID:

- “Balanced” / “All‑Round” → PL (Parry‑Lunge)  
- “Counter” / “Riposte” → PR (Parry‑Riposte)  
- “Turtle” / “Bulwark” → TP (Total‑Parry)  
- “Whirl” / “Spinning Defense” → WS (Wall of Steel)  
- “Precision” → AB (Aimed‑Blow)  
- “Heavy Smash” → BA (Basher)  
- “Fast Thrust” → LU (Lunger)  
- “Pure Offense” → ST or SL depending on weapon profile  

---

## 6) What changed vs v0.2
- Replaced incorrect “new” names with **Duelmasters/Duel2 canonical set** and community shorthand.
- Aligned all ten styles to the exact roster described in RSI rules【turn11search3】 and shorthand table【turn4view0】.
- Added explicit naming rules (Display Name vs Rules Name) to prevent drift.

---

## Appendix A — Source breadcrumbs
- Ten style list and short descriptions (includes WS/TP/AB/PR etc.)【turn11search3】
- Style/tactic suitability grid with shorthand style labels【turn4view0】
- Individual style deep-dives (examples): Parry‑Strike【turn5search2】, Parry‑Lunge【turn8search1】, Parry‑Riposte【turn8search2】, Striking Attack【turn8search0】, Lunging Attack【turn7search2】, Slashing Attack【turn7search3】, Total Parry【turn7search1】, Bashing Attack【turn5search7】
