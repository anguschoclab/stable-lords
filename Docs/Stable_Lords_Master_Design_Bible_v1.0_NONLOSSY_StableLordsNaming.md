# 🏛️ Stable Lords — Master Design Bible v1.0 (Non-Lossy Collation)
**Generated:** 2026-02-07 (Europe/Stockholm)

This file is a **verbatim, non-lossy collation** of *all* design-relevant documents currently present in the project files provided in this workspace.

**Policy:** Nothing in this file is summarized. Each source document is included **in full**, in a stable order, with its original formatting preserved as much as possible.

---

## Table of Contents
1. [Feature Integration Matrix (v1.4.4 merge)](#doc-01-feature-integration-matrix-v1-4-4-merge) — `FeatureIntegrationMatrix.md`
2. [🏛️ STABLE LORDS — DESIGN BIBLE v3.0](#doc-02-stable-lords-design-bible-v3-0) — `StableLords_DesignBible_v3.0.md`
3. [🏇 Stable Lords – Complete Design Bible (v1.6.0)](#doc-03-stable-lords-complete-design-bible-v1-6-0) — `StableLords_Design_Bible_v1.6.0.md`
4. [Stable Lords — Combat Log & Kill Narrative Specification (Definitive) v0.1](#doc-04-stable-lords-combat-log-kill-narrative-specification-definitive-v0-1) — `Stable_Lords_Combat_Log_and_Kill_Narrative_Spec_v0.1.md`
5. [Stable Lords — Dueling Bout System & Style × Style Matchup Matrix v0.1](#doc-05-stable-lords-dueling-bout-system-style-style-matchup-matrix-v0-1) — `Stable_Lords_Dueling_Bout_System_and_Style_Matchup_Matrix_v0.1.md`
6. [Stable Lords — Equipment, Armor, Shields, and Encumbrance Interaction Spec (Definitive) v0.1](#doc-06-stable-lords-equipment-armor-shields-and-encumbrance-interaction-spec-definitive-v0-1) — `Stable_Lords_Equipment_Armor_Encumbrance_Spec_v0.1.md`
7. [Stable Lords — Fighting Styles Compendium (Duelmasters-Accurate Naming) v0.3](#doc-07-stable-lords-fighting-styles-compendium-duelmasters-accurate-naming-v0-3) — `Stable_Lords_Fighting_Styles_Compendium_v0.3_DUELMASTERS_NAMES.md`
8. [Stable Lords — Consolidated Design Docs (Master v0.1)](#doc-08-stable-lords-consolidated-design-docs-master-v0-1) — `Stable_Lords_Granular_Master_Design_Doc_v0.1.md`
9. [Stable Lords — UI & State Contract (Extracted + Target Map) v0.2](#doc-09-stable-lords-ui-state-contract-extracted-target-map-v0-2) — `Stable_Lords_UI_and_State_Contract_v0.2.md`
10. [Stable Lords — Warrior Design & Creation Specification (Granular, Implementable) v0.1](#doc-10-stable-lords-warrior-design-creation-specification-granular-implementable-v0-1) — `Stable_Lords_Warrior_Design_and_Creation_Spec_v0.1.md`
11. [Stable Lords — Warrior Design & Creation Specification v0.3 (Definitive, Lineage‑Integrated)](#doc-11-stable-lords-warrior-design-creation-specification-v0-3-definitive-lineageintegrated) — `Stable_Lords_Warrior_Design_and_Creation_Spec_v0.3_DEFINITIVE.md`
12. [README-FIRST.txt](#doc-12-readme-first-txt) — `_extract/Duelmasters-Scaffold-EngineSlot-v0.6.1/Duelmasters-Scaffold-EngineSlot-v0.6.1/README-FIRST.txt`
13. [Duelmasters Scaffold](#doc-13-duelmasters-scaffold) — `_extract/Duelmasters-Scaffold-EngineSlot-v0.6.1/Duelmasters-Scaffold-EngineSlot-v0.6.1/index.html`
14. [Duelmasters Starter](#doc-14-duelmasters-starter) — `_extract/Duelmasters-Starter-v0.6.0/Duelmasters-Starter-v0.6.0/index.html`
15. [Tournament Save Hooks](#doc-15-tournament-save-hooks) — `_extract/Duelmasters-v1.0.0-Tournaments-Overlay/src/state/save.patches.md`
16. [PATCH_NOTES.md](#doc-16-patch-notes-md) — `_extract/StableLords-delta-v1.6.1/PATCH_NOTES.md`
17. [Duelmasters — Sprint 4 Delta (v1.1.0 → v1.2.0)](#doc-17-duelmasters-sprint-4-delta-v1-1-0-v1-2-0) — `_extract/StableLords-merged-v1.4.4/CHANGELOG.md`
18. [Feature Integration Matrix (v1.4.4 merge)](#doc-18-feature-integration-matrix-v1-4-4-merge) — `_extract/StableLords-merged-v1.4.4/FeatureIntegrationMatrix.md`
19. [Patches applied by Sprint 4](#doc-19-patches-applied-by-sprint-4) — `_extract/StableLords-merged-v1.4.4/PATCHES.md`
20. [README-5C.txt](#doc-20-readme-5c-txt) — `_extract/StableLords-merged-v1.4.4/README-5C.txt`
21. [README-DELTA-5A.txt](#doc-21-readme-delta-5a-txt) — `_extract/StableLords-merged-v1.4.4/README-DELTA-5A.txt`
22. [README-DELTA-v1.4.2.txt](#doc-22-readme-delta-v1-4-2-txt) — `_extract/StableLords-merged-v1.4.4/README-DELTA-v1.4.2.txt`
23. [README-FIRST.txt](#doc-23-readme-first-txt) — `_extract/StableLords-merged-v1.4.4/README-FIRST.txt`
24. [README-MAC.txt](#doc-24-readme-mac-txt) — `_extract/StableLords-merged-v1.4.4/README-MAC.txt`
25. [README-delta-v1.4.3-el-fix.txt](#doc-25-readme-delta-v1-4-3-el-fix-txt) — `_extract/StableLords-merged-v1.4.4/README-delta-v1.4.3-el-fix.txt`
26. [README-delta-v1.4.3.txt](#doc-26-readme-delta-v1-4-3-txt) — `_extract/StableLords-merged-v1.4.4/README-delta-v1.4.3.txt`
27. [README-delta-v1.4.4.txt](#doc-27-readme-delta-v1-4-4-txt) — `_extract/StableLords-merged-v1.4.4/README-delta-v1.4.4.txt`
28. [README.txt](#doc-28-readme-txt) — `_extract/StableLords-merged-v1.4.4/README.txt`
29. [Stable Lords — Quickstart v1.4.2](#doc-29-stable-lords-quickstart-v1-4-2) — `_extract/StableLords-merged-v1.4.4/index.html`
30. [Tournament Save Hooks](#doc-30-tournament-save-hooks) — `_extract/StableLords-merged-v1.4.4/src/state/save.patches.md`
31. [Stable Lords • Starter v1.5.0](#doc-31-stable-lords-starter-v1-5-0) — `_extract/StableLords-starter-v1.5.0/README.md`
32. [Tournament Save Hooks](#doc-32-tournament-save-hooks) — `_extract/StableLords-starter-v1.5.0/src/state/save.patches.md`
33. [Duelmasters — Sprint 4 Delta (v1.1.0 → v1.2.0)](#doc-33-duelmasters-sprint-4-delta-v1-1-0-v1-2-0) — `_extract/StableLords-v1.6.0/CHANGELOG.md`
34. [Feature Integration Matrix (v1.4.4 merge)](#doc-34-feature-integration-matrix-v1-4-4-merge) — `_extract/StableLords-v1.6.0/FeatureIntegrationMatrix.md`
35. [Patches applied by Sprint 4](#doc-35-patches-applied-by-sprint-4) — `_extract/StableLords-v1.6.0/PATCHES.md`
36. [README-5C.txt](#doc-36-readme-5c-txt) — `_extract/StableLords-v1.6.0/README-5C.txt`
37. [README-DELTA-5A.txt](#doc-37-readme-delta-5a-txt) — `_extract/StableLords-v1.6.0/README-DELTA-5A.txt`
38. [README-DELTA-v1.4.2.txt](#doc-38-readme-delta-v1-4-2-txt) — `_extract/StableLords-v1.6.0/README-DELTA-v1.4.2.txt`
39. [README-FIRST.txt](#doc-39-readme-first-txt) — `_extract/StableLords-v1.6.0/README-FIRST.txt`
40. [README-MAC.txt](#doc-40-readme-mac-txt) — `_extract/StableLords-v1.6.0/README-MAC.txt`
41. [README-delta-v1.4.3-el-fix.txt](#doc-41-readme-delta-v1-4-3-el-fix-txt) — `_extract/StableLords-v1.6.0/README-delta-v1.4.3-el-fix.txt`
42. [README-delta-v1.4.3.txt](#doc-42-readme-delta-v1-4-3-txt) — `_extract/StableLords-v1.6.0/README-delta-v1.4.3.txt`
43. [README-delta-v1.4.4.txt](#doc-43-readme-delta-v1-4-4-txt) — `_extract/StableLords-v1.6.0/README-delta-v1.4.4.txt`
44. [Stable Lords • Starter v1.5.0](#doc-44-stable-lords-starter-v1-5-0) — `_extract/StableLords-v1.6.0/README.md`
45. [README.txt](#doc-45-readme-txt) — `_extract/StableLords-v1.6.0/README.txt`
46. [StableLords Design Bible (Reference Drop-in)](#doc-46-stablelords-design-bible-reference-drop-in) — `_extract/StableLords-v1.6.0/docs/design-bible.md`
47. [Feature Integration Matrix](#doc-47-feature-integration-matrix) — `_extract/StableLords-v1.6.0/docs/roadmap/FEATURE_INTEGRATION_MATRIX.md`
48. [Stable Lords — Quickstart v1.4.2](#doc-48-stable-lords-quickstart-v1-4-2) — `_extract/StableLords-v1.6.0/index.html`
49. [Procedural Generation Scripts](#doc-49-procedural-generation-scripts) — `_extract/StableLords-v1.6.0/scripts/python/README.md`
50. [Tournament Save Hooks](#doc-50-tournament-save-hooks) — `_extract/StableLords-v1.6.0/src/state/save.patches.md`
51. [Duelmasters – Complete Source (RC)](#doc-51-duelmasters-complete-source-rc) — `_extract/duelmasters-complete-src/README.md`
52. [Duelmasters (Dev)](#doc-52-duelmasters-dev) — `_extract/duelmasters-complete-src/index.html`
53. [Duelmasters RC](#doc-53-duelmasters-rc) — `_extract/duelmasters-full-rc/index.html`
54. [Duelmasters RC](#doc-54-duelmasters-rc) — `_extract/duelmasters-gameui/index.html`
55. [Duelmasters RC5](#doc-55-duelmasters-rc5) — `_extract/duelmasters_fullsource_v0.9.1-rc5/index.html`
56. [README-delta-1.6.6.txt](#doc-56-readme-delta-1-6-6-txt) — `_extract/stablelords-delta-1.6.6-ui/README/README-delta-1.6.6.txt`
57. [1.6.6b URL Fix Delta](#doc-57-1-6-6b-url-fix-delta) — `_extract/stablelords-delta-1.6.6b-urlfix/PATCH_NOTES.md`
58. [README-delta-v1.6.2b.txt](#doc-58-readme-delta-v1-6-2b-txt) — `_extract/stablelords-delta-v1.6.2b/README-delta-v1.6.2b.txt`
59. [Stable Lords — Design Bible (v1.6.3)](#doc-59-stable-lords-design-bible-v1-6-3) — `_extract/stablelords-delta-v1.6.3/docs/docs/DesignBible-v1.6.3.md`

---

## 1. Feature Integration Matrix (v1.4.4 merge)
<a id="doc-01-feature-integration-matrix-v1-4-4-merge"></a>

**Source path:** `FeatureIntegrationMatrix.md`  
**SHA-256:** `eda29783a16107fe64a9333e211cdfe1a9d1e5a6035b3bf93730f6f85ef42be2`

### Contents (verbatim)

# Feature Integration Matrix (v1.4.4 merge)

| ID | Feature | Extends (existing modules) | Creates (new modules) |
|---:|---|---|---|
| 1 | Warrior Builder UX polish + validation (Stable Lords) | state, ui | utils |
| 3 | Arena Scheduling & Challenge/Avoid Assistant | state, ui | utils |
| 4 | Combat Log Enhancements (critical cues, vitals intent markers) | state, ui | utils |
| 5 | Favorite Weapon Charting Toolkit | ui | utils |
| 6 | Style Archives Browser (10 warrior types) | ui | content |
| 7 | Design Bible In-App Reader + TOC | ui | content, utils |
| 8 | Training Planner (Trainability & Burns Advisor) | ui | utils |
| 9 | Physicals Simulator (endurance/damage/take) | state, ui | utils |
| 10 | Equipment Optimizer (weapons/armor by style) | ui | content, utils |
| 11 | Strategy Editor (OE/AL/KD by minute) | state, ui | — |
| 15 | Kill Analytics (Mechanics of Death visualizer) | state, ui | utils |
| 23 | Tournament Prep Mode (class calc, FE freeze checks) | state, ui | utils |
| 25 | House Rules / Mods Loader (optional) | state, ui | utils |
| 27 | Import/Export Manager (JSON/YAML packs) | — | utils |
| 29 | Telemetry & Error Log Panel | ui | utils |
| 31 | Theme/Accessibility Pack (high-contrast, text size) | state, ui | — |
| 33 | Onboarding Quests & Tips (non-blocking coach) | ui | content |
| 34 | Design Bible Search (local) | state, ui | content, utils |
| 36 | Content Updater (Archives sync & indexing) | ui | content, utils |
| 38 | Save Slots & Profiles | state, ui | utils |
| 39 | Admin Tools (packager, manifest viewer) | ui | utils |

---

## 2. 🏛️ STABLE LORDS — DESIGN BIBLE v3.0
<a id="doc-02-stable-lords-design-bible-v3-0"></a>

**Source path:** `StableLords_DesignBible_v3.0.md`  
**SHA-256:** `e84ca6fb8f87cb73247bd44e6d00d7a1cb88c34cf4df2e4ed0651d9ea9a9a941`

### Contents (verbatim)

# 🏛️ STABLE LORDS — DESIGN BIBLE v3.0  
### “Blood and Legacy” Edition

---

## TABLE OF CONTENTS

1. World & Calendar Overview  
2. Combat Systems (Summary)  
3. Trainer Systems  
4. Offseason & Yearly Cycle  
5. World Chronicle & Gazette Systems  
6. Procedural Writing System  
7. Procedural Naming System  
8. Leaderboards & Prestige Framework  
9. Arena & Stable Hall Interfaces  
10. Fame, Crowd Sentiment, and Popularity Systems  

---

# 9️⃣ ARENA & STABLE HALL INTERFACES

## 9.1 Arena Hub UI

The **Arena Hub** serves as the player’s main window into the active competitive world.

### Layout Overview
| Region | Purpose |
|---------|----------|
| **Central Banner** | Current Arena Name, region emblem, and crowd “mood meter.” |
| **Left Panel** | Weekly Arena Leaderboard (Top 10 Warriors). |
| **Right Panel** | “Spotlight Feed” – narrative highlights (duels, kills, rivalries). |
| **Bottom Bar** | Tabs: *Leaderboards • Match Results • Gazette • Meta Pulse.* |
| **Background Visuals** | Procedural crowd animation — changes by bloodlust, fame, or tournament season. |

---

### Arena Leaderboard Display
```
╔════════════════════════════════════════════════╗
║  ARENA RANKINGS — WEEK 34, YEAR 12             ║
╠════════════════════════════════════════════════╣
║ # | WARRIOR               | STYLE | W-L-K | FAME ║
║ 1 | Drogan Ironjaw        | BA    | 12-2-5 | 98↑  ║
║ 2 | Avel Tyros            | PS    | 10-4-0 | 85   ║
║ 3 | Serenne Vail          | PR    | 9-3-1  | 79↓  ║
╚════════════════════════════════════════════════╝
```

---

### Crowd Mood Display
A dynamic radial meter showing **Arena Temperament**.

| Icon | Mood | Description |
|-------|------|--------------|
| 🕊️ | Calm | Defensive play, technical appreciation |
| ⚔️ | Bloodthirsty | Demands aggression and kills |
| 🎭 | Theatrical | Favors dramatic, close fights |
| 🕯️ | Solemn | Post-death or tragedy phase |
| 💰 | Festive | Tournament hype, crowd chants louder |

---

## 9.2 Stable Hall UI

Each **Stable** has its own *Hall of Records*, a hybrid dashboard and prestige page.

### Layout Overview
| Section | Content |
|----------|----------|
| **Hall Banner** | Stable emblem + motto (“By Steel and Shadow”). |
| **Roster Wall** | 10 warrior cards, sortable by record, fame, or style. |
| **Trainer Table** | Trainers listed with specialization and contract year. |
| **Stable Reputation Bar** | Fame, Notoriety, Honor, Adaptability (4 sliders). |
| **Leaderboards** | Local stable rank, tournament points, crowd appeal rank. |
| **Stable Chronicle Feed** | Excerpts from Chronicle & Gazette related to this stable. |

---

### Stable Reputation Metrics

| Attribute | Description | Source |
|------------|--------------|--------|
| **Fame** | Public acclaim, boosted by wins and showmanship | Duels, Gazette mentions |
| **Notoriety** | Feared reputation, from kills and rivalries | Deaths, Injuries, Finishers |
| **Honor** | Moral standing (crowd respect) | Yielding, mercy, fair play |
| **Adaptability** | Strategic responsiveness to meta | Meta Drift participation, Style switching |

---

## 9.3 Trainer Market Interface

Displayed during offseason and mid-year breaks.

**Tabs:** *Available Trainers*, *Stable Contracts*, *Top Mentors of the Season*, *Departed Legends*

Each Trainer card shows:
- Portrait  
- Specialty (Aggression, Defense, Endurance, etc.)  
- Former stable affiliation  
- Contract length (1 year minimum)  
- Bonus Modifiers (numerical and descriptive)  
- Popularity (Famed, Trusted, Controversial, Unknown)

---

## 9.4 Hall of Fighters

Permanent archive of annual award winners and retired legends.  
Interactive “Pantheon” grid, sortable by: Year Inducted, Style, Stable, Kill Count, Championships.

---

# 🔟 FAME, CROWD SENTIMENT, AND POPULARITY SYSTEMS

Fame = W*Wins + K*Kills + D*DramaticMoments + C*CrowdApproval + G*GazetteMentions - P*PoorPerformances

- 0–100 scale. Decays slowly if inactive.  
- Stable Fame = average of top 5 warriors’ fame, modified by reputation.

### Notoriety System
```
Notoriety = BaseKills*2 + FatalFinishers*3 + RivalKills*5 + DishonorableActs*2
```

---

# 📊 SYSTEM INTEGRATION

| System | Output | Feeds Into |
|---------|---------|------------|
| Combat Engine | Battle logs, kills, finishers | Fame + Crowd Sentiment |
| Leaderboard Service | Weekly and seasonal scores | Gazette, Recap, Halls |
| Gazette Service | Narrative synthesis | Fame/Notoriety modifiers |
| Chronicle | Permanent record | Hall of Fighters, Meta Drift |
| Trainer Ledger | Market generation | Trainer Rankings, Recaps |
| Naming Service | Cultural + stylistic identity | Gazette, Stable & Warrior Cards |

---

# 🏟️ PRESENTATION NOTES

UI inspired by illuminated manuscripts and carved marble halls.  
Leaderboards appear as engraved tablets that shimmer when fame changes.

---

### **Outcome of v3.0**
Stable Lords now operates as a living ecosystem of fame, history, and legacy.

---

## 3. 🏇 Stable Lords – Complete Design Bible (v1.6.0)
<a id="doc-03-stable-lords-complete-design-bible-v1-6-0"></a>

**Source path:** `StableLords_Design_Bible_v1.6.0.md`  
**SHA-256:** `329a642f549d27580d2225f1d5c98ee31eaae26ff1f747c8b1d18aa68c8e4db4`

### Contents (verbatim)

# 🏇 Stable Lords – Complete Design Bible (v1.6.0)
*Reordered for clarity and production workflow*  
*Updated: 2025-10-27*

---

## 1. Core Design Overview
Stable Lords is a management-simulation strategy game set in a gritty fantasy world of gladiatorial combat. Players and AI manage warrior stables, training, and evolving through seasons of tournaments, fame, and meta shifts.

---

## 2. Game Structure & Progression
- The game operates on a **calendar year**, divided into four **tournament seasons**: Spring, Summer, Fall, and Winter.  
- Each season includes weekly matches, culminating in a major tournament.  
- Offseason is a shorter phase for recruitment, trainer contracts, and recovery.

---

## 3. Warrior Lifecycle
- Warriors are generated procedurally from the **Orphanage System**, representing young aspirants entering the arena.  
- Warriors can be created manually or drafted by the player.  
- Death is determined by **hit location**, **damage thresholds**, and **finishing blows**, with Gazette entries chronicling notable deaths.  
- Warriors accumulate fame, popularity, rivalries, and titles such as *Rookie of the Year*, *Killer of the Year*, and *Fighter of the Year*.

---

## 4. Training & Trainers
Trainers provide bonuses and personality-driven coaching.  
Each has a **specialty** (Endurance, Aggression, Defense, Mind, or Healing) that enhances associated stats or traits.  
Retired warriors entering the trainer pool retain bonuses from their former fighting styles.  
Trainer contracts last **one in-game year** and are managed in the offseason.

---

## 5. Stables & Stable Owners
Each stable:
- Can field **10 warriors**, plus one per champion held.  
- Can hire up to **5 trainers**, choosing from the available pool.  
- Develops personality and style bias over time (e.g., aggressive, defensive, experimental).  
- AI stables dynamically adjust to meta trends or resist them, depending on owner temperament.

---

## 6. Tournament System
Tournaments occur each season with multiple tiers (Regional, Invitational, and Masters).  
Rewards for winners are tiered as follows:

| Place | Reward |
|--------|---------|
| 🥇 1st | Adds +1 permanent warrior slot to the stable. |
| 🥈 2nd | Grants a **Weapon Insight Token** (reveals or boosts favorite weapon). |
| 🥉 3rd | Grants a **Rhythm Insight Token** (reveals or boosts OE/AL). |

Rewards stack per season and per tier but must be used before year-end.

---

## 7. Reward Selection & Transfer System
If a warrior already knows their favorite weapon or rhythm:
- The stable gains an **Insight Token** instead.
- Tokens may be **assigned to another warrior** during the Post-Tournament Phase.
- Flavor text and Gazette entries narrate these mentorship events.

Tokens expire at year-end but can stack within the stable (max 4 per type).

---

## 8. Stable Ledger UI/UX Specification
The **Stable Ledger** is a comprehensive management screen combining reward tracking, trainer contracts, and historical records.

### Tabs
1. **Overview** – Stable snapshot.
2. **Rewards & Insights** – Manage Weapon and Rhythm Insight tokens.
3. **Contracts & Tenure** – Track trainer contracts, morale, and expiry.
4. **Chronicle Log** – Historical performance records.
5. **Hall of Warriors** – Retired or fallen fighters with summaries.

### Rewards Grid
Displays token icon, source tournament, type, status, expiry, and available actions.  
Includes an “Assign →” modal with warrior list and detailed stats.  
Narrative flavor appears after token assignment.

### Year-End Recap
Shows:
- Tokens earned, spent, and expired.  
- Notes on mentorship or missed opportunities.  
- Gazette integration for narrative continuity.

### Data Hooks
```json
{
  "stable": "Iron Gale",
  "tokens": {
    "weapon": [ {"source": "Autumn Invitational", "expires": "Year 23"} ],
    "rhythm": [ {"source": "Summer Regional", "expires": "Year 23"} ]
  }
}
```

---

## 9. Warrior, Stable, Trainer, and Owner Cards
### Shared Design Principles
All cards are interactive, dynamically linked, and show contextual tournament information, fame, and relationships.

| Card Type | Displays |
|------------|-----------|
| **Warrior Card** | Stats, traits, physicals, favorite weapon, fight history, kills, awards, tournaments won, rivalries, and fame. |
| **Trainer Card** | Specialty bonus, experience, notable trainees, and current contract duration. |
| **Stable Card** | Active warriors, trainer roster, reputation, champion lineage, and current standings. |
| **Owner Card** | Personality archetype, leadership style, and influence over AI behavior. |

Each card deep-links into related profiles (e.g., clicking on a tournament name brings up results and standings).

---

## 10. Meta Drift System
Meta shifts occur organically based on the evolving world — styles rise and fall as wins, losses, and deaths reshape public perception.  
AI personalities adapt dynamically, while Gazette reports the changing trends in tone and narrative (“The Age of Shields,” “Era of Blood,” etc.).

---

## 11. Procedural Systems
- **Procedural Writing:** Gazette articles, death vignettes, and recaps generated using Ink and AI-tagged templates.  
- **Procedural Naming:** Unique names for all entities (warriors, trainers, stables, arenas). Names reflect cultural and class tendencies (e.g., defensive stables use stoic Latin names, aggressive ones Norse or Celtic).  
- Each entity has a **unique backend ID** for reference consistency.

---

## 12. Annual Cycle & Offseason
- Each year has four tournaments and inter-season fighting periods.  
- Offseason allows for trainer contracts, token usage, and orphanage recruitment.  
- **World Chronicle** and **Seasonal Recap** include:  
  - Hall of Fame entries.  
  - Fighter of the Year, Rookie of the Year, Killer of the Year.  
  - Style leaders per fighting style.  
  - Gazette newsletter with dynamic crowd commentary and fame reactions.

---

## 13. Orphanage & FTUE (First-Time User Experience)
- Players start at the **Warrior Orphanage**, where new warriors are procedurally generated.  
- The player can adopt or draft warriors from this pool or create their own.  
- The FTUE tutorial introduces game systems through early matches, training, and management.  
- AI stables draw recruits from the same orphanage pool, maintaining world balance.

---

## 14. Leaderboards & Fame Systems
Leaderboards exist at global, style-specific, and tournament levels.  
Crowd popularity and fame modify Gazette coverage and ticket sales (narratively).  
Fame, popularity, and crowd reaction also influence awards and invitations to higher-tier tournaments.

---

## 15. Data Schema Overview
Each major entity type (Warrior, Trainer, Stable, Owner) has:
- Unique UUID.  
- Linked relationships (e.g., `warrior.trainer`, `stable.owner`).  
- Chronicle entries for history reconstruction.

---

## 16. Appendix
- Fonts: Saira SemiCondensed, Stable Lords Mono.  
- Theme: Snowdrop visual style (teal/black/white).  
- UI Library: Radix + Tailwind + React.  
- Core Engine: TypeScript (logic) + Python (procedural generation).

---

---

## 4. Stable Lords — Combat Log & Kill Narrative Specification (Definitive) v0.1
<a id="doc-04-stable-lords-combat-log-kill-narrative-specification-definitive-v0-1"></a>

**Source path:** `Stable_Lords_Combat_Log_and_Kill_Narrative_Spec_v0.1.md`  
**SHA-256:** `fb534fa2a1c4076bad3d9a45ced61c283137ff43025db85b9da6584e3ed9f633`

### Contents (verbatim)

# Stable Lords — Combat Log & Kill Narrative Specification (Definitive) v0.1
Generated: 2026-02-07

This document defines how dueling bouts are surfaced to the player through combat logs,
critical moments, kill explanations, Chronicle records, and Gazette narratives.

---

## 1) Design Goals
Clarity, drama, lineage fidelity, non-spoiler transparency, layered output.

---

## 2) Combat Log Layers

### Exchange Log (Debug)
One entry per exchange; never shown by default.

Fields:
- exchange index
- phase (OPENING/MID/LATE)
- attacker / defender
- initiative winner
- attack result
- riposte result
- damage + hit location
- endurance deltas
- kill window + execution flags

---

### Highlight Log (Player-Facing)
Curated moments only:
- initiative swings
- big hits
- armor/shield events
- fatigue collapse
- kill windows
- executions

---

### Bout Summary
Generated at bout end:
- outcome
- length
- key advantages
- turning point description

---

### Chronicle Record
Permanent, immutable history entry.

---

## 3) Kill Narrative System
Kills require a kill window, execution attempt, and fatal damage.
Causes are attributed to style, gear, fatigue, skill, or mistakes.

---

## 4) Kill Text Assembly
Data-driven text fragments assembled from style, damage type, fatigue, and crowd mood.

---

## 5) Equipment-Aware Narration
References shields, armor absorption, heavy weapons, and breakage.

---

## 6) Strategy & AI Callouts
Narration reflects OE / AL / DEC intent without exposing math.

---

## 7) Style-Specific Flavor
Each style defines verbs, phrasing, and signature moments.

---

## 8) Gazette Synthesis
Weekly narrative aggregation from Chronicle entries.

---

## 9) UI Rules
Live highlights, post-bout summaries, accessibility-first.

---

## 10) Acceptance Criteria
Players understand outcomes; logs are deterministic; deaths feel final.

---

END OF DOCUMENT

---

## 5. Stable Lords — Dueling Bout System & Style × Style Matchup Matrix v0.1
<a id="doc-05-stable-lords-dueling-bout-system-style-style-matchup-matrix-v0-1"></a>

**Source path:** `Stable_Lords_Dueling_Bout_System_and_Style_Matchup_Matrix_v0.1.md`  
**SHA-256:** `2fbc4620848f7f12649a0f423bb1b33184f6b5dbbf24fbdfca8d4e63823059c1`

### Contents (verbatim)

# Stable Lords — Dueling Bout System & Style × Style Matchup Matrix v0.1
Generated: 2026-01-10

This document defines the **dueling bout system** in *Stable Lords*, building directly on:
- **Warrior Design & Creation Spec v0.3 (Definitive)**
- Canonical Duelmasters sources (pid 2, 8–16, 19, 39–53)
- Terrablood Duel II combat lineage

It specifies:
1. The structure of a single duel (bout lifecycle)
2. Exchange-by-exchange resolution model
3. Endurance, fatigue, and collapse behavior
4. Kill windows and finishing logic
5. The **canonical Style × Style Matchup Matrix**, used by AI, UI explainers, and optimizers

Nothing here supersedes the warrior spec; this document **consumes it**.

---

## 1) What a Dueling Bout Is

A **dueling bout** is a sequence of combat exchanges between two warriors, ending in:
- Death (kill)
- Stoppage (incapacitation)
- Yield (rare, honor-driven)
- Time expiration (draw / decision)

A bout is not continuous damage-over-time.
It is a **series of discrete exchanges**, each governed by initiative, reaction, commitment, and fatigue.

---

## 2) Bout Lifecycle (High Level)

1. **Pre-Bout State**
   - Validate both warriors (status, injuries, gear, encumbrance)
   - Snapshot stats (attributes, base skills, derived stats)
   - Apply temporary modifiers (crowd mood, tournament pressure)

2. **Opening Phase**
   - High influence of INI, SPD, style opener bias
   - Aggressive styles attempt early control

3. **Mid-Bout Phase**
   - Endurance becomes dominant
   - Encumbrance penalties accumulate
   - Styles interact most strongly here

4. **Late-Bout Phase**
   - Fatigue thresholds crossed
   - Kill windows widen
   - DEC (decisiveness) becomes critical

5. **Resolution**
   - Kill / stoppage / yield / decision
   - Chronicle + Gazette events emitted

---

## 3) Exchange-Level Resolution (Canonical Order)

Each exchange resolves in the following **locked order** (pid 49–53):

1. **Initiative Contest (INI)**
2. **Attack Attempt (ATT)**
3. **Defense Resolution**
   - Parry (PAR) first
   - Defense (DEF) second
4. **Riposte Check (RIP)**
5. **Damage Application**
6. **Decisiveness Check (DEC)**
7. **Endurance & Fatigue Update**

No step may be skipped except by explicit failure.

---

## 4) Kill Windows & Finishing Logic

A **kill window** opens when:
- Target HP below threshold (HP chart based)
- AND endurance below fatigue breakpoint
- AND defender fails PAR/DEF
- AND attacker passes DEC check

Style modifiers strongly affect:
- How often kill windows appear
- How reliably they are exploited

---

## 5) Endurance, Fatigue, and Collapse

Endurance governs:
- How many high-cost actions can be taken
- How penalties stack late

Rules:
- Each attack/defense consumes endurance
- Encumbrance increases endurance cost
- At 0 endurance:
  - INI collapses
  - DEF/PAR penalties spike
  - Kill window chance increases sharply

---

## 6) Style × Style Matchup Matrix (Canonical)

This matrix represents **relative pressure**, not guaranteed outcomes.
Values are applied as **small modifiers** to:
- Initiative contests
- Defense failure chance
- Kill window probability

Scale:
- **+2** Strong advantage
- **+1** Mild advantage
- **0** Neutral
- **-1** Mild disadvantage
- **-2** Strong disadvantage

### Canonical Styles
AB = Aimed Blow  
BA = Basher  
LU = Lunger  
PL = Parry-Lunge  
PR = Parry-Riposte  
PS = Parry-Strike  
SL = Slasher  
ST = Striker  
TP = Total Parry  
WS = Wall of Steel  

### Matchup Matrix

| Att \ Def | AB | BA | LU | PL | PR | PS | SL | ST | TP | WS |
|-----------|----|----|----|----|----|----|----|----|----|----|
| **AB** | 0 | +1 | 0 | -1 | -2 | -2 | +1 | 0 | -2 | -2 |
| **BA** | -1 | 0 | +1 | 0 | -1 | -1 | +2 | +1 | -2 | -2 |
| **LU** | 0 | -1 | 0 | +1 | 0 | -1 | +1 | +1 | -1 | -2 |
| **PL** | +1 | 0 | -1 | 0 | +1 | 0 | 0 | -1 | -1 | -2 |
| **PR** | +2 | +1 | 0 | -1 | 0 | +1 | -1 | -2 | -1 | -2 |
| **PS** | +2 | +1 | +1 | 0 | -1 | 0 | -1 | -2 | -1 | -2 |
| **SL** | -1 | -2 | -1 | 0 | +1 | +1 | 0 | +1 | -1 | -2 |
| **ST** | 0 | -1 | -1 | +1 | +2 | +2 | -1 | 0 | -1 | -2 |
| **TP** | +2 | +2 | +1 | +1 | +1 | +1 | +1 | +1 | 0 | -1 |
| **WS** | +2 | +2 | +2 | +2 | +2 | +2 | +2 | +2 | +1 | 0 |

---

## 7) How the Matrix Is Used

The matchup value is applied to:
- Initiative roll bias
- Defender PAR/DEF success chance
- Attacker DEC success chance (late bout)

It is **never** applied directly to damage.

---

## 8) AI Usage

AI uses the matrix to:
- Prefer favorable matchups
- Adjust aggression level mid-bout
- Decide whether to push or stall

---

## 9) UI & Player Transparency

The player should see:
- A matchup indicator (Advantage / Even / Disadvantage)
- Tooltip explanation: “Parry-Strike struggles vs Wall of Steel due to denied kill windows.”

Exact numbers remain hidden.

---

## 10) Acceptance Criteria

- Matrix is symmetric in intent but not numerically mirrored
- No style is dominant across all matchups
- Late-bout collapse feels inevitable, not random
- Kill windows feel earned

---

END OF DOCUMENT

---

## 6. Stable Lords — Equipment, Armor, Shields, and Encumbrance Interaction Spec (Definitive) v0.1
<a id="doc-06-stable-lords-equipment-armor-shields-and-encumbrance-interaction-spec-definitive-v0-1"></a>

**Source path:** `Stable_Lords_Equipment_Armor_Encumbrance_Spec_v0.1.md`  
**SHA-256:** `7b7a9b9121cbe4986381a39133624bd141bc7403e58129b04b38fcf04226f725`

### Contents (verbatim)

# Stable Lords — Equipment, Armor, Shields, and Encumbrance Interaction Spec (Definitive) v0.1
Generated: 2026-02-07

This document defines the **equipment system** in Stable Lords as it affects dueling bout outcomes.
It is written to be *implementation-ready* and lineage-faithful to canonical Duelmasters sources (pid 39–48 in particular) and Terrablood Duel II charts (encumbrance, damage, endurance).

This document specifies:
- Equipment slots and item schemas
- Weapon families, handling classes, and requirements
- Armor/shield mitigation and tradeoffs
- Encumbrance computation and penalty application
- How equipment modifies exchange resolution (INI/ATT/PAR/DEF/RIP/DEC and endurance costs)
- Style × equipment suitability (recommendations, not hard locks unless specified)
- UI/UX contracts and validation rules
- Acceptance criteria and test cases

This document depends on:
- **Warrior Design & Creation Spec v0.3 (Definitive)**
- **Dueling Bout System & Style × Style Matchup Matrix v0.1**
- **Strategy Editor & OE/AL/DEC Curves v0.1**

---

## 1) Equipment Design Goals

1. **Lineage-correct feel**
   - Heavy gear makes you *harder to kill* but *easier to control* (tempo loss).
2. **Visible tradeoffs**
   - Every gear choice has a readable “why” in tooltips.
3. **Skill expression**
   - Light builds win by timing and avoidance; heavy builds win by denial and damage soak.
4. **Determinism**
   - Given the same warrior + gear, outcomes are reproducible (seeded randomness only).
5. **No trap items**
   - Poor matches are allowed but warned; true “garbage gear” should not exist.

---

## 2) Slots, Constraints, and Loadout Legality

### 2.1 Slots
A warrior loadout consists of:

- **Weapon (required)**
- **Offhand (optional)**: shield or offhand weapon
- **Armor (required)**
- **Helm (required)**
- (Optional future slots: boots, gloves, trinkets — not in scope unless added later)

### 2.2 Handedness legality
**Hard rules:**
- Two-handed weapon → offhand must be empty
- Shield equipped → weapon must be one-handed
- Dual wield (offhand weapon) is allowed **only** for styles that support it (content rule), otherwise warning

### 2.3 Category legality
- Armor and helm must be present (no naked builds) unless a house rule explicitly permits it.
- Encumbrance tier **OVER** is illegal unless an explicit “forced kit” narrative event overrides legality.

---

## 3) Canonical Item Schema (Engineering Contract)

```ts
type WeaponHandedness = "ONE_HANDED" | "TWO_HANDED";
type WeaponFamily =
  | "SWORD"
  | "AXE"
  | "MACE"
  | "SPEAR"
  | "POLEARM"
  | "DAGGER"
  | "EXOTIC";

type DamageType = "CUT" | "PIERCE" | "BLUNT";

type ArmorClass = "CLOTH" | "LEATHER" | "MAIL" | "PLATE";
type HelmClass = "NONE" | "LIGHT" | "HEAVY";

type ShieldClass = "BUCKLER" | "ROUND" | "TOWER";

type Weapon = {
  id: string;
  name: string;
  family: WeaponFamily;
  damageType: DamageType;
  handedness: WeaponHandedness;

  // Requirements
  reqSTR: number;
  reqDFT: number;
  reqSPD: number;

  // Profiles
  baseDamage: number;          // adds to damageRating
  accuracyMod: number;         // adds to ATT
  parryMod: number;            // adds to PAR
  riposteMod: number;          // adds to RIP
  initiativeMod: number;       // adds to INI (usually negative for big weapons)
  enduranceCostMod: number;    // multiplier or additive

  // Special rules (data-driven)
  reach: number;               // affects targeting and initiative edge in some matchups
  armorPenetration: number;    // affects mitigation bypass
  tags: string[];              // e.g., ["CRUSH", "HOOK", "DISARMABLE"]
  weight: number;
};

type Armor = {
  id: string;
  name: string;
  armorClass: ArmorClass;
  weight: number;

  mitigation: {
    cut: number;
    pierce: number;
    blunt: number;
  };

  // penalties/bonuses
  defenseMod: number;          // affects DEF
  initiativeMod: number;       // affects INI
  enduranceCostMod: number;    // affects endurance costs
  encumbranceBias: number;     // additional weight multiplier in tier calc
  tags: string[];
};

type Helm = {
  id: string;
  name: string;
  helmClass: HelmClass;
  weight: number;

  headMitigation: {
    cut: number;
    pierce: number;
    blunt: number;
  };

  visionPenalty: number;       // affects ATT and DEF slightly (data-driven)
  initiativeMod: number;
  enduranceCostMod: number;
  tags: string[];
};

type Shield = {
  id: string;
  name: string;
  shieldClass: ShieldClass;
  weight: number;

  parryBonus: number;          // affects PAR
  defenseBonus: number;        // affects DEF (positioning)
  ripostePenalty: number;      // shields reduce counter speed
  initiativeMod: number;
  enduranceCostMod: number;
  coverage: "LOW" | "MEDIUM" | "HIGH"; // influences head/chest protection
  tags: string[];
};
```

**Key contract:** every numeric effect must be explainable in UI tooltips.

---

## 4) Weapon Requirements and Failure Penalties

### 4.1 Requirement check
A weapon’s requirements must be satisfied by the warrior’s attributes:
- STR ≥ reqSTR
- DFT ≥ reqDFT
- SPD ≥ reqSPD

### 4.2 Failure penalties (hard design)
If requirements are not met, apply *stacking* penalties:
- **ATT penalty**: `-2` per missing requirement band (or table-driven)
- **Endurance cost increase**: +10% per failed requirement
- **DEC penalty (late bout only)**: unwilling to commit with unfamiliar weapon

Failure is allowed (no hard block) but must be loudly warned unless house rules ban it.

---

## 5) Encumbrance: Computation and Penalty Application

### 5.1 Encumbrance max
Compute `encumbranceMax` from STR and SIZ (Terrablood lineage):
- Prefer table lookup (encode the chart)
- Fallback: piecewise approximation to the chart

### 5.2 Loadout weight
`totalWeight = weapon.weight + armor.weight + helm.weight + (offhand.weight if any)`

### 5.3 Tiering (locked)
Compute ratio `r = totalWeight / encumbranceMax`

| Tier | Ratio r | Legality | Intent |
|------|---------|----------|--------|
| NONE | ≤ 0.60 | legal | agile |
| LIGHT | 0.60–0.80 | legal | balanced |
| MEDIUM | 0.80–1.00 | legal | committed |
| HEAVY | 1.00–1.20 | legal but warned | slow grinder |
| OVER | > 1.20 | illegal by default | forced kits only |

### 5.4 Tier penalties (applied every exchange)
Encumbrance tier modifies:
- **INI** (initiative bias)
- **DEF** and **PAR** (reaction quality)
- **endurance cost** (fatigue acceleration)

Recommended baseline (tunable):

| Tier | INI | DEF | PAR | Endurance cost |
|------|-----|-----|-----|----------------|
| NONE | +0 | +0 | +0 | ×1.00 |
| LIGHT | -1 | -1 | 0 | ×1.05 |
| MEDIUM | -2 | -2 | -1 | ×1.10 |
| HEAVY | -4 | -4 | -2 | ×1.20 |
| OVER | -6 | -6 | -3 | ×1.35 |

---

## 6) Armor & Helm: Mitigation Model

### 6.1 Damage pipeline (per landed hit)
1. Compute attacker raw damage: (damageRating + weapon baseDamage + situational)
2. Determine damage type: CUT/PIERCE/BLUNT
3. Apply mitigation:
   - armor mitigation by type
   - helm mitigation if hit location is head
4. Apply armor penetration: `effectiveMitigation = max(0, mitigation - penetration)`
5. Final: `finalDamage = max(1, rawDamage - effectiveMitigation)`
6. Apply injury thresholds (data-driven)

### 6.2 Armor class identity
- Cloth/Leather: low mitigation, low penalties
- Mail: balanced; strong vs CUT
- Plate: high mitigation; heavy penalties and endurance drain

---

## 7) Shields: Parry/Defense Amplifier

- Shields add PAR directly and improve DEF positioning.
- Shields reduce RIP speed (ripostePenalty).
- Coverage reduces head/chest critical exposure.

---

## 8) Where Gear Hooks Into Exchange Resolution

Using canonical order: INI → ATT → PAR/DEF → RIP → Damage → DEC → Endurance

- **INI**: weapon/armor/helm/shield initiativeMod + encumbrance tier penalty
- **ATT**: weapon accuracyMod + helm visionPenalty + requirement penalties
- **PAR**: weapon parryMod + shield parryBonus + encumbrance penalties
- **DEF**: armor defenseMod + shield defenseBonus + encumbrance penalties
- **RIP**: weapon riposteMod - shield ripostePenalty
- **DEC**: optional weapon familiarity + late kill-window boosts for big weapons (content driven)
- **Endurance**: multiplied by weapon/armor/shield cost mods + encumbrance tier multiplier + Strategy (OE/AL)

---

## 9) Style × Equipment Suitability (Content Tables)

Suitability bands:
- Preferred / Viable / Suboptimal / Not Recommended

Minimum required tables:
1. style → preferred weapon families
2. style → armor class preference
3. style → shield preference
4. style → “anti-synergy warnings” list (for tooltips)

These tables power:
- optimizer pruning
- matchup previews
- “why” tooltips in UI

---

## 10) UI/UX Contracts

### 10.1 Loadout panel (required)
- slot cards (weapon/offhand/armor/helm)
- totalWeight, encumbranceMax, encumbranceTier pill
- penalties tooltip table
- weapon requirement checklist
- “simulate loadout” quick action

### 10.2 Warnings must be specific
Examples:
- “HEAVY kit: -4 INI, -4 DEF, -2 PAR; endurance ×1.20.”
- “Weapon req DFT 12; current DFT 8: -4 ATT; endurance +20%.”

---

## 11) Acceptance Criteria & Tests

Unit tests:
- Tier boundaries (0.60/0.80/1.00/1.20)
- handedness legality
- requirement penalty stacking

Simulation tests:
- plate increases survival but accelerates fatigue collapse
- shields increase parry events but reduce riposte frequency
- two-handed increases late kill conversion

UX acceptance:
- no silent penalties; everything tooltipped

---

END OF DOCUMENT

---

## 7. Stable Lords — Fighting Styles Compendium (Duelmasters-Accurate Naming) v0.3
<a id="doc-07-stable-lords-fighting-styles-compendium-duelmasters-accurate-naming-v0-3"></a>

**Source path:** `Stable_Lords_Fighting_Styles_Compendium_v0.3_DUELMASTERS_NAMES.md`  
**SHA-256:** `f5f6a03f4e171b6c77863edf0d47b5393f724c71a13b7baa3e7a742b93ccf258`

### Contents (verbatim)

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
- **Attack Location** + **Protect Location** (classic Stable Lords/Duel2 plan)【turn11search3】

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

---

## 8. Stable Lords — Consolidated Design Docs (Master v0.1)
<a id="doc-08-stable-lords-consolidated-design-docs-master-v0-1"></a>

**Source path:** `Stable_Lords_Granular_Master_Design_Doc_v0.1.md`  
**SHA-256:** `2f98429efe6220c60c3e3af0d0f94933deef7410396fcc26f5cefa315ea94159`

### Contents (verbatim)


# Stable Lords — Consolidated Design Docs (Master v0.1)

## 0) What this document is
This is the **fully expanded, granular, implementation-ready master design document** for *Stable Lords*.
It consolidates:
- Stable Lords Design Bible v1.6.0
- Stable Lords Design Bible v3.0
- Feature Integration Matrix

Nothing is summarized or abstracted. Every system is described with intent, player value, data needs, UI surfaces, and acceptance criteria.

This document is intended to be:
- The single source of truth for design
- Directly usable by engineering, UI, and content teams
- Suitable for long-term iteration and versioning

---

## 1) Core Fantasy & Pillars

### 1.1 Game Fantasy
Stable Lords is a **Duelmasters-inspired gladiator management and simulation game**.
The player operates a *Stable* of warriors competing in an evolving arena ecosystem defined by:
- Brutal combat
- Permanent death
- Fame, reputation, and crowd psychology
- Strategic meta drift across seasons and years

The fantasy is not merely winning fights — it is **shaping an era**.

### 1.2 Pillars
1. **Simulation First**
   - All outcomes derive from deterministic systems.
   - Narrative is generated *from* simulation, never overriding it.

2. **Death Has Weight**
   - Death is permanent.
   - Every death is recorded, narrated, archived, and remembered.

3. **Meta Is Content**
   - Dominant strategies rise and fall.
   - The world reacts to player and AI behavior.

4. **Always Playable**
   - The game must always boot and present meaningful state.
   - Stub data and guardrails are required when systems are incomplete.

---

## 2) Time, Calendar, and Progression

### 2.1 Time Model
- Time progresses in **weeks**.
- Four seasons per year:
  - Spring
  - Summer
  - Fall
  - Winter

Each season contains:
- Weekly matches
- One seasonal tournament

### 2.2 Yearly Loop
1. Pre-season setup
2. Weekly arena play
3. Seasonal tournament
4. Rewards and meta adjustment
5. Offseason management
6. Chronicle + Gazette summary

The year ends with:
- Token expiration
- Trainer contract rollover
- Meta drift calculation

---

## 3) Entities

### 3.1 Warrior

#### Core Attributes
- Name
- Age
- Style/Class (1 of 10)
- Stable affiliation
- Alive / Dead / Retired state

#### Combat Data
- Stats (OE, AL, KD, stamina, etc.)
- Physicals (endurance, damage tolerance)
- Equipment loadout
- Strategy timeline

#### Career Data
- Fight history
- Kill count
- Death cause (if applicable)
- Rivalries
- Titles and awards
- Fame score

#### Lifecycle
Recruit → Train → Compete → (Champion | Retire | Die)

All stages are permanent and logged.

---

### 3.2 Stable

- Roster limit: 10 warriors base
- +1 slot per championship held
- Up to 5 trainers

Stable Properties:
- Reputation sliders (Fame, Honor, Notoriety, Adaptability)
- Token inventory
- Championship lineage
- Owner personality

---

### 3.3 Trainer

- Specialization (Aggression, Defense, Endurance, Mind, Healing)
- Contract length: 1 year
- Bonus modifiers applied to training outcomes

Retired warriors may become trainers, inheriting style-based bonuses.

---

### 3.4 Owner (AI Personality)

Owners determine:
- Risk tolerance
- Meta adaptation behavior
- Recruitment preferences
- Training bias

Examples:
- Conservative
- Bloodthirsty
- Experimental
- Traditionalist

---

## 4) Combat & Death

### 4.1 Combat Resolution
- Deterministic simulation
- Driven by stats, strategy timeline, stamina, equipment
- Logged event-by-event

### 4.2 Death System
Death may occur when:
- Damage exceeds tolerance thresholds
- Critical injuries stack
- Execution events trigger

Every death generates:
- Chronicle entry
- Gazette narrative
- Hall of Warriors update

---

## 5) Fame, Crowd, and Meta

### 5.1 Fame
- Scale: 0–100
- Increases from:
  - Wins
  - Kills
  - Upsets
  - Gazette mentions
- Decays slowly with inactivity

### 5.2 Notoriety
Generated by:
- Kill count
- Brutal finishes
- Rivalry executions

### 5.3 Crowd Mood
Arena-wide mood states:
- Calm
- Bloodthirsty
- Theatrical
- Solemn
- Festive

Crowd mood affects:
- Fame gain
- Kill probability
- Gazette tone

### 5.4 Meta Drift
- Styles gain or lose effectiveness based on outcomes
- AI adapts differently depending on owner personality
- Gazette names eras explicitly

---

## 6) Tournaments & Rewards

### 6.1 Tournament Structure
- Seasonal tournaments
- Tiered difficulty

### 6.2 Rewards
| Place | Reward |
|-----|-------|
| 1st | +1 Stable Slot |
| 2nd | Weapon Insight Token |
| 3rd | Rhythm Insight Token |

### 6.3 Tokens
- Expire at year end
- Can be reassigned
- Generate narrative mentorship events

---

## 7) UI & Screens

### 7.1 Arena Hub
- Crowd mood display
- Weekly leaderboard
- Spotlight feed
- Gazette access
- Meta pulse

### 7.2 Stable Hall
- Roster wall
- Reputation sliders
- Trainer table
- Chronicle excerpts

### 7.3 Stable Ledger
Tabs:
1. Overview
2. Rewards & Tokens
3. Contracts
4. Chronicle
5. Hall of Warriors

---

## 8) Feature Integration Matrix (Expanded)

Each feature includes:
- Player value
- UI surface
- Data/state
- Acceptance criteria

### Example: F1 Warrior Builder
- Validation on stats
- Trait conflict detection
- Randomize within constraints

### Example: F15 Kill Analytics
- Death cause chain
- Hit location breakdown
- Aggregate trends

(All F1–F39 fully specified in original response are considered mandatory.)

---

## 9) Procedural Narrative

### 9.1 Chronicle
- Permanent factual record
- Queryable

### 9.2 Gazette
- Weekly narrative synthesis
- Tone reflects crowd mood
- References real simulation events

---

## 10) Persistence & Versioning

- All entities use UUIDs
- Versioned save migrations
- Content updates atomic

---

## 11) Presentation Tone

- Ancient arena manuscript aesthetic
- Marble halls
- Living history feel

---

END OF MASTER DOCUMENT

---

## 9. Stable Lords — UI & State Contract (Extracted + Target Map) v0.2
<a id="doc-09-stable-lords-ui-state-contract-extracted-target-map-v0-2"></a>

**Source path:** `Stable_Lords_UI_and_State_Contract_v0.2.md`  
**SHA-256:** `5f3a8ac20fa58af4a59fb43ddc6e93362a13a06e14e0281b28a658c8e68c53ca`

### Contents (verbatim)

# Stable Lords — UI & State Contract (Extracted + Target Map) v0.2

> Generated: 2026-01-10

This document is a **UI engineering contract**: it enumerates the *actual* current UI surfaces discovered in the provided StableLords build archives, then expands them into the **required target navigation map** implied by the Design Bibles + Feature Integration Matrix.

It is meant to be used as:
- a route map
- a per-screen acceptance criteria checklist
- a component + state ownership reference

---

## 1) Build Reality Check: What Exists in the Provided Code

### 1.1 App entry + routing

The current build uses a Next-style entry (`src/app/page.tsx`) that renders an internal `AppRoot`, which itself uses `react-router-dom` with a small route table.

**Observed router definition (verbatim):**

```ts
import React from 'react';
import { createBrowserRouter, RouterProvider, RouteObject, Link } from 'react-router-dom';
import HallOfFights from '../pages/HallOfFights';
import { ToastsProvider } from '../ui/Toasts';
import RunRoundPanel from '../components/RunRoundPanel';

const routes: RouteObject[] = [
  { path: '/', element: <RunRoundPanel /> },
  { path: '/hall-of-fights', element: <HallOfFights /> },
];

const router = createBrowserRouter(routes);

export default function AppRoot() {
  return (
    <ToastsProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between p-3">
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link to="/" className="hover:text-emerald-300">Run Round</Link>
              <Link to="/hall-of-fights" className="hover:text-emerald-300">Hall of Fights</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4">
          <RouterProvider router={router} />
        </main>
      </div>
    </ToastsProvider>
  );
}
```

**Interpretation:**
- Currently *wired* routes:
  - `/` → Run Round (RunRoundPanel)
  - `/hall-of-fights` → Hall of Fights
- There are additional route components present in `src/routes/*`, but they are not currently registered in `AppRoot`.


### 1.2 UI feature inventory (files discovered)

This is the inventory of UI/state modules that exist in the provided build and are intended to be wired:

```text
app/AppRoot.tsx
app/layout.tsx
app/page.tsx
components/Badges/PersonalityBadge.tsx
components/CharacterPage.tsx
components/Chips/FameChip.tsx
components/Chips/RenownChip.tsx
components/Owners/HallOfOwnersPage.tsx
components/PlanBuilder.tsx
components/ResultChips.tsx
components/RosterTable.tsx
components/RunRoundPanel.tsx
components/TargetingModal.tsx
components/Toasts.tsx
lore/AnnouncerAI.ts
lore/HallOfFights.tsx
lore/LoreArchive.ts
metrics/StyleMeter.ts
modules/owners.ts
modules/trainers.ts
panels/NewsletterPanel.tsx
panels/RunRoundPanel.tsx
routes/CharacterPage.tsx
routes/owners/index.tsx
state/gameStore.ts
state/save.owners.ts
state/save.patches.ts
state/uiPrefs.ts
ui/Chips.tsx
ui/Toasts.tsx
ui/TournamentLegacy.tsx
ui/TournamentPanel.tsx
ui/commentator.ts
ui/fightVariety.ts
ui/flair/FlairChips.tsx
ui/toast/Toasts.tsx
```

### 1.3 State stores and persistence helpers

#### 1.3.1 Zustand store (current)

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type Warrior = {
  id: string
  name: string
  style: string
  stats: Record<string, number>
}

type GameState = {
  warriors: Warrior[]
  addWarrior: (w: Warrior) => void
}

export const useGameStore = create<GameState>()(immer((set) => ({
  warriors: [],
  addWarrior: (w) => set((s) => {
    s.warriors.push(w)
  })
})))
```

**Contract implications:**
- `useGameStore.warriors[]` is the canonical in-memory roster list for now.
- Any screen that edits roster must funnel edits through a store method (currently only `addWarrior`).
- For future-proofing, expand to include:
  - stables
  - trainers
  - tournaments
  - chronicle entries
  - gazette issues
  - meta weights
  - saves


#### 1.3.2 Owners persistence helpers (present)

```ts
/**
 * Persistence helpers for Owners — pairs with global save.ts store.
 * These helpers are safe to include even if save.ts stores owners differently;
 * they no-op gracefully when arrays aren't present.
 */

export type OwnerPersist = {
  id: string;
  name: string;
  stableName: string;
  fame: number;
  renown: number;
  titles: number;
  personality?: 'Aggressive' | 'Methodical' | 'Showman' | 'Pragmatic' | 'Tactician';
};

const KEY = 'stablelords.owners.v1';

export function loadOwners(): OwnerPersist[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveOwners(list: OwnerPersist[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function upsertOwner(owner: OwnerPersist) {
  const list = loadOwners();
  const idx = list.findIndex(o => o.id === owner.id);
  if (idx >= 0) list[idx] = owner; else list.push(owner);
  saveOwners(list);
}

export function bumpOwnerFame(id: string, amt: number) {
  const list = loadOwners();
  const o = list.find(x => x.id === id);
  if (o) { o.fame = Math.max(0, (o.fame || 0) + amt); saveOwners(list); }
}

export function bumpOwnerRenown(id: string, amt: number) {
  const list = loadOwners();
  const o = list.find(x => x.id === id);
  if (o) { o.renown = Math.max(0, (o.renown || 0) + amt); saveOwners(list); }
}

export function addOwnerTitle(id: string) {
  const list = loadOwners();
  const o = list.find(x => x.id === id);
  if (o) { o.titles = (o.titles || 0) + 1; saveOwners(list); }
}
```

**Contract implications:**
- Owners have a stable name, fame, renown, titles, personality.
- These helpers imply local persistence (storage key not shown due to truncated excerpt).
- Hall of Owners can be implemented without the full simulation: seed owners, rank them, render chips.


#### 1.3.3 UI prefs persistence (present)

```ts
export type UIPrefs = { autoTunePlan: boolean };
const K = 'stablelords.uiprefs.v1';
export function loadUIPrefs(): UIPrefs {
  try { const raw = localStorage.getItem(K); if (raw) return JSON.parse(raw); } catch {}
  return { autoTunePlan: true };
}
export function saveUIPrefs(p: UIPrefs) {
  try { localStorage.setItem(K, JSON.stringify(p)); } catch {}
}
```

---

## 2) Screens Present (Implemented or Near-Implemented)

This section defines each screen with:
- route
- purpose
- primary UI regions
- state/data dependencies
- interactions
- acceptance criteria


### 2.1 Run Round (Home)

**Route (wired):** `/`

**Purpose:**
- Run a weekly simulation step (“Run Round / Run Week”) and display outputs.
- Acts as the ‘dev harness’ for simulation, newsletter, and style meter.

**Primary components referenced:**
- `components/RunRoundPanel.tsx`
- `panels/NewsletterPanel.tsx`
- `lore/StyleMeter` and `metrics/StyleMeter`
- `engine/simWrapper`, `engine/matchmaking`

**State/Data:**
- Local component state: `running`, `results[]`
- LoreArchive acts as historical cache for fights and hall labels.

**Interactions:**
- User presses Run Round
- App generates weekly matchups
- Sim runs fights
- Results appended to archive and surfaced in UI

**Acceptance criteria:**
- Run button is disabled during run.
- Run produces deterministic results when seed is fixed.
- Results list includes: winner, method, at least 1 “variety/flashy” tag.
- Errors are toast surfaced; app never hard-crashes.


### 2.2 Hall of Fights

**Route (wired):** `/hall-of-fights`

**Purpose:**
- Archive viewer of notable fights; intended to show weekly highlights and tournament hall entries.

**Primary module (verbatim excerpt):**

```ts
/* Duelmasters — Sprint 5A delta */
import React from "react";
import { LoreArchive } from "./LoreArchive";

const Row: React.FC<{ title: string; right?: string; children?: React.ReactNode }> = ({ title, right, children }) => (
  <div className="rounded border border-gray-200 p-3 bg-white shadow-sm">
    <div className="flex items-center justify-between">
      <div className="font-semibold">{title}</div>
      {right && <div className="text-xs text-gray-500">{right}</div>}
    </div>
    {children}
  </div>
);

export const HallOfFights: React.FC = () => {
  const hall = LoreArchive.allHall().slice().reverse();
  const fights = new Map(LoreArchive.allFights().map(f => [f.id, f]));
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Hall of Fights</h1>
      <p className="text-sm text-gray-600 mb-6">Crowd-remembered epics of the arena.</p>
      <div className="space-y-3">
        {hall.map(h => {
          const f = fights.get(h.fightId);
          if (!f) return null;
          const title = f.title || `${f.a} vs. ${f.d}`;
          const by = f.by ? ` (${f.by})` : "";
          return (
            <Row key={h.fightId} title={`${h.label} — Week ${h.week}`} right={new Date(f.createdAt).toLocaleString()}>
              <div className="mt-1 text-sm">{title}{by}</div>
              {f.flashyTags && f.flashyTags.length>0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {f.flashyTags.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">{t}</span>)}
                </div>
              )}
            </Row>
          );
        })}
      </div>
    </div>
  );
};

export default HallOfFights;
```

**State/Data:**
- Reads from `LoreArchive.allHall()`
- Reverse chronological display

**Interactions:**
- Scroll and browse
- (Target) click to open fight detail view (future)

**Acceptance criteria:**
- Never empty in demo mode: Seed Demo must create hall entries.
- Each row shows: title, right-side meta label (week/season/tournament), summary, tags.
- Clicking a tag filters view (target enhancement).


### 2.3 Hall of Owners (Present, Not Wired)

**Route (target):** `/owners`

**Purpose:**
- Ranks owners by an aggregate score derived from Fame/Renown/Titles and personality.

**Primary component (verbatim excerpt):**

```ts
import * as React from 'react';
import { loadOwners } from '../../state/save.owners';
import { rankOwners } from '../../modules/owners';
import { FameChip } from '../Chips/FameChip';
import { RenownChip } from '../Chips/RenownChip';
import { PersonalityBadge } from '../Badges/PersonalityBadge';

export default function HallOfOwnersPage() {
  const [owners, setOwners] = React.useState(loadOwners());
  React.useEffect(() => {
    setOwners(loadOwners());
  }, []);

  const ranks = rankOwners(owners);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Hall of Owners</h1>
      <p className="text-sm text-zinc-400">Ranking owners by Fame, Renown, and Titles.</p>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/70">
            <tr>
              <th className="text-left px-3 py-2">Rank</th>
              <th className="text-left px-3 py-2">Owner</th>
              <th className="text-left px-3 py-2">Stable</th>
              <th className="text-left px-3 py-2">Badges</th>
              <th className="text-left px-3 py-2">Fame</th>
              <th className="text-left px-3 py-2">Renown</th>
              <th className="text-left px-3 py-2">Titles</th>
              <th className="text-left px-3 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {ranks.map(r => {
              const o = owners.find(x => x.id === r.id)!;
              return (
                <tr key={r.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                  <td className="px-3 py-2 font-medium">{r.rank}</td>
                  <td className="px-3 py-2">{o.name}</td>
                  <td className="px-3 py-2">{o.stableName}</td>
                  <td className="px-3 py-2"><PersonalityBadge personality={o.personality} /></td>
                  <td className="px-3 py-2"><FameChip value={o.fame || 0} /></td>
                  <td className="px-3 py-2"><RenownChip value={o.renown || 0} /></td>
                  <td className="px-3 py-2">{o.titles || 0}</td>
                  <td className="px-3 py-2">{Math.round(r.score)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**State/Data:**
- `loadOwners()` from `state/save.owners`
- `rankOwners()` from `modules/owners`

**Interactions:**
- Sort and filter owners (target)
- Click owner → open Stable Hall (target)

**Acceptance criteria (to wire):**
- Add nav link in AppRoot
- Register route `{ path: '/owners', element: <OwnersRoute/> }`
- Ensure Seed Demo generates at least 10 owners.


### 2.4 Character Page (Present, Not Wired)

**Route (target):** `/warrior/:id`

**Purpose:**
- Detailed warrior profile: record, fame, popularity, injuries, titles, trainer status.

**Route component excerpt:**

```ts
import * as React from "react";
import { FlairChip } from "../components/ResultChips";

type Injury = { name: string; week: number };
type Title = { name: string; season: string };

export type CharacterRecord = {
  id: string;
  name: string;
  stableId: string;
  style: string;
  fame: number;
  popularity: number;
  wins: number; losses: number; kills: number;
  injuries?: Injury[];
  titles?: Title[];
  trainerStatus?: { isTrainer: boolean; specialty?: string } | null;
  flair?: string|null;
};

export const CharacterPage: React.FC<{ char: CharacterRecord }> = ({ char }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{char.name}</h1>
          <p className="text-sm text-slate-400">{char.style} • {char.wins}-{char.losses}-{char.kills} • Fame {char.fame} • Pop {char.popularity}</p>
        </div>
        <FlairChip flair={char.flair} />
      </div>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Career Stats</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>Wins: {char.wins}</li>
            <li>Losses: {char.losses}</li>
            <li>Kills: {char.kills}</li>
            <li>Fame: {char.fame}</li>
            <li>Popularity: {char.popularity}</li>
          </ul>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Injury History</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            {(char.injuries?.length ? char.injuries : []).map((i,idx)=>(<li key={idx}>{i.name} (Week {i.week})</li>))}
            {!(char.injuries?.length) && <li>None</li>}
          </ul>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Titles</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            {(char.titles?.length ? char.titles : []).map((t,idx)=>(<li key={idx}>{t.name} — {t.season}</li>))}
            {!(char.titles?.length) && <li>None yet</li>}
          </ul>
        </div>
      </section>

      {char.trainerStatus?.isTrainer && (
        <section className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Trainer</h2>
          <p className="text-sm text-slate-300">Specialty: {char.trainerStatus?.specialty || "Generalist"}</p>
        </section>
      )}
    </div>
  );
};
```

**State/Data:**
- Needs character lookup by id (store or LoreArchive)

**Interactions:**
- from roster table, click name → navigate to profile

**Acceptance criteria:**
- Route param id loads from a canonical store (Zustand + persistence)
- If missing id, show “Unknown warrior” with back link; never crash.


---

## 3) Target Navigation Map (Required by Design Bibles + Feature Matrix)

This is the **intended** navigation structure once the design-doc-defined screens are implemented. Each item includes a recommended route and the source-of-truth owning module.


### 3.1 Top-level routes

- `/` Arena Hub (world dashboard)

- `/stable` Stable Hall (your stable prestige page)

- `/ledger` Stable Ledger (management super-screen)

- `/tournaments` Tournament Index

- `/tournaments/:id` Tournament Bracket + Prep Mode

- `/owners` Hall of Owners

- `/warrior/:id` Warrior Card / Profile

- `/trainer/:id` Trainer Card

- `/archives/styles` Style Archives Browser

- `/archives/styles/:styleId` Style Detail

- `/gazette` Gazette Index

- `/gazette/:issueId` Gazette Issue Detail

- `/chronicle` Chronicle Browser

- `/settings` Settings + Accessibility

- `/mods` Mods / House Rules

- `/import-export` Import/Export Manager

- `/telemetry` Telemetry + Error Logs

- `/admin` Admin Tools (dev builds)


### 3.2 Required deep links (must work anywhere)

- From any warrior name chip → `/warrior/:id`
- From any stable name chip → `/stable/:id` (future; player stable default `/stable`)
- From any tournament reference → `/tournaments/:id`
- From any Chronicle entry → opens a detail drawer with linked entities


---

## 4) Per-Screen UI Contracts (Granular)

This section is the engineering checklist that ensures each screen is shippable and aligns to the master design.


### 4.1 Arena Hub (`/`)

**UI regions (required):**
1. Header banner: arena name, emblem, season/week, crowd mood meter
2. Left rail: weekly Top 10 leaderboard
3. Right rail: Spotlight feed (kills, rivalries, upsets)
4. Bottom tabs:
   - Leaderboards
   - Match Results
   - Gazette
   - Meta Pulse

**State dependencies:**
- `worldClock` (year/season/week)
- `crowdMood`
- `leaderboard[]`
- `spotlightFeed[]`
- `metaWeights` (style effectiveness)
- `latestResults[]`

**Interactions:**
- Run Week / Simulate
- Click leaderboard entry → warrior profile
- Click feed item → fight detail / chronicle entry

**Acceptance criteria:**
- Arena Hub must render even with empty state (demo scaffolding).
- All list items are clickable and do not dead-end.
- Mood meter updates after fights.


### 4.2 Stable Hall (`/stable`)

**UI regions:**
- Banner (emblem + motto)
- Roster wall (cards) with sorting: record/fame/style
- Trainer table (specialty + contract year)
- Reputation sliders (fame/notoriety/honor/adaptability)
- Stable leaderboards (rank, titles)
- Chronicle excerpt feed (stable-related events)

**State:**
- stable record, roster ids, trainer ids
- aggregated metrics

**Acceptance criteria:**
- Roster cards deep link to warrior profiles.
- Reputation sliders reflect computed values and show tooltip explanation.


### 4.3 Stable Ledger (`/ledger`)

**Tabs (required):** Overview, Rewards & Insights, Contracts & Tenure, Chronicle Log, Hall of Warriors.

**Rewards & Insights:**
- token inventory table
- assign token modal
- expiry warning banners

**Acceptance criteria:**
- Tokens cannot be assigned illegally.
- Token assignment produces a Chronicle entry + Gazette hook.


### 4.4 Tournament Index + Tournament Detail (`/tournaments`)

**Tournament Index:** list upcoming/current/past tournaments, with tier chips.
**Tournament Detail:** bracket, entrants, results, reward summary.

**Prep Mode (Feature 23):**
- eligibility checklist
- fatigue/injury warnings
- equipment freeze checks
- ‘Fix now’ shortcuts

**Acceptance criteria:**
- Bracket is navigable round-by-round.
- Prep Mode has blocking vs non-blocking issues clearly labeled.


### 4.5 Style Archives (`/archives/styles`)

**Purpose:** encyclopedia for the 10 styles.

**Acceptance criteria:**
- Search + filter
- Link from style chip anywhere


### 4.6 Settings + Accessibility (`/settings`)

- High contrast
- Text size
- Reduced motion
- Persist prefs


---

## 5) Wiring Plan: Minimal Route Additions to Reach the Target Map

To turn the existing build into the required navigable shell (always playable):

1. Expand `routes` in `AppRoot.tsx` to include placeholder pages for all top-level routes.
2. Add nav links for: Arena Hub, Stable Hall, Ledger, Tournaments, Owners, Archives, Settings.
3. Seed Demo must populate:
   - 1 player stable + 9 AI stables
   - 50+ warriors
   - 10 owners
   - at least 1 Gazette issue and 10 Chronicle entries
4. Every placeholder route must show meaningful demo content and a “Coming soon” section.

---

## 10. Stable Lords — Warrior Design & Creation Specification (Granular, Implementable) v0.1
<a id="doc-10-stable-lords-warrior-design-creation-specification-granular-implementable-v0-1"></a>

**Source path:** `Stable_Lords_Warrior_Design_and_Creation_Spec_v0.1.md`  
**SHA-256:** `679b298f1a7b2a90d534e06453b5981681b4d447aaa4cfc3652cc3d1ae349ffa`

### Contents (verbatim)

# Stable Lords — Warrior Design & Creation Specification (Granular, Implementable) v0.1
Generated: 2026-01-10

This document defines **how a warrior is designed** in *Stable Lords*—from concept and lore to **exact data fields**, **creation workflows**, **derived-stat math contracts**, **UI surfaces**, and **validation rules**.

It incorporates (and aligns to) Duel II / Duelmasters lineage using Terrablood reference material for:
- **Attribute-driven skill base deltas** (Terrablood Skill Chart)
- **WIT statement thresholds** (Intelligence / Good / Bad / Endurance WIT statements)
- **Coordination & Quickness statements**
- **Activity Ratings** (initiative base vs riposte bases)
- **Hit Points, Endurance, Encumbrance, Damage charts**
- **Skill base charts** (Terrablood / Bagman II / Ween)

**Non-goal:** This doc does *not* attempt to perfectly replicate Duel II's hidden math. Instead it defines an implementable system that:
1) preserves the *lineage mental model*, and  
2) is explicit, deterministic, and testable.

---

## 1) Warrior: Product Intent

### 1.1 What a Warrior Is (player promise)
A Warrior is:
- A **roster unit** (management)
- A **combat agent** (simulation)
- A **legend container** (history & narrative)
- A **stat puzzle** (optimization)
- A **meta participant** (styles rise/fall)

The player should feel:
- “I *built* this fighter.”
- “Their strengths and flaws were predictable.”
- “Their career is a story I can trace.”

### 1.2 What “Designed” Means in Stable Lords
“Designing a warrior” is the sum of:
1. **Identity**: name, origin, archetype, style fantasy
2. **Physicals**: core attributes (STR/WIT/WIL/SPD/DFT/CON/SIZ)
3. **Skill bases**: Attack/Parry/Defense/Initiative/Riposte/Decisiveness
4. **Derived combat stats**: HP, endurance, damage, encumbrance budget, fatigue
5. **Style & tactics**: the fighting style + strategy plan presets
6. **Equipment**: weapon, armor, helm, shield (with suitability)
7. **Flavor statements**: quickness/coordination/wit lines used by UI and Gazette
8. **Growth plan**: training specialization and trajectory
9. **Career container**: fight history, fame, rivalries, titles, death record

---

## 2) Data Model (Engineering Contract)

### 2.1 Canonical Warrior Record (minimum schema)
**All fields required unless marked optional.**

```ts
type UUID = string;

type WarriorId = UUID;
type StableId = UUID;
type TrainerId = UUID;

type FighterStatus = "ACTIVE" | "RETIRED" | "DEAD";
type Sex = "M" | "F" | "X";

type FightingStyleId =
  | "AIMED_BLOW"
  | "BASHER"
  | "LUNGER"
  | "PARRY_LUNGE"
  | "PARRY_RIPOSTE"
  | "PARRY_STRIKE"
  | "SLASHER"
  | "STRIKER"
  | "TOTAL_PARRY"
  | "WALL_OF_STEEL"; // names align to Duelmasters/Duel II lineage

type BodyTarget = "HEAD" | "CHEST" | "ABDOMEN" | "ARMS" | "LEGS" | "ANY";

type Attributes = { STR: number; WIT: number; WIL: number; SPD: number; DFT: number; CON: number; SIZ: number; };

type SkillBases = { ATT: number; PAR: number; DEF: number; INI: number; RIP: number; DEC: number; };

type Derived = {
  hitPoints: number;
  endurance: number;            // stamina pool / fatigue buffer
  encumbranceMax: number;       // max weight class budget before penalties
  damageRating: number;         // base damage modifier
  activityRating: string;       // e.g., "VSI", "RI", "A", etc. (see Activity Ratings)
  quicknessStatementId: string; // points to a statement template
  coordinationStatementId: string;
  witStatementId: string;
};

type EquipmentLoadout = {
  weaponId: string;
  offhandId?: string; // shield or offhand weapon
  armorId: string;
  helmId: string;
  totalWeight: number;
  encumbranceTier: "NONE" | "LIGHT" | "MEDIUM" | "HEAVY" | "OVER";
};

type Warrior = {
  id: WarriorId;
  stableId: StableId;
  createdAtISO: string;

  // Identity
  name: string;
  epithet?: string;
  origin: "ORPHANAGE" | "BOUGHT" | "CAPTURED" | "CUSTOM";
  sex: Sex;
  age: number;

  // Primary build
  styleId: FightingStyleId;
  attributes: Attributes;
  baseSkills: SkillBases;
  derived: Derived;

  // Combat planning
  preferredTarget: BodyTarget;
  strategyPresetId?: string; // links to minute-by-minute plan curve
  temperament: "CALM" | "BOLD" | "SAVAGE" | "TRICKY" | "DUTIFUL";

  // Gear
  equipment: EquipmentLoadout;

  // Career + meta
  status: FighterStatus;
  fame: number;        // 0..100
  notoriety: number;   // 0..100
  popularity: number;  // 0..100

  wins: number;
  losses: number;
  kills: number;

  titles: Array<{ seasonId: string; titleId: string; }>; // champion, medals, etc.
  injuries: Array<{ id: UUID; kind: string; severity: number; startISO: string; endISO?: string; }>;
  rivalries: Array<{ opponentId: WarriorId; heat: number; lastFightISO: string; }>;

  // Hidden discovery layer (optional, can be revealed over time)
  favoriteWeaponId?: string;
  rhythmProfileId?: string;

  // History pointers
  fightIds: string[];
  chronicleEntryIds: string[];
};
```

### 2.2 Normalization Rules
- **Warrior is the source of truth** for attributes, base skills, and derived stats at creation.
- Derived stats are **recomputed** whenever: attributes change, equipment changes, or a major progression event occurs (promotion, trainer conversion).
- Fight logs never mutate the creation record; they reference snapshots.

---

## 3) Warrior Creation Pipeline (Player Workflow)

There are two creation contexts:

### 3.1 Creation Context A — “Recruit” (most common)
The player selects from a pool of generated recruits.
- Each recruit is a fully generated Warrior record with:
  - name + origin + age
  - styleId
  - attributes
  - baseSkills (computed)
  - derived stats (computed)
  - starter gear (computed)

**Player actions:**
1. Compare recruit cards
2. Open detail drawer (shows statements, suitability, curves)
3. Purchase/Sign
4. Optionally rename

### 3.2 Creation Context B — “Custom Build” (designer mode / sandbox)
The player can design a warrior by:
1. Choosing styleId
2. Allocating attributes (with constraints)
3. Picking equipment (with warnings)
4. Selecting strategy preset
5. Final validation + confirm

**Use cases:**
- Single-player sandbox
- Dev harness / demo builds
- Tutorial “build your first gladiator”

### 3.3 Creation Context C — “Narrative Acquisition”
Warriors enter your stable via events:
- captured rival
- bought from a dying stable
- tournament prize fighter
- orphanage rescue

These can override normal constraints (rare “oddities”), but must still compute baseSkills and derived stats from attributes + style + equipment.

---

## 4) Core Attributes (Physicals) — Definitions, Ranges, and Effects

Stable Lords uses the classic 7-stat set as the **creation foundation**:

- STR (Strength)
- WIT (Wit / Intelligence)
- WIL (Willpower)
- SPD (Speed)
- DFT (Deftness / Dexterity)
- CON (Constitution)
- SIZ (Size)

### 4.1 Range Contract
- Each stat: **3..25**
- Total points budget for “standard” recruits: configurable (default 70)
- At least **2 dump stats** should exist in most recruits (to preserve “flawed hero” fantasy).

### 4.2 Attribute → Skill Delta Contract (Terrablood Skill Chart lineage)
At creation, each attribute contributes **skill deltas** (bonuses/penalties) to base skills.
Stable Lords implements this using **breakpoints** inspired by the Terrablood Skill Chart.

---

## 5) Skill Bases: ATT / PAR / DEF / INI / RIP / DEC

### 5.1 Skill Definitions (player-facing)
- **ATT (Attack):** chance to land a hit; also influences hit quality.
- **PAR (Parry):** blocks with weapon/shield.
- **DEF (Defense):** avoids getting hit via footwork, positioning.
- **INI (Initiative):** who acts first; tempo advantage.
- **RIP (Riposte):** counter-attack after defense/parry events.
- **DEC (Decisiveness):** willingness to commit; influences kill windows and “finish” behavior.

### 5.2 Base Skill Computation (creation-time algorithm)
Creation computes baseSkills in 5 layers:
1) Start values by style (style seed)  
2) Add attribute deltas (breakpoints)  
3) Add style modification offsets (style mod table)  
4) Apply controlled randomness  
5) Clamp to legal ranges  

---

## 6) Derived Stats (HP, Endurance, Damage, Encumbrance)
Derived stats exist to make “build” meaningfully translate into match behavior.

- HP: from CON + SIZ (hit point chart lineage)
- Endurance: stamina pool (warrior endurance chart lineage)
- Damage: from STR + weapon + style (warrior damage chart lineage)
- Encumbrance: from STR + SIZ + loadout weight (encumbrance chart lineage)

---

## 7) Statements Layer (UI Flavor + Diagnostics)
Statements are deterministic descriptors derived from numeric values.

- WIT intelligence thresholds (Intelligence WIT statements)
- Good/Bad/Endurance phrasing packs
- Quickness statements from DEF + PAR (with WIT gate)
- Coordination statements from SPD/DFT/DEF composite

---

## 8) Activity Ratings (Tempo Personality)
Activity ratings summarize INI base vs RIP base to a short label (initiative vs riposte grid).

---

## 9) Equipment Suitability (Creation + Progression)
- Weapon stat requirements enforce minimum STR/DFT/SPD, else penalties.
- Weapons-for-each-style provides recommendations + warnings.
- Encumbrance tier applies penalties to INI/DEF and endurance cost.

---

## 10) UI Design: Recruit Cards + Builder
- Recruit card shows: style chip, headline statements, derived bars, activity rating.
- Recruit drawer shows: full computation breakdown (how each value formed).
- Custom builder is step-based with precise validation messaging.

---

## 11) Testing & Acceptance Criteria
- Deterministic recruit generation
- Derived stats auto-update on attribute/gear changes
- No illegal builds without explicit override
- Telemetry event for creation emitted

---

## 12) Reference Index (Canonical External Sources)
The following Terrablood reference pages are canonical for future Stable Lords warrior design work:
- Intelligence WIT statements
- Terrablood Skill Chart
- Bagman II Skill Chart
- Ween Skill Chart
- Good / Bad / Endurance WIT statements
- Warrior activity ratings
- Coordination statements
- Warrior endurance chart
- Hit point chart
- Encumbrance chart
- Warrior quickness statements
- Warrior damage chart

---
END OF DOCUMENT

---

## 11. Stable Lords — Warrior Design & Creation Specification v0.3 (Definitive, Lineage‑Integrated)
<a id="doc-11-stable-lords-warrior-design-creation-specification-v0-3-definitive-lineageintegrated"></a>

**Source path:** `Stable_Lords_Warrior_Design_and_Creation_Spec_v0.3_DEFINITIVE.md`  
**SHA-256:** `8b3bb88560c52dcd5cd405ce978ed79ddb23a35d8bf8756cfc66f143b68ac8ab`

### Contents (verbatim)

# Stable Lords — Warrior Design & Creation Specification v0.3 (Definitive, Lineage‑Integrated)
Generated: 2026-01-10

This document is the **definitive, lineage-faithful specification** for how a Warrior is designed in *Stable Lords*.

It fully integrates **all canonical Duelmasters and Terrablood sources**:
- Duelmasters: pid 2, 8–16, 19, 39–53
- Terrablood Duel II reference charts and statements

---

## 0) Design Philosophy Lock
Stable Lords warriors must behave like Duelmasters fighters, explain themselves clearly, remain deterministic, and preserve imperfection and collapse.

---

## 1) Canonical Attribute Model (pid=2)
Attributes: STR, WIT, WIL, SPD, DFT, CON, SIZ  
Range: 3–25, standard total ≈70

---

## 2) Attributes → Base Skills (Terrablood)
Base Skills: ATT, PAR, DEF, INI, RIP, DEC  
Computed via:
1. Style seed
2. Attribute breakpoints
3. Style offsets
4. Controlled randomness
5. Clamp

---

## 3) Fighting Styles (pid=28–38)
Aimed Blow, Basher, Lunger, Parry‑Lunge, Parry‑Riposte, Parry‑Strike, Slasher, Striker, Total Parry, Wall of Steel

---

## 4) Combat Resolution Order (pid=49–53)
INI → ATT → PAR → DEF → RIP → Damage → DEC → Endurance

---

## 5) Activity Ratings (pid=13–14)
Derived from INI vs RIP; used for AI and UI chips.

---

## 6) Derived Physical Stats
HP (pid=39), Endurance (pid=40), Damage (pid=41), Encumbrance (pid=42–45)

---

## 7) Statements Layer (Terrablood)
WIT, Quickness, Coordination statements mapped deterministically.

---

## 8) Equipment Rules (pid=39–48)
Weapon requirements, loadout legality, encumbrance tiers.

---

## 9) Creation Contexts
Recruit, Custom Build, Narrative Acquisition

---

## 10) Validation
Deterministic, guarded, recomputed on change.

---

## 11) Canonical Reference Index
Duelmasters pid: 2, 8–16, 19, 39–53  
Terrablood Duel II references

---

END OF DOCUMENT

---

## 12. README-FIRST.txt
<a id="doc-12-readme-first-txt"></a>

**Source path:** `_extract/Duelmasters-Scaffold-EngineSlot-v0.6.1/Duelmasters-Scaffold-EngineSlot-v0.6.1/README-FIRST.txt`  
**SHA-256:** `2e7af6205056ba1e48bfb86033767521c6be237c1b993b8476671cbce617e359`

### Contents (verbatim)

```text

Duelmasters Scaffold (Engine Drop-in) — v0.6.1

What this is:
• A ready-to-run React + Vite + TypeScript project with Tailwind and Radix.
• The UI is already wired to an engine "slot" so you can paste your full engine later.
• Double-click to run (mac: run-mac.command, Windows: run-win.bat).

How to run the dev server:
1) Unzip.
2) macOS: double-click run-mac.command
   Windows: double-click run-win.bat
3) If a browser doesn't open automatically, go to http://localhost:5173

How to drop in your full engine:
1) Open src/engine/full/index.ts
2) Scroll to the marker:  // ==== PASTE YOUR FULL ENGINE BELOW ====
3) Paste your engine code there.
4) Make sure you export (at minimum):
   - enum FightingStyle
   - type WarriorMeta, MinutePlan, MinuteEvent, FightOutcome
   - function defaultPlanForWarrior(w: WarriorMeta): MinutePlan
   - function simulateFight(planA: MinutePlan, planD: MinutePlan): FightOutcome
5) Save the file. The UI will use your full engine automatically.
   (By default, index.ts re-exports from full/index.ts, which currently proxies to the stub.)

Building a production zip of the site:
• macOS/WSL/Linux: run `bash pack-01.sh` at the project root. It creates duelmasters-build.zip.

Need help? You can zip your engine file and share it; I’ll bake it into a ready-to-run bundle for you.
```

---

## 13. Duelmasters Scaffold
<a id="doc-13-duelmasters-scaffold"></a>

**Source path:** `_extract/Duelmasters-Scaffold-EngineSlot-v0.6.1/Duelmasters-Scaffold-EngineSlot-v0.6.1/index.html`  
**SHA-256:** `cac3103dd91cfaa9ccce412cd4dd2bfcb1d3fb52f2228e2a6a4f04590fb8346a`

### Contents (verbatim)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Duelmasters Scaffold</title>
  </head>
  <body class="bg-ink text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 14. Duelmasters Starter
<a id="doc-14-duelmasters-starter"></a>

**Source path:** `_extract/Duelmasters-Starter-v0.6.0/Duelmasters-Starter-v0.6.0/index.html`  
**SHA-256:** `a8a23de53d37270d86566fe380a07784aac001148d3ce924d71827d79535bab9`

### Contents (verbatim)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Duelmasters Starter</title>
  </head>
  <body class="bg-ink text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 15. Tournament Save Hooks
<a id="doc-15-tournament-save-hooks"></a>

**Source path:** `_extract/Duelmasters-v1.0.0-Tournaments-Overlay/src/state/save.patches.md`  
**SHA-256:** `42427eafddcc0397194cea53c866eddf7a3ad6d790d724e95736e75b3230733a`

### Contents (verbatim)

# Tournament Save Hooks

Add new fields for tournament state and medals.

---

## 16. PATCH_NOTES.md
<a id="doc-16-patch-notes-md"></a>

**Source path:** `_extract/StableLords-delta-v1.6.1/PATCH_NOTES.md`  
**SHA-256:** `a35ea9a80019cecd473363790c9a458d2753dd9f4a7bf521600f40f7408df03d`

### Contents (verbatim)

### v1.6.1 Delta – What changed

- **New** `src/engine/fightSim.ts`: Minimal bout simulator returning winner/loser/kill/log.
- **New** `src/state/eventBus.ts`: Lightweight publish/subscribe game event bus.
- **New** `src/util/seed.ts`: Local random name/style/stats (no external deps).
- **Updated** `app/arena/page.tsx`: Uses `simulateBout` and records results in the store.
- **New** `app/analytics/page.tsx`: Inline SVG charts for roster ST/CN/WT/WL stats distribution.
- **Updated** `src/components/Nav.tsx`: Adds Analytics tab.
- **Note**: To integrate, you do not have to remove anything. These files are additive and safe.

---

## 17. Duelmasters — Sprint 4 Delta (v1.1.0 → v1.2.0)
<a id="doc-17-duelmasters-sprint-4-delta-v1-1-0-v1-2-0"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/CHANGELOG.md`  
**SHA-256:** `3e167150066b35c374b6c8700de5260397d93a1a56ef7649480912b13ca660ae`

### Contents (verbatim)

# Duelmasters — Sprint 4 Delta (v1.1.0 → v1.2.0)
Date: 2025-10-11T15:20:57.912676Z

## Added
- Hall of Owners page (ranking by Fame / Renown / Titles)
- Reputation chips (Fame/Renown) and Owner personality badges
- Commentator AI hooks for KO/Kill/Flashy/Upset
- Expanded newsletter recap strings with variety
- Router entry for `/owners` and nav link in App shell
- Overlay scripts to apply this delta quickly

## Install
1. Unzip this archive into your project root (same folder as package.json).
2. Let it merge/overwrite files when prompted.
3. Install new UI dep: `bun add @radix-ui/react-badge`
4. Start dev server: `bun run dev`

---

## 18. Feature Integration Matrix (v1.4.4 merge)
<a id="doc-18-feature-integration-matrix-v1-4-4-merge"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/FeatureIntegrationMatrix.md`  
**SHA-256:** `eda29783a16107fe64a9333e211cdfe1a9d1e5a6035b3bf93730f6f85ef42be2`

### Contents (verbatim)

# Feature Integration Matrix (v1.4.4 merge)

| ID | Feature | Extends (existing modules) | Creates (new modules) |
|---:|---|---|---|
| 1 | Warrior Builder UX polish + validation (Stable Lords) | state, ui | utils |
| 3 | Arena Scheduling & Challenge/Avoid Assistant | state, ui | utils |
| 4 | Combat Log Enhancements (critical cues, vitals intent markers) | state, ui | utils |
| 5 | Favorite Weapon Charting Toolkit | ui | utils |
| 6 | Style Archives Browser (10 warrior types) | ui | content |
| 7 | Design Bible In-App Reader + TOC | ui | content, utils |
| 8 | Training Planner (Trainability & Burns Advisor) | ui | utils |
| 9 | Physicals Simulator (endurance/damage/take) | state, ui | utils |
| 10 | Equipment Optimizer (weapons/armor by style) | ui | content, utils |
| 11 | Strategy Editor (OE/AL/KD by minute) | state, ui | — |
| 15 | Kill Analytics (Mechanics of Death visualizer) | state, ui | utils |
| 23 | Tournament Prep Mode (class calc, FE freeze checks) | state, ui | utils |
| 25 | House Rules / Mods Loader (optional) | state, ui | utils |
| 27 | Import/Export Manager (JSON/YAML packs) | — | utils |
| 29 | Telemetry & Error Log Panel | ui | utils |
| 31 | Theme/Accessibility Pack (high-contrast, text size) | state, ui | — |
| 33 | Onboarding Quests & Tips (non-blocking coach) | ui | content |
| 34 | Design Bible Search (local) | state, ui | content, utils |
| 36 | Content Updater (Archives sync & indexing) | ui | content, utils |
| 38 | Save Slots & Profiles | state, ui | utils |
| 39 | Admin Tools (packager, manifest viewer) | ui | utils |

---

## 19. Patches applied by Sprint 4
<a id="doc-19-patches-applied-by-sprint-4"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/PATCHES.md`  
**SHA-256:** `f359f621932151a8f115339f14935776cce964a691ce0c932cd6dfd5d1cc8bbf`

### Contents (verbatim)

# Patches applied by Sprint 4
- Add Hall of Owners link in the main nav
- Register /owners route
- Render Fame/Renown chips where owner/stable cards are shown
- Use commentator and recap helpers in newsletter and post-fight UI

If your file structure differs, search for the comments:
  // SPRINT4: HALL_OF_OWNERS_LINK
  // SPRINT4: HALL_OF_OWNERS_ROUTE
  // SPRINT4: FAME_RENOWN_CHIPS
  // SPRINT4: COMMENTATOR_HOOK

---

## 20. README-5C.txt
<a id="doc-20-readme-5c-txt"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/README-5C.txt`  
**SHA-256:** `8ca94b32d24d694d858ea0a8b9709369ecb8bc7798e3cd6b8d2a9c199d442ca2`

### Contents (verbatim)

```text
Sprint 5C Delta

What you get
- Radix Toast provider (Toasts.tsx)
- Event bus (signals.ts)
- Fame/Popularity bump logic from outcome tags (fame.ts)
- Result chips (Responsiveness, Riposte, Flair)
- CharacterPage full page
- RosterTable with flair chip, fame/pop color scales and deep links
- Minimal RunRoundPanel wired to signals + toast

How to install
1) Unzip this into your existing project root (merges /src).
2) Ensure these deps exist:
   bun add @radix-ui/react-toast react-router-dom
3) Wrap your app with <DMToastProvider> once, near the root.
4) Use <RunRoundPanel simulate={...}/> and call it from your sim pass-through.
```

---

## 21. README-DELTA-5A.txt
<a id="doc-21-readme-delta-5a-txt"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/README-DELTA-5A.txt`  
**SHA-256:** `c215dce5e3e7fa484d33e6dbbab81ccfd87c565647df82689892a2b36b28dbd1`

### Contents (verbatim)

```text
Duelmasters — Sprint 5A (Tournament Depth & Lore) — DELTA

Target base: v1.2.0
New version after apply: v1.2.5

What's inside (additive):
• Hall of Fights page (persistent archive of Fight of the Week / Fight of the Tournament)
• Style Meter (10 weeks + per-tournament) — W/L/K% by style
• Newsletter recap & commentary polish hooks (crowd reactions, announcer blurbs, most popular style)
• Guard: no stablemate matchups in regular rounds
• Narrative toasts for fame/popularity (e.g., "The crowd roars — fame rises!")

How to apply:
1) Unzip over your project root (allow new files). This delta avoids overwriting common files.
2) Wire routes:
   - Import and add the HallOfFights route to your router: path "/hall-of-fights".
   - Import StyleMeterPanel and mount under your Tournament Recap tab (optional button "Style Meter").
3) Hook saves:
   - Call LoreArchive.signalFight(fightSummary) right after a fight result is committed.
   - Call StyleMeter.recordFight(outcome) per fight, and StyleMeter.flushWeek() after Run Round (if you batch per week).
4) Ensure toasts provider is mounted once in AppRoot: <ToastsProvider />.
5) Rebuild: bun run dev (or build).

Files added:
- src/lore/HallOfFights.tsx
- src/lore/LoreArchive.ts
- src/lore/AnnouncerAI.ts
- src/metrics/StyleMeter.ts
- src/ui/toast/Toasts.tsx
- src/ui/flair/FlairChips.tsx
- src/guards/matchmaking.ts
- src/types/lore.d.ts
- public/icons/trophy.svg, public/icons/flair-bolt.svg

Apply time: 2025-10-11T16:15:26.135873Z
```

---

## 22. README-DELTA-v1.4.2.txt
<a id="doc-22-readme-delta-v1-4-2-txt"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/README-DELTA-v1.4.2.txt`  
**SHA-256:** `326132d4c0e271f36e5b0684cacff770f7aca8d338d3fb54ed255a066960faab`

### Contents (verbatim)

```text
Stable Lords — Delta v1.4.2
=================================
This is a safe, additive update that does NOT require touching your app.jsx.
It adds:
  • A floating “Meta” button (bottom-left) — Arena Meta Snapshot modal.
  • A floating “Help” button — OE vs AL primer + class quick notes.
  • Seasonal flavor strings available on window.SL_FLAVOR for tournaments/newsletters.
  • Friendly toast on load.

Install (drop-in)
-----------------
1) Unzip this folder into your project root (same folder as index.html).
2) Overwrite when prompted (index.html gets a tiny version bump + script include).
3) Optional: run tools/patch-react-vite.command if you prefer to patch your existing index.html instead of overwriting.
4) Start:  bun run dev  (or open index.html directly if you’re using the quickstart)

Troubleshooting
---------------
• If you use a custom index.html, run the patcher:
    chmod +x tools/patch-react-vite.command
    ./tools/patch-react-vite.command

• The delta scripts are self-contained and won’t break your app if your save is empty.
  You’ll see demo counts only if your save already has some roster/history.
```

---

## 23. README-FIRST.txt
<a id="doc-23-readme-first-txt"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/README-FIRST.txt`  
**SHA-256:** `2e7af6205056ba1e48bfb86033767521c6be237c1b993b8476671cbce617e359`

### Contents (verbatim)

```text

Duelmasters Scaffold (Engine Drop-in) — v0.6.1

What this is:
• A ready-to-run React + Vite + TypeScript project with Tailwind and Radix.
• The UI is already wired to an engine "slot" so you can paste your full engine later.
• Double-click to run (mac: run-mac.command, Windows: run-win.bat).

How to run the dev server:
1) Unzip.
2) macOS: double-click run-mac.command
   Windows: double-click run-win.bat
3) If a browser doesn't open automatically, go to http://localhost:5173

How to drop in your full engine:
1) Open src/engine/full/index.ts
2) Scroll to the marker:  // ==== PASTE YOUR FULL ENGINE BELOW ====
3) Paste your engine code there.
4) Make sure you export (at minimum):
   - enum FightingStyle
   - type WarriorMeta, MinutePlan, MinuteEvent, FightOutcome
   - function defaultPlanForWarrior(w: WarriorMeta): MinutePlan
   - function simulateFight(planA: MinutePlan, planD: MinutePlan): FightOutcome
5) Save the file. The UI will use your full engine automatically.
   (By default, index.ts re-exports from full/index.ts, which currently proxies to the stub.)

Building a production zip of the site:
• macOS/WSL/Linux: run `bash pack-01.sh` at the project root. It creates duelmasters-build.zip.

Need help? You can zip your engine file and share it; I’ll bake it into a ready-to-run bundle for you.
```

---

## 24. README-MAC.txt
<a id="doc-24-readme-mac-txt"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/README-MAC.txt`  
**SHA-256:** `d539d57308ddd9660f0b2f25df8220686bdd55c0aeccfb920ae93c43835cd4ba`

### Contents (verbatim)

```text
Duelmasters — macOS Quickstart v1.4.0

What this is
============
A tiny, always-playable shell so you can click around *today*. It includes:
- A Dashboard with demo seed data
- Roster with champion badge and quick fighter sheets
- Run Round (mock fight) that writes a newsletter entry
- Tournaments placeholder (UI stub)
- Help sheet with key concepts

How to run (macOS)
==================
1) Double-click: Start Game.command
   - Starts a tiny local server and opens your browser.
2) Force Chrome: Start Game (Chrome).command
3) Wipe local save: Reset Save.command (or append ?reset=1 to the URL).

Pack philosophy
===============
- Boot guarantee: index.html opens and renders locally.
- Seeded demo: if saves are empty, we auto-seed a small stable.
- Safe UI: buttons have working stub flows—no dead ends.
- Feature flags: unfinished areas show "Coming soon" but never break nav.
```

---

## 25. README-delta-v1.4.3-el-fix.txt
<a id="doc-25-readme-delta-v1-4-3-el-fix-txt"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/README-delta-v1.4.3-el-fix.txt`  
**SHA-256:** `fe9c8bac34e4c889840ec26e33e2a62827fc7dce1ed53e820d03535320ce285f`

### Contents (verbatim)

```text
Stable Lords — Delta v1.4.3 (EL helper hotfix)
====================================================

What this fixes
- Clickable tournaments page/modal was throwing:
  "Failed to execute 'appendChild' on 'Node': parameter 1 is not of type 'Node'."
- Cause: the DOM helper `el()` tried to append strings/arrays directly via appendChild.

What this delta does
- Patches `delta/v1.4.3.js` in-place to replace `function el(...)` with a robust version
  that flattens arrays and converts strings to TextNodes.

How to apply (macOS):
1) Unzip this archive into your project folder (the one that has `index.html`).
   You should then have: ./tools/patch-el.command
2) In Terminal:
   cd /path/to/your/project
   chmod +x tools/patch-el.command
   ./tools/patch-el.command
3) Restart Vite (or just refresh the page if running).

Safety:
- The script makes a timestamped backup: delta/v1.4.3.js.bak.YYYYMMDDHHMMSS
- If anything fails, no changes are written.

Notes:
- If your project stores `v1.4.3.js` in a different folder, edit FILE= in the script.
- This delta does *not* change index.html. It only patches the existing file.

Enjoy!
```

---

## 26. README-delta-v1.4.3.txt
<a id="doc-26-readme-delta-v1-4-3-txt"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/README-delta-v1.4.3.txt`  
**SHA-256:** `3c0dff4037288100165fba97f11f4368d79f511e6180ffd7b73216c9ae0d0517`

### Contents (verbatim)

```text
Stable Lords — Delta v1.4.3
================================

What you get
------------
• Newsletter modal (“Stable Lords Ledger”) with recap + champion line + arena meta.
• Seasonal Tournament modal (Seed → Run Round → Champion).
• Seasonal flavor lines (Spring/Summer/Fall/Winter) exposed on window.SL_FLAVOR.
• Safe: no changes to your app code; pure DOM modals and localStorage.

Install
-------
1) Unzip into your project root (same folder as index.html).
2) Either:
   • Open index.html in a text editor and add:
       <script type="module" src="delta/v1.4.3.js"></script>
     before </body>
   • Or run the patcher:
       chmod +x tools/patch-newsletter-tourney.command
       ./tools/patch-newsletter-tourney.command

Use
---
• Click “Tournaments” in the top nav to open the modal.
• “Seed” will select 8–16 entrants (by wins + fame + popularity).
• “Run Round” advances the bracket; when a champion is crowned, a newsletter is published.
• Click “Newsletter” in the top nav to view/export the latest issue.

Notes
-----
• Reads your roster from localStorage key: sl.save (falls back to a demo roster).
• Tournament data is stored in: sl.tournament.current
• Newsletter latest issue is stored in: sl.newsletter.latest

Version: 2025-10-26T12:15:47.943026 / 2025-10-26 / v1.4.3
```

---

## 27. README-delta-v1.4.4.txt
<a id="doc-27-readme-delta-v1-4-4-txt"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/README-delta-v1.4.4.txt`  
**SHA-256:** `560757ea60d483aeb2e8d16f0d75a683cf55e12fdacfeb6d524b5ca03bcecf76`

### Contents (verbatim)

```text
Stable Lords — Delta v1.4.4
===========================

What’s inside
-------------
• delta/v1.4.4.js
  - Robust DOM builder (`el`) that accepts arrays, strings, nulls (fixes appendChild errors)
  - Restores "Run Round" and "Seed Demo" to the top nav with graceful fallbacks
  - Fixes the Tournaments view so cards are clickable without DOM errors
  - Updates the version chip to "Stable Lords v1.4.4" at runtime

• tools/patch-delta-v1.4.4.command
  - One-click injector: copies delta file and inserts the script tag into index.html

How to apply
------------
1) Unzip this delta into your project root (the same folder that contains index.html).
2) Run:
   chmod +x tools/patch-delta-v1.4.4.command
   ./tools/patch-delta-v1.4.4.command .

3) Open index.html (double-click) or run your dev server:
   bun run dev

4) Visual check:
   - The chip in the top bar should read: Stable Lords v1.4.4
   - "Run Round" and "Seed Demo" buttons are present and clickable.
   - Clicking "Tournaments" shows four seasonal cards; "Open"/"Seed" toast messages appear
     (or call your engine hooks if they're wired).

Notes
-----
• This delta does not remove any existing code. It loads as a module and adds/fixes UI behavior safely.
• If future deltas arrive, you'll see the chip update (e.g., Stable Lords v1.4.5) so you can confirm visually.
```

---

## 28. README.txt
<a id="doc-28-readme-txt"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/README.txt`  
**SHA-256:** `f26cbc45650bc1db85850de5920f8781576bd0243a0cbb79bb3c49e8961fbaea`

### Contents (verbatim)

```text
Stable Lords — Delta v1.4.1 (Branding + Seed + Always Playable)
Date: 2025-10-26T12:05:15.387525Z

Drop-in instructions:
1) Quit `bun run dev` if running.
2) Unzip these files into your project root (same folder as your existing index.html/app.jsx).
3) Overwrite when prompted.
4) Run: bun run dev  → open http://localhost:5173

What’s inside:
- index.html  → Title/branding set to Stable Lords v1.4.1.
- app.jsx      → Seeds a demo save if none exists; safe UI for Dashboard/Roster/Run Round/Tournaments/Help; tiny toast helper.

Notes:
- No build config changes needed.
- If you prefer, you can change the version chip text inside index.html.
```

---

## 29. Stable Lords — Quickstart v1.4.2
<a id="doc-29-stable-lords-quickstart-v1-4-2"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/index.html`  
**SHA-256:** `87d6d5279f523f2ad637b38f2561dceb03215c303ab2fdcbc68d71e16aa76a50`

### Contents (verbatim)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Stable Lords — Quickstart v1.4.2</title>
  <link rel="icon" href="assets/icon.png">
  <style>
    :root{--bg:#0b0f15;--panel:#121826;--border:#1f2a3a;--text:#e6eefb;--muted:#9db0cf;--accent:#60a5fa;--chip:#1f2937;--good:#16a34a;--warn:#f59e0b;--bad:#ef4444}
    *{box-sizing:border-box} html,body{height:100%} body{margin:0;background:linear-gradient(180deg,#0b0f15,#0e1522);color:var(--text);font:14px/1.45 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif}
    .container{max-width:1100px;margin:0 auto;padding:24px}
    .nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
    .btn{padding:10px 14px;border-radius:12px;background:var(--panel);border:1px solid var(--border);color:var(--text);cursor:pointer}
    .btn:hover{border-color:var(--accent)}
    .btn.secondary{background:transparent}
    .card{background:var(--panel);border:1px solid var(--border);border-radius:16px; padding:16px}
    .row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .h{display:flex;align-items:center;gap:10px}
    .chip{background:var(--chip);padding:4px 8px;border-radius:999px;border:1px solid var(--border);color:var(--muted);font-weight:600}
    .pill{padding:2px 8px;border-radius:999px;border:1px solid var(--border)}
    .title{font-size:20px;font-weight:700}
    .muted{color:var(--muted)}
    .grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}
    .col-4{grid-column:span 4} .col-8{grid-column:span 8} .col-6{grid-column:span 6}
    .hero{padding:20px;border-radius:16px;background:linear-gradient(135deg,#0f172a,#141c2e);border:1px solid var(--border);margin-bottom:16px}
    .list{display:flex;flex-direction:column;gap:8px}
    .rowb{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .link{color:var(--accent);text-decoration:none} .link:hover{text-decoration:underline}
    .tag{font-weight:700} .good{color:var(--good)} .warn{color:var(--warn)} .bad{color:var(--bad)}
    .footer{margin-top:24px;color:var(--muted);font-size:12px}
    .kbd{border:1px solid var(--border);border-bottom-width:2px;background:#0c1320;padding:0 6px;border-radius:6px}
    .toast{position:fixed;right:16px;bottom:16px;background:#0b1220;border:1px solid var(--border);padding:12px 14px;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.35);display:none;z-index:9999}
    .toast.show{display:block;animation:fade 0.25s ease-out}
    @keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .hidden{display:none}
    /* Delta v1.4.2 */
    .fab{position:fixed;bottom:16px;left:16px;display:flex;gap:8px;z-index:9998}
    .fab .btn{background:#0b1220}
    .modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:9999}
    .modal.show{display:flex}
    .modal .card{max-width:800px;width:92vw;max-height:80vh;overflow:auto}
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <button class="btn" data-nav="dashboard">Dashboard</button>
      <button class="btn" data-nav="roster">Roster</button>
      <button class="btn" data-nav="runround">Run Round</button>
      <button class="btn" data-nav="tournaments">Tournaments</button>
      <button class="btn secondary" data-nav="help">Help</button>
      <span class="chip">Stable Lords v1.4.2</span>
    </div>

    <div id="app"></div>
    <div id="toast" class="toast"></div>

    <div class="footer">
      <div>Tip: press <span class="kbd">⌘</span> + click a fighter to open their sheet in a new tab.</div>
      <div>Local save only. Use <span class="kbd">Reset Save.command</span> to wipe quickly.</div>
    </div>
  </div>

  <!-- Your existing app entry -->
  <script type="module" src="app.jsx"></script>
  <!-- Safe additive delta plugin -->
  <script type="module" src="delta/v1.4.2.js"></script>
</body>
</html>
```

---

## 30. Tournament Save Hooks
<a id="doc-30-tournament-save-hooks"></a>

**Source path:** `_extract/StableLords-merged-v1.4.4/src/state/save.patches.md`  
**SHA-256:** `42427eafddcc0397194cea53c866eddf7a3ad6d790d724e95736e75b3230733a`

### Contents (verbatim)

# Tournament Save Hooks

Add new fields for tournament state and medals.

---

## 31. Stable Lords • Starter v1.5.0
<a id="doc-31-stable-lords-starter-v1-5-0"></a>

**Source path:** `_extract/StableLords-starter-v1.5.0/README.md`  
**SHA-256:** `0bd64798eabb495731478af91b9be1e3749a277bfdc838fe72277e8eae27b1ee`

### Contents (verbatim)

# Stable Lords • Starter v1.5.0

This is a Next.js + TypeScript starter that wires your provided **src** content into an `app/` router with Tailwind, Zustand, Immer, Chart.js, Chance, and InkJS.

## Structure
```
/src
  app/            # Next's app router (layout.tsx, page.tsx)
  components/     # UI components (from your archive)
  engine/         # core sim logic
  state/          # Zustand stores
  routes/         # panels & routes
  ui/             # primitives
  ... (rest from your archive)
```

## Getting started
1. Install: `bun install`
2. Dev: `bun run dev`
3. Build: `bun run build && bun run start`

> First run? If `src/app/AppRoot.tsx` expects specific globals, update `src/app/page.tsx` to the correct entry component.

## Notes
- Tailwind content paths already include your folders.
- Charts: `react-chartjs-2` + `chart.js` included.
- Narrative: `inkjs` runtime ready if you add compiled `.json` story assets to `src/lore/`.

Generated: 2025-10-27T11:43:55.452688Z

---

## 32. Tournament Save Hooks
<a id="doc-32-tournament-save-hooks"></a>

**Source path:** `_extract/StableLords-starter-v1.5.0/src/state/save.patches.md`  
**SHA-256:** `42427eafddcc0397194cea53c866eddf7a3ad6d790d724e95736e75b3230733a`

### Contents (verbatim)

# Tournament Save Hooks

Add new fields for tournament state and medals.

---

## 33. Duelmasters — Sprint 4 Delta (v1.1.0 → v1.2.0)
<a id="doc-33-duelmasters-sprint-4-delta-v1-1-0-v1-2-0"></a>

**Source path:** `_extract/StableLords-v1.6.0/CHANGELOG.md`  
**SHA-256:** `3e167150066b35c374b6c8700de5260397d93a1a56ef7649480912b13ca660ae`

### Contents (verbatim)

# Duelmasters — Sprint 4 Delta (v1.1.0 → v1.2.0)
Date: 2025-10-11T15:20:57.912676Z

## Added
- Hall of Owners page (ranking by Fame / Renown / Titles)
- Reputation chips (Fame/Renown) and Owner personality badges
- Commentator AI hooks for KO/Kill/Flashy/Upset
- Expanded newsletter recap strings with variety
- Router entry for `/owners` and nav link in App shell
- Overlay scripts to apply this delta quickly

## Install
1. Unzip this archive into your project root (same folder as package.json).
2. Let it merge/overwrite files when prompted.
3. Install new UI dep: `bun add @radix-ui/react-badge`
4. Start dev server: `bun run dev`

---

## 34. Feature Integration Matrix (v1.4.4 merge)
<a id="doc-34-feature-integration-matrix-v1-4-4-merge"></a>

**Source path:** `_extract/StableLords-v1.6.0/FeatureIntegrationMatrix.md`  
**SHA-256:** `eda29783a16107fe64a9333e211cdfe1a9d1e5a6035b3bf93730f6f85ef42be2`

### Contents (verbatim)

# Feature Integration Matrix (v1.4.4 merge)

| ID | Feature | Extends (existing modules) | Creates (new modules) |
|---:|---|---|---|
| 1 | Warrior Builder UX polish + validation (Stable Lords) | state, ui | utils |
| 3 | Arena Scheduling & Challenge/Avoid Assistant | state, ui | utils |
| 4 | Combat Log Enhancements (critical cues, vitals intent markers) | state, ui | utils |
| 5 | Favorite Weapon Charting Toolkit | ui | utils |
| 6 | Style Archives Browser (10 warrior types) | ui | content |
| 7 | Design Bible In-App Reader + TOC | ui | content, utils |
| 8 | Training Planner (Trainability & Burns Advisor) | ui | utils |
| 9 | Physicals Simulator (endurance/damage/take) | state, ui | utils |
| 10 | Equipment Optimizer (weapons/armor by style) | ui | content, utils |
| 11 | Strategy Editor (OE/AL/KD by minute) | state, ui | — |
| 15 | Kill Analytics (Mechanics of Death visualizer) | state, ui | utils |
| 23 | Tournament Prep Mode (class calc, FE freeze checks) | state, ui | utils |
| 25 | House Rules / Mods Loader (optional) | state, ui | utils |
| 27 | Import/Export Manager (JSON/YAML packs) | — | utils |
| 29 | Telemetry & Error Log Panel | ui | utils |
| 31 | Theme/Accessibility Pack (high-contrast, text size) | state, ui | — |
| 33 | Onboarding Quests & Tips (non-blocking coach) | ui | content |
| 34 | Design Bible Search (local) | state, ui | content, utils |
| 36 | Content Updater (Archives sync & indexing) | ui | content, utils |
| 38 | Save Slots & Profiles | state, ui | utils |
| 39 | Admin Tools (packager, manifest viewer) | ui | utils |

---

## 35. Patches applied by Sprint 4
<a id="doc-35-patches-applied-by-sprint-4"></a>

**Source path:** `_extract/StableLords-v1.6.0/PATCHES.md`  
**SHA-256:** `f359f621932151a8f115339f14935776cce964a691ce0c932cd6dfd5d1cc8bbf`

### Contents (verbatim)

# Patches applied by Sprint 4
- Add Hall of Owners link in the main nav
- Register /owners route
- Render Fame/Renown chips where owner/stable cards are shown
- Use commentator and recap helpers in newsletter and post-fight UI

If your file structure differs, search for the comments:
  // SPRINT4: HALL_OF_OWNERS_LINK
  // SPRINT4: HALL_OF_OWNERS_ROUTE
  // SPRINT4: FAME_RENOWN_CHIPS
  // SPRINT4: COMMENTATOR_HOOK

---

## 36. README-5C.txt
<a id="doc-36-readme-5c-txt"></a>

**Source path:** `_extract/StableLords-v1.6.0/README-5C.txt`  
**SHA-256:** `8ca94b32d24d694d858ea0a8b9709369ecb8bc7798e3cd6b8d2a9c199d442ca2`

### Contents (verbatim)

```text
Sprint 5C Delta

What you get
- Radix Toast provider (Toasts.tsx)
- Event bus (signals.ts)
- Fame/Popularity bump logic from outcome tags (fame.ts)
- Result chips (Responsiveness, Riposte, Flair)
- CharacterPage full page
- RosterTable with flair chip, fame/pop color scales and deep links
- Minimal RunRoundPanel wired to signals + toast

How to install
1) Unzip this into your existing project root (merges /src).
2) Ensure these deps exist:
   bun add @radix-ui/react-toast react-router-dom
3) Wrap your app with <DMToastProvider> once, near the root.
4) Use <RunRoundPanel simulate={...}/> and call it from your sim pass-through.
```

---

## 37. README-DELTA-5A.txt
<a id="doc-37-readme-delta-5a-txt"></a>

**Source path:** `_extract/StableLords-v1.6.0/README-DELTA-5A.txt`  
**SHA-256:** `c215dce5e3e7fa484d33e6dbbab81ccfd87c565647df82689892a2b36b28dbd1`

### Contents (verbatim)

```text
Duelmasters — Sprint 5A (Tournament Depth & Lore) — DELTA

Target base: v1.2.0
New version after apply: v1.2.5

What's inside (additive):
• Hall of Fights page (persistent archive of Fight of the Week / Fight of the Tournament)
• Style Meter (10 weeks + per-tournament) — W/L/K% by style
• Newsletter recap & commentary polish hooks (crowd reactions, announcer blurbs, most popular style)
• Guard: no stablemate matchups in regular rounds
• Narrative toasts for fame/popularity (e.g., "The crowd roars — fame rises!")

How to apply:
1) Unzip over your project root (allow new files). This delta avoids overwriting common files.
2) Wire routes:
   - Import and add the HallOfFights route to your router: path "/hall-of-fights".
   - Import StyleMeterPanel and mount under your Tournament Recap tab (optional button "Style Meter").
3) Hook saves:
   - Call LoreArchive.signalFight(fightSummary) right after a fight result is committed.
   - Call StyleMeter.recordFight(outcome) per fight, and StyleMeter.flushWeek() after Run Round (if you batch per week).
4) Ensure toasts provider is mounted once in AppRoot: <ToastsProvider />.
5) Rebuild: bun run dev (or build).

Files added:
- src/lore/HallOfFights.tsx
- src/lore/LoreArchive.ts
- src/lore/AnnouncerAI.ts
- src/metrics/StyleMeter.ts
- src/ui/toast/Toasts.tsx
- src/ui/flair/FlairChips.tsx
- src/guards/matchmaking.ts
- src/types/lore.d.ts
- public/icons/trophy.svg, public/icons/flair-bolt.svg

Apply time: 2025-10-11T16:15:26.135873Z
```

---

## 38. README-DELTA-v1.4.2.txt
<a id="doc-38-readme-delta-v1-4-2-txt"></a>

**Source path:** `_extract/StableLords-v1.6.0/README-DELTA-v1.4.2.txt`  
**SHA-256:** `326132d4c0e271f36e5b0684cacff770f7aca8d338d3fb54ed255a066960faab`

### Contents (verbatim)

```text
Stable Lords — Delta v1.4.2
=================================
This is a safe, additive update that does NOT require touching your app.jsx.
It adds:
  • A floating “Meta” button (bottom-left) — Arena Meta Snapshot modal.
  • A floating “Help” button — OE vs AL primer + class quick notes.
  • Seasonal flavor strings available on window.SL_FLAVOR for tournaments/newsletters.
  • Friendly toast on load.

Install (drop-in)
-----------------
1) Unzip this folder into your project root (same folder as index.html).
2) Overwrite when prompted (index.html gets a tiny version bump + script include).
3) Optional: run tools/patch-react-vite.command if you prefer to patch your existing index.html instead of overwriting.
4) Start:  bun run dev  (or open index.html directly if you’re using the quickstart)

Troubleshooting
---------------
• If you use a custom index.html, run the patcher:
    chmod +x tools/patch-react-vite.command
    ./tools/patch-react-vite.command

• The delta scripts are self-contained and won’t break your app if your save is empty.
  You’ll see demo counts only if your save already has some roster/history.
```

---

## 39. README-FIRST.txt
<a id="doc-39-readme-first-txt"></a>

**Source path:** `_extract/StableLords-v1.6.0/README-FIRST.txt`  
**SHA-256:** `2e7af6205056ba1e48bfb86033767521c6be237c1b993b8476671cbce617e359`

### Contents (verbatim)

```text

Duelmasters Scaffold (Engine Drop-in) — v0.6.1

What this is:
• A ready-to-run React + Vite + TypeScript project with Tailwind and Radix.
• The UI is already wired to an engine "slot" so you can paste your full engine later.
• Double-click to run (mac: run-mac.command, Windows: run-win.bat).

How to run the dev server:
1) Unzip.
2) macOS: double-click run-mac.command
   Windows: double-click run-win.bat
3) If a browser doesn't open automatically, go to http://localhost:5173

How to drop in your full engine:
1) Open src/engine/full/index.ts
2) Scroll to the marker:  // ==== PASTE YOUR FULL ENGINE BELOW ====
3) Paste your engine code there.
4) Make sure you export (at minimum):
   - enum FightingStyle
   - type WarriorMeta, MinutePlan, MinuteEvent, FightOutcome
   - function defaultPlanForWarrior(w: WarriorMeta): MinutePlan
   - function simulateFight(planA: MinutePlan, planD: MinutePlan): FightOutcome
5) Save the file. The UI will use your full engine automatically.
   (By default, index.ts re-exports from full/index.ts, which currently proxies to the stub.)

Building a production zip of the site:
• macOS/WSL/Linux: run `bash pack-01.sh` at the project root. It creates duelmasters-build.zip.

Need help? You can zip your engine file and share it; I’ll bake it into a ready-to-run bundle for you.
```

---

## 40. README-MAC.txt
<a id="doc-40-readme-mac-txt"></a>

**Source path:** `_extract/StableLords-v1.6.0/README-MAC.txt`  
**SHA-256:** `d539d57308ddd9660f0b2f25df8220686bdd55c0aeccfb920ae93c43835cd4ba`

### Contents (verbatim)

```text
Duelmasters — macOS Quickstart v1.4.0

What this is
============
A tiny, always-playable shell so you can click around *today*. It includes:
- A Dashboard with demo seed data
- Roster with champion badge and quick fighter sheets
- Run Round (mock fight) that writes a newsletter entry
- Tournaments placeholder (UI stub)
- Help sheet with key concepts

How to run (macOS)
==================
1) Double-click: Start Game.command
   - Starts a tiny local server and opens your browser.
2) Force Chrome: Start Game (Chrome).command
3) Wipe local save: Reset Save.command (or append ?reset=1 to the URL).

Pack philosophy
===============
- Boot guarantee: index.html opens and renders locally.
- Seeded demo: if saves are empty, we auto-seed a small stable.
- Safe UI: buttons have working stub flows—no dead ends.
- Feature flags: unfinished areas show "Coming soon" but never break nav.
```

---

## 41. README-delta-v1.4.3-el-fix.txt
<a id="doc-41-readme-delta-v1-4-3-el-fix-txt"></a>

**Source path:** `_extract/StableLords-v1.6.0/README-delta-v1.4.3-el-fix.txt`  
**SHA-256:** `fe9c8bac34e4c889840ec26e33e2a62827fc7dce1ed53e820d03535320ce285f`

### Contents (verbatim)

```text
Stable Lords — Delta v1.4.3 (EL helper hotfix)
====================================================

What this fixes
- Clickable tournaments page/modal was throwing:
  "Failed to execute 'appendChild' on 'Node': parameter 1 is not of type 'Node'."
- Cause: the DOM helper `el()` tried to append strings/arrays directly via appendChild.

What this delta does
- Patches `delta/v1.4.3.js` in-place to replace `function el(...)` with a robust version
  that flattens arrays and converts strings to TextNodes.

How to apply (macOS):
1) Unzip this archive into your project folder (the one that has `index.html`).
   You should then have: ./tools/patch-el.command
2) In Terminal:
   cd /path/to/your/project
   chmod +x tools/patch-el.command
   ./tools/patch-el.command
3) Restart Vite (or just refresh the page if running).

Safety:
- The script makes a timestamped backup: delta/v1.4.3.js.bak.YYYYMMDDHHMMSS
- If anything fails, no changes are written.

Notes:
- If your project stores `v1.4.3.js` in a different folder, edit FILE= in the script.
- This delta does *not* change index.html. It only patches the existing file.

Enjoy!
```

---

## 42. README-delta-v1.4.3.txt
<a id="doc-42-readme-delta-v1-4-3-txt"></a>

**Source path:** `_extract/StableLords-v1.6.0/README-delta-v1.4.3.txt`  
**SHA-256:** `3c0dff4037288100165fba97f11f4368d79f511e6180ffd7b73216c9ae0d0517`

### Contents (verbatim)

```text
Stable Lords — Delta v1.4.3
================================

What you get
------------
• Newsletter modal (“Stable Lords Ledger”) with recap + champion line + arena meta.
• Seasonal Tournament modal (Seed → Run Round → Champion).
• Seasonal flavor lines (Spring/Summer/Fall/Winter) exposed on window.SL_FLAVOR.
• Safe: no changes to your app code; pure DOM modals and localStorage.

Install
-------
1) Unzip into your project root (same folder as index.html).
2) Either:
   • Open index.html in a text editor and add:
       <script type="module" src="delta/v1.4.3.js"></script>
     before </body>
   • Or run the patcher:
       chmod +x tools/patch-newsletter-tourney.command
       ./tools/patch-newsletter-tourney.command

Use
---
• Click “Tournaments” in the top nav to open the modal.
• “Seed” will select 8–16 entrants (by wins + fame + popularity).
• “Run Round” advances the bracket; when a champion is crowned, a newsletter is published.
• Click “Newsletter” in the top nav to view/export the latest issue.

Notes
-----
• Reads your roster from localStorage key: sl.save (falls back to a demo roster).
• Tournament data is stored in: sl.tournament.current
• Newsletter latest issue is stored in: sl.newsletter.latest

Version: 2025-10-26T12:15:47.943026 / 2025-10-26 / v1.4.3
```

---

## 43. README-delta-v1.4.4.txt
<a id="doc-43-readme-delta-v1-4-4-txt"></a>

**Source path:** `_extract/StableLords-v1.6.0/README-delta-v1.4.4.txt`  
**SHA-256:** `560757ea60d483aeb2e8d16f0d75a683cf55e12fdacfeb6d524b5ca03bcecf76`

### Contents (verbatim)

```text
Stable Lords — Delta v1.4.4
===========================

What’s inside
-------------
• delta/v1.4.4.js
  - Robust DOM builder (`el`) that accepts arrays, strings, nulls (fixes appendChild errors)
  - Restores "Run Round" and "Seed Demo" to the top nav with graceful fallbacks
  - Fixes the Tournaments view so cards are clickable without DOM errors
  - Updates the version chip to "Stable Lords v1.4.4" at runtime

• tools/patch-delta-v1.4.4.command
  - One-click injector: copies delta file and inserts the script tag into index.html

How to apply
------------
1) Unzip this delta into your project root (the same folder that contains index.html).
2) Run:
   chmod +x tools/patch-delta-v1.4.4.command
   ./tools/patch-delta-v1.4.4.command .

3) Open index.html (double-click) or run your dev server:
   bun run dev

4) Visual check:
   - The chip in the top bar should read: Stable Lords v1.4.4
   - "Run Round" and "Seed Demo" buttons are present and clickable.
   - Clicking "Tournaments" shows four seasonal cards; "Open"/"Seed" toast messages appear
     (or call your engine hooks if they're wired).

Notes
-----
• This delta does not remove any existing code. It loads as a module and adds/fixes UI behavior safely.
• If future deltas arrive, you'll see the chip update (e.g., Stable Lords v1.4.5) so you can confirm visually.
```

---

## 44. Stable Lords • Starter v1.5.0
<a id="doc-44-stable-lords-starter-v1-5-0"></a>

**Source path:** `_extract/StableLords-v1.6.0/README.md`  
**SHA-256:** `0bd64798eabb495731478af91b9be1e3749a277bfdc838fe72277e8eae27b1ee`

### Contents (verbatim)

# Stable Lords • Starter v1.5.0

This is a Next.js + TypeScript starter that wires your provided **src** content into an `app/` router with Tailwind, Zustand, Immer, Chart.js, Chance, and InkJS.

## Structure
```
/src
  app/            # Next's app router (layout.tsx, page.tsx)
  components/     # UI components (from your archive)
  engine/         # core sim logic
  state/          # Zustand stores
  routes/         # panels & routes
  ui/             # primitives
  ... (rest from your archive)
```

## Getting started
1. Install: `bun install`
2. Dev: `bun run dev`
3. Build: `bun run build && bun run start`

> First run? If `src/app/AppRoot.tsx` expects specific globals, update `src/app/page.tsx` to the correct entry component.

## Notes
- Tailwind content paths already include your folders.
- Charts: `react-chartjs-2` + `chart.js` included.
- Narrative: `inkjs` runtime ready if you add compiled `.json` story assets to `src/lore/`.

Generated: 2025-10-27T11:43:55.452688Z

---

## 45. README.txt
<a id="doc-45-readme-txt"></a>

**Source path:** `_extract/StableLords-v1.6.0/README.txt`  
**SHA-256:** `f26cbc45650bc1db85850de5920f8781576bd0243a0cbb79bb3c49e8961fbaea`

### Contents (verbatim)

```text
Stable Lords — Delta v1.4.1 (Branding + Seed + Always Playable)
Date: 2025-10-26T12:05:15.387525Z

Drop-in instructions:
1) Quit `bun run dev` if running.
2) Unzip these files into your project root (same folder as your existing index.html/app.jsx).
3) Overwrite when prompted.
4) Run: bun run dev  → open http://localhost:5173

What’s inside:
- index.html  → Title/branding set to Stable Lords v1.4.1.
- app.jsx      → Seeds a demo save if none exists; safe UI for Dashboard/Roster/Run Round/Tournaments/Help; tiny toast helper.

Notes:
- No build config changes needed.
- If you prefer, you can change the version chip text inside index.html.
```

---

## 46. StableLords Design Bible (Reference Drop-in)
<a id="doc-46-stablelords-design-bible-reference-drop-in"></a>

**Source path:** `_extract/StableLords-v1.6.0/docs/design-bible.md`  
**SHA-256:** `c510d7261f485a2cd1c9d44068890dbf920fc910d68bacd5b1dee1f624295bb8`

### Contents (verbatim)

# StableLords Design Bible (Reference Drop-in)

This file aggregates the in-world design articles and build notes you've provided.
- Striker / Total Parry / Wall of Steel archives
- Favorite Weapons charting
- How to Build a Better Warrior
- Stable Lords FAQ & Glossary, advice essays, haiku
- Mechanics of Death
- Feature Integration Matrix & Sprint Plan (see `/docs/roadmap`)

> Source of truth remains your shared docs; this is a working copy for dev reference.

---

## 47. Feature Integration Matrix
<a id="doc-47-feature-integration-matrix"></a>

**Source path:** `_extract/StableLords-v1.6.0/docs/roadmap/FEATURE_INTEGRATION_MATRIX.md`  
**SHA-256:** `4aa3290ad2d9238906363d898381d39b6d2eaea0254a9302d8d4e71a7c450dd7`

### Contents (verbatim)

# Feature Integration Matrix

(Generated placeholder; see conversation for the latest mapping.)

---

## 48. Stable Lords — Quickstart v1.4.2
<a id="doc-48-stable-lords-quickstart-v1-4-2"></a>

**Source path:** `_extract/StableLords-v1.6.0/index.html`  
**SHA-256:** `87d6d5279f523f2ad637b38f2561dceb03215c303ab2fdcbc68d71e16aa76a50`

### Contents (verbatim)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Stable Lords — Quickstart v1.4.2</title>
  <link rel="icon" href="assets/icon.png">
  <style>
    :root{--bg:#0b0f15;--panel:#121826;--border:#1f2a3a;--text:#e6eefb;--muted:#9db0cf;--accent:#60a5fa;--chip:#1f2937;--good:#16a34a;--warn:#f59e0b;--bad:#ef4444}
    *{box-sizing:border-box} html,body{height:100%} body{margin:0;background:linear-gradient(180deg,#0b0f15,#0e1522);color:var(--text);font:14px/1.45 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif}
    .container{max-width:1100px;margin:0 auto;padding:24px}
    .nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
    .btn{padding:10px 14px;border-radius:12px;background:var(--panel);border:1px solid var(--border);color:var(--text);cursor:pointer}
    .btn:hover{border-color:var(--accent)}
    .btn.secondary{background:transparent}
    .card{background:var(--panel);border:1px solid var(--border);border-radius:16px; padding:16px}
    .row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .h{display:flex;align-items:center;gap:10px}
    .chip{background:var(--chip);padding:4px 8px;border-radius:999px;border:1px solid var(--border);color:var(--muted);font-weight:600}
    .pill{padding:2px 8px;border-radius:999px;border:1px solid var(--border)}
    .title{font-size:20px;font-weight:700}
    .muted{color:var(--muted)}
    .grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}
    .col-4{grid-column:span 4} .col-8{grid-column:span 8} .col-6{grid-column:span 6}
    .hero{padding:20px;border-radius:16px;background:linear-gradient(135deg,#0f172a,#141c2e);border:1px solid var(--border);margin-bottom:16px}
    .list{display:flex;flex-direction:column;gap:8px}
    .rowb{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .link{color:var(--accent);text-decoration:none} .link:hover{text-decoration:underline}
    .tag{font-weight:700} .good{color:var(--good)} .warn{color:var(--warn)} .bad{color:var(--bad)}
    .footer{margin-top:24px;color:var(--muted);font-size:12px}
    .kbd{border:1px solid var(--border);border-bottom-width:2px;background:#0c1320;padding:0 6px;border-radius:6px}
    .toast{position:fixed;right:16px;bottom:16px;background:#0b1220;border:1px solid var(--border);padding:12px 14px;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.35);display:none;z-index:9999}
    .toast.show{display:block;animation:fade 0.25s ease-out}
    @keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .hidden{display:none}
    /* Delta v1.4.2 */
    .fab{position:fixed;bottom:16px;left:16px;display:flex;gap:8px;z-index:9998}
    .fab .btn{background:#0b1220}
    .modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:9999}
    .modal.show{display:flex}
    .modal .card{max-width:800px;width:92vw;max-height:80vh;overflow:auto}
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <button class="btn" data-nav="dashboard">Dashboard</button>
      <button class="btn" data-nav="roster">Roster</button>
      <button class="btn" data-nav="runround">Run Round</button>
      <button class="btn" data-nav="tournaments">Tournaments</button>
      <button class="btn secondary" data-nav="help">Help</button>
      <span class="chip">Stable Lords v1.4.2</span>
    </div>

    <div id="app"></div>
    <div id="toast" class="toast"></div>

    <div class="footer">
      <div>Tip: press <span class="kbd">⌘</span> + click a fighter to open their sheet in a new tab.</div>
      <div>Local save only. Use <span class="kbd">Reset Save.command</span> to wipe quickly.</div>
    </div>
  </div>

  <!-- Your existing app entry -->
  <script type="module" src="app.jsx"></script>
  <!-- Safe additive delta plugin -->
  <script type="module" src="delta/v1.4.2.js"></script>
</body>
</html>
```

---

## 49. Procedural Generation Scripts
<a id="doc-49-procedural-generation-scripts"></a>

**Source path:** `_extract/StableLords-v1.6.0/scripts/python/README.md`  
**SHA-256:** `620ff50de9b24bb21097927e1c0eea0ef1857c7e4a25d8380e330cdf3794788e`

### Contents (verbatim)

# Procedural Generation Scripts

Quick CLI for generating seed data without running the app.

```bash
cd scripts/python
python3 procedural_generation.py --count 20 --out warriors.json
```

Copy the output JSON into `src/data/warriors.seed.json` and the app will ingest it on first load (dev only).

---

## 50. Tournament Save Hooks
<a id="doc-50-tournament-save-hooks"></a>

**Source path:** `_extract/StableLords-v1.6.0/src/state/save.patches.md`  
**SHA-256:** `42427eafddcc0397194cea53c866eddf7a3ad6d790d724e95736e75b3230733a`

### Contents (verbatim)

# Tournament Save Hooks

Add new fields for tournament state and medals.

---

## 51. Duelmasters – Complete Source (RC)
<a id="doc-51-duelmasters-complete-source-rc"></a>

**Source path:** `_extract/duelmasters-complete-src/README.md`  
**SHA-256:** `e46cca8af3c614a4776b1beb4c7e57f334676a994c0f10c325852ef00dee80a1`

### Contents (verbatim)

# Duelmasters – Complete Source (RC)
Dev build of the Duelmasters project. Run:

```bash
bun install
bun run dev
```

Open http://localhost:5173

---

## 52. Duelmasters (Dev)
<a id="doc-52-duelmasters-dev"></a>

**Source path:** `_extract/duelmasters-complete-src/index.html`  
**SHA-256:** `5a7d244686cc48a813117bd530929ee4faf8288f942d439264295e6f839c4d18`

### Contents (verbatim)

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Duelmasters (Dev)</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 53. Duelmasters RC
<a id="doc-53-duelmasters-rc"></a>

**Source path:** `_extract/duelmasters-full-rc/index.html`  
**SHA-256:** `b7a26b58d93370d148c6806d0653554d9798eb6678e92a43cec492b8f1b4708f`

### Contents (verbatim)

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Duelmasters RC</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 54. Duelmasters RC
<a id="doc-54-duelmasters-rc"></a>

**Source path:** `_extract/duelmasters-gameui/index.html`  
**SHA-256:** `b7a26b58d93370d148c6806d0653554d9798eb6678e92a43cec492b8f1b4708f`

### Contents (verbatim)

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Duelmasters RC</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 55. Duelmasters RC5
<a id="doc-55-duelmasters-rc5"></a>

**Source path:** `_extract/duelmasters_fullsource_v0.9.1-rc5/index.html`  
**SHA-256:** `fc3651ce7fa491a44a6aa5e842980d2e3dbcdc1fae4331712cde653b5683a5a2`

### Contents (verbatim)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0b0f22" />
    <title>Duelmasters RC5</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 56. README-delta-1.6.6.txt
<a id="doc-56-readme-delta-1-6-6-txt"></a>

**Source path:** `_extract/stablelords-delta-1.6.6-ui/README/README-delta-1.6.6.txt`  
**SHA-256:** `8b917c37f17afc69d9dc3e088a43b4b278a5231f1772ff94cdc5797359e4cbde`

### Contents (verbatim)

```text

Delta 1.6.6 – UI cards for Orphanage, Trainer Market, and Leaderboards

What changed
- Added src/components/Card.tsx and Grid.tsx for quick, clean UI.
- Rewrote /orphanage, /trainers/market, and /leaderboards pages to render cards instead of raw JSON.

Apply
1) Copy the files in this ZIP over your project root (preserve paths).
2) No config changes required.
```

---

## 57. 1.6.6b URL Fix Delta
<a id="doc-57-1-6-6b-url-fix-delta"></a>

**Source path:** `_extract/stablelords-delta-1.6.6b-urlfix/PATCH_NOTES.md`  
**SHA-256:** `52d95d5fe426a3bb2135c5fdd744b198ba2e4d94c3bc5260969d9614dd29d66f`

### Contents (verbatim)

# 1.6.6b URL Fix Delta

- Added `src/lib/baseUrl.ts` to build an absolute base URL on the server.
- Updated server-rendered pages to use absolute URLs for fetch:
  - `app/orphanage/page.tsx`
  - `app/trainers/market/page.tsx`
  - `app/leaderboards/page.tsx`
- Pages are still `dynamic = 'force-dynamic'` to avoid caching while we wire real data.
- No client env needed in dev; falls back to `http://localhost:3000`. 
  For production behind a proxy, set `NEXT_PUBLIC_BASE_URL` to the external origin.

---

## 58. README-delta-v1.6.2b.txt
<a id="doc-58-readme-delta-v1-6-2b-txt"></a>

**Source path:** `_extract/stablelords-delta-v1.6.2b/README-delta-v1.6.2b.txt`  
**SHA-256:** `81620c2fd2a86bba14eae3056322fa710aacd4d60856eb17f3b04d570e827ce4`

### Contents (verbatim)

```text
Stable Lords — Delta v1.6.2b
============================

What's inside
-------------
• Gazette route & page
  - app/api/sim/week/route.ts  (POST → returns mock weekly recap)
  - app/gazette/page.tsx       (renders weekly recap)
  - src/modules/gazette/render.ts (tiny text renderer)

• Tailwind ESM fix
  - tailwind.config.mjs (ES module)
  - apply script removes tailwind.config.cjs/js if present

How to apply
------------
1) Unzip into your project (anywhere is fine).
2) Run:
   chmod +x tools/apply-delta-1.6.2b.command
   ./tools/apply-delta-1.6.2b.command

3) Restart Next.js:
   rm -rf .next node_modules/.cache 2>/dev/null || true
   bun run dev

4) Visit http://localhost:3000/gazette
   You should see the weekly recap.

Notes
-----
• This delta is non-destructive; original CJS Tailwind configs are backed up.
• The Gazette API returns mock data for now. We'll wire it to the real sim in 1.6.3.
```

---

## 59. Stable Lords — Design Bible (v1.6.3)
<a id="doc-59-stable-lords-design-bible-v1-6-3"></a>

**Source path:** `_extract/stablelords-delta-v1.6.3/docs/docs/DesignBible-v1.6.3.md`  
**SHA-256:** `55e63717a24c949a8fe270f3617a23a7d4b0ce2a2c53aa33e71ff4f2c0f9a816`

### Contents (verbatim)

# Stable Lords — Design Bible (v1.6.3)

**This is a delta note only.** Full Bible is in your repo already. This bump documents the newly added stubs:

## Added in v1.6.3 (stubs & scaffolds)
- **Leaderboards**: `/app/leaderboards` + API `/api/leaderboards/summary` (mock data).
- **Trainer Market**: `/app/trainers/market` + API `/api/trainers/market` (mock data). Mirrors the **Trainer Pool Ledger** shape.
- **Orphanage**: `/app/orphanage` + API `/api/orphanage` (mock warrior intake pool).
- **Season Recap API**: `/api/sim/season` to complement Gazette seasonal templates.
- **Schemas**: Type definitions under `src/modules/schemas/` (Trainer, Orphan, Leaderboard).
- **Nav Page**: `/nav` quick links to discover new routes.

All above are *non-destructive* stubs — safe to merge and iterate without breaking existing pages.

---

