# Stable Lords Architecture Audit Report

This report contains a comprehensive, read-only analysis of the Stable Lords codebase, focusing on modularity, separation of concerns, and optimization.

## Findings

### 1. Misplaced Logic & Tightly Coupled Code
* **UI Leaking Business Logic:** The most significant architectural issue is that presentation components in `src/pages/` are importing and executing headless engine functions directly. For example, `src/pages/Tournaments.tsx` imports `simulateFight` and runs the core tournament bracket simulation loops inside React, directly mutating the store state via `killWarrior`. Similar issues exist in `src/pages/Orphanage.tsx`.
  * **Why this is bad:** It tightly couples the simulation engine to the React UI, making headless testing impossible, and violates the separation of concerns. The UI should only dispatch intents (e.g., `doRunTournament()`) and render the results.

### 2. State Management Performance Anti-Patterns
* **Global Store Subscriptions:** Major pages, especially `src/pages/Dashboard.tsx`, are subscribing to the entire Zustand store by calling `const { state } = useGameStore();`.
  * **Why this is bad:** This means every single widget on the Dashboard will re-render whenever *any* unrelated property in the massive `GameState` object changes. As the game grows, this will cause significant lag and dropped frames. React components should use specific slice selectors (e.g., `useGameStore(s => s.state.roster)`).

### 3. Massive Monolithic Files (God Objects)
* **Bloated UI Pages:** `src/pages/Dashboard.tsx` is nearly 1,500 lines long and contains over a dozen inline widget components (`SeasonWidget`, `RankingsWidget`, `StableWidget`, etc.). `src/pages/WarriorDetail.tsx` is also ~900 lines long.
* **Bloated Engine Modules:** `src/engine/simulate.ts` is over 1,200 lines long. While some progress has been made extracting `src/engine/combat/`, it remains a massive catch-all. Similarly, `src/engine/ownerAI.ts` (868 lines) and `src/engine/boutProcessor.ts` (758 lines) are handling too many distinct domains.

### 4. Data vs. Logic Mixing
* **Narrative Strings:** Files like `src/engine/narrativePBP.ts` (700+ lines) and `src/engine/rivals.ts` (670+ lines) mix functional logic with massive constant arrays of string templates and configuration data. This buries the actual algorithms and makes the files hard to navigate.

---

## Recommended Action Plan (Ordered by Criticality)

1. **Fix Store Subscription Performance Issues (Critical)**
   * **Action:** Refactor all major UI pages (starting with `Dashboard.tsx`) to use strict Zustand selectors rather than subscribing to the root `state` object, preventing unnecessary re-renders.
2. **Decouple Core Simulation from the UI (Critical)**
   * **Action:** Move the simulation loop logic out of `Tournaments.tsx` and `Orphanage.tsx`. Create dedicated orchestrator files like `src/engine/tournamentProcessor.ts` that expose pure functions or Zustand actions. The UI must only dispatch the event and consume the result.
3. **Decompose Monolithic UI Components (High)**
   * **Action:** Create dedicated subdirectories (e.g., `src/components/dashboard/`) and extract all the inline widgets from `Dashboard.tsx` into their own separate, reusable files. Apply the same treatment to `WarriorDetail.tsx`.
4. **Continue Decomposing Engine "God Files" (High)**
   * **Action:** Break down `src/engine/simulate.ts` further by extracting phases (e.g., `simulateInit.ts`, `simulateResolution.ts`). Split `src/engine/ownerAI.ts` by moving grudge processing to an `ownerGrudges.ts` module.
5. **Separate Static Data from Engine Logic (Medium)**
   * **Action:** Extract the massive string template arrays from `narrativePBP.ts` and `rivals.ts` into pure data files in a new or existing data directory, keeping the engine files focused purely on execution logic.
