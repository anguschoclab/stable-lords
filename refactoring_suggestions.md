# Refactoring Suggestions for Stable Lords Engine

The `src/engine/` directory contains several massive files that violate the single responsibility principle and make the codebase hard to navigate and maintain. Below are specific proposals for refactoring the largest offenders:

## 1. `src/engine/simulate.ts` (1112 lines)
This file handles the entire combat simulation loop, but also contains all the low-level math, RNG utilities, damage calculation, fatigue logic, and equipment modifiers.

**Proposal:** Extract utility and domain-specific logic into a new `src/engine/combat/` directory.
- `combatMath.ts`: Move generic RNG and math utilities like `mulberry32`, `skillCheck`, `contestCheck`, and `getPhase`.
- `combatDamage.ts`: Move damage calculation and hit location logic like `computeHitDamage`, `applyProtectMod`, `rollHitLocation`, `protectCovers`, and `HIT_LOCATIONS`.
- `combatFatigue.ts`: Move endurance and fatigue calculation like `enduranceCost`, `fatiguePenalty`.
- `combatMods.ts` (optional): Move tactic, equipment, and trainer modifier lookups if further reduction is needed.

**Benefit:** `simulate.ts` can focus exclusively on the core `simulateFight` orchestration loop and state management, reducing its size significantly.

## 2. `src/engine/ownerAI.ts` (867 lines)
This file handles AI stable management, including recruitment, firing, philosophy evolution, grudge processing, and even narrative text generation for the Gazette.

**Proposal:** Split into focused modules based on domain:
- `ownerRoster.ts`: Move `processAIRosterManagement`, `generateAIRecruit`, `pickRecruitStyle`, `generateRecruitAttrs`.
- `ownerPhilosophy.ts`: Move `evolvePhilosophies`, `pickMetaAlignedPhilosophy`, `pickCounterMetaPhilosophy`.
- `ownerNarrative.ts`: Move `generateOwnerNarratives` and related flavor text logic.
- `ownerGrudges.ts`: Move grudge scoring logic (if complex enough to warrant its own file).

**Benefit:** `ownerAI.ts` becomes a lean orchestrator for `processWeekBouts` rather than a catch-all for anything AI-related.

## 3. `src/engine/narrativePBP.ts` (796 lines)
This file generates play-by-play narrative text for bouts, but over half of the file consists of massive constant arrays of string templates (e.g., `ARMOR_INTRO_VERBS`, `PARRY_TEMPLATES`, `CROWD_REACTIONS`).

**Proposal:** Separate data from logic.
- `narrativeTemplates.ts`: Extract all constant string arrays and export them.
- `narrativePBP.ts`: Keep only the functions that utilize these templates (`narrateAttack`, `battleOpener`, etc.), importing the templates from the new file.

**Benefit:** Instantly cuts the file size in half and makes it much easier to read the actual logic without scrolling past hundreds of lines of string literals.
