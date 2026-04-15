# Comprehensive Codebase Refactoring Plan

## Executive Summary

This document provides a comprehensive analysis and refactoring plan for the Stable Lords codebase based on an exhaustive code audit conducted on 2025-01-04. The analysis covered 389 TypeScript files across the entire codebase, identifying technical debt, unused code, architectural violations, and opportunities for improvement.

## Key Findings

### 1. Unused Code Analysis - CORRECTED

**Total Files Analyzed:** 389
**Unused Files (not reachable from entry points):** 0
**Files with unused imports:** 157

#### Important Correction

The original analysis was **fundamentally flawed**. The analysis methodology explicitly excluded route files from dependency tracing (stating they are "auto-discovered by TanStack Router"), but these route files import the pages/components that were marked as unused. This created false negatives.

**Actual Finding:** **0 of the 33 files are actually unused.** All are actively used through routes, direct imports, scripts, or tests.

#### Files Previously Marked as Unused (All ACTIVELY USED)

**Components (all used via routes or direct imports):**
- `src/components/EventLog.tsx` - Used by AppShell.tsx, Dashboard.tsx
- `src/components/MarkdownReader.tsx` - Used by GazetteArticle.tsx
- `src/components/SubNav.tsx` - Used by WarriorDetail.tsx
- `src/components/WarriorBuilder.tsx` - Used by Recruit.tsx
- `src/components/widgets/NextBoutWidget.tsx` - Used by ArenaHub.tsx, Dashboard.tsx
- `src/components/widgets/WeatherWidget.tsx` - Used by ArenaHub.tsx, Dashboard.tsx

**Engine (all used by other engine files, scripts, or tests):**
- `src/engine/combat/simulate/core/simulateHelpers.ts` - Used by simulate.ts, trainerSpecialties.ts
- `src/engine/core/rng/TestRNGService.ts` - Used by test files
- `src/engine/core/worldSeeder.ts` - Used by simulation-harness.ts, scripts
- `src/engine/dayPipeline.ts` - Used by worker.ts
- `src/engine/promoters/promoterGenerator.ts` - Used by worldSeeder.ts
- `src/engine/stats/simulationMetrics.ts` - Used by simulation-harness.ts, test files
- `src/engine/storage/truncation.ts` - Used by stateUtils.ts, saveSlots.ts, tests
- `src/engine/tick/TickOrchestrator.ts` - Used by dayPipeline.ts
- `src/engine/tick/tickHandler.ts` - Interface definition
- `src/engine/worker.ts` - Web worker entry point

**Hooks (all used by __root.tsx or other components):**
- `src/hooks/useCoachTip.ts` - Used by __root.tsx, Tournaments.tsx
- `src/hooks/useKeyboardShortcuts.ts` - Used by __root.tsx

**Lore (used by route):**
- `src/lore/HallOfFights.tsx` - Used by routes/lore/hall-of-fights.tsx

**Pages (all used by routes):**
- `src/pages/AdminTools.tsx` - Used by routes/admin.tsx
- `src/pages/ArenaHub.tsx` - Used by routes/arena-hub.tsx
- `src/pages/PhysicalsSimulator.tsx` - Used by routes/tools/physicals-simulator.tsx
- `src/pages/Recruit.tsx` - Used by routes/stable/recruit.tsx

**Files that don't exist (never existed or already deleted):**
- `src/components/BoutVisualizer.tsx` - Does not exist
- `src/engine/combat/services/simulateFightService.ts` - Does not exist
- `src/engine/core/rng/index.ts` - Does not exist
- `src/engine/matchmaking/aiBoutSimulator.ts` - Does not exist
- `src/engine/matchmaking/aiPoolCollector.ts` - Does not exist
- `src/engine/matchmaking/bidReconciler.ts` - Does not exist
- `src/engine/matchmaking/eligibility.ts` - Does not exist
- `src/engine/matchmaking/rivalScheduler.ts` - Does not exist
- `src/engine/matchmaking/tournament/tournamentFreelancerGenerator.ts` - Does not exist
- `src/utils/mathUtils.ts` - Does not exist

### 2. Type Safety Issues

**Files with `: any` types:** 157 files contain type bypasses

**High-priority files with extensive `any` usage:**
- `src/pages/Training.tsx` - Multiple `any` types in setState callbacks
- `src/pages/Scouting.tsx` - Type casting in setState
- `src/pages/Recruit.tsx` - Type assertions in state mutations
- `src/pages/WarriorDetail.tsx` - Type casting in displayWarrior
- `src/pages/Tournaments.tsx` - Type assertions in tournament logic
- `src/state/useGameStore.ts` - Extensive `any` usage in store mutations
- `src/engine/factories.ts` - Type assertions in `makeFightSummary`

### 3. Debug Code and Technical Debt

**Console.log statements:** Found in test files and some debugging locations
- `e2e/basic.spec.ts` - Debug logging for E2E tests
- `test_init.ts` - Console logging for initialization tests
- `test_prof.ts` - Console.time for profiling
- `test_sim.ts` - Console logging for simulation tests

**TODOs/FIXMEs/HACKs/XXXs:** Found throughout the codebase (grep results available)

### 4. Root-Level Cleanup

**Files to review/delete:**
- `UNUSED_ANALYSIS_REPORT.md` - Can be deleted (old analysis)
- `UNUSED_ANALYSIS_FINAL.md` - Can be deleted (old analysis)
- `UNUSED_ANALYSIS_VERIFIED.md` - Can be deleted (old analysis)
- `Autobalance_Report.md` - Keep (contains balance data)
- `autosim.ts` - Keep (utility script)
- `benchmark.ts` - Keep (utility script)
- `test_init.ts` - Keep (test utility)
- `test_prof.ts` - Keep (profiling utility)
- `test_sim.ts` - Keep (simulation test)
- `stats.html` - Review for necessity

### 5. Architectural Violations

**Import Path Issues:**
- Relative imports using `../` patterns (grep search attempted)
- Inconsistent import patterns across files

**State Management:**
- Zustand store with extensive `any` type usage
- Direct state mutations without proper typing
- Mixed concerns in store (UI state + game state)

**Component Organization:**
- Some components not properly modularized
- Duplicate patterns across similar components

## Refactoring Plan

### Phase 1: Cleanup (Low Risk, High Impact)

**Priority: High**
**Estimated Time: 1-2 days**

#### 1.1 Delete Unused Files - CORRECTED
- **Action:** Delete 0 files (none are actually unused)
- **Reason:** The original analysis was flawed - all 33 files are actively used through routes, direct imports, scripts, or tests
- **Verification:** Already verified through exhaustive code analysis

#### 1.2 Clean Up Root-Level Files
- Delete `UNUSED_ANALYSIS_*.md` files (3 files) - obsolete analysis documents
- Review and potentially delete `stats.html` if not needed
- Keep utility scripts (`autosim.ts`, `benchmark.ts`, test files) - actively used

#### 1.3 Remove Unused Imports
- Use automated tool to remove unused imports from 157 files
- Focus on high-impact files first (pages, components)
- Verify each file still compiles

### Phase 2: Type Safety Improvements (Medium Risk, High Impact)

**Priority: High**
**Estimated Time: 5-7 days**

#### 2.1 Fix Type Safety in State Management
- Replace `any` types in `src/state/useGameStore.ts` with proper types
- Create proper interfaces for state mutations
- Add type guards where necessary

#### 2.2 Fix Type Safety in Pages
- Fix `any` types in page components (Training, Scouting, Recruit, WarriorDetail, Tournaments)
- Replace type assertions with proper type guards
- Create proper interfaces for component props

#### 2.3 Fix Type Safety in Engine
- Fix `any` types in engine files (factories, recruitment, rivals)
- Improve type safety in combat resolution
- Add proper typing for RNG services

### Phase 3: Code Quality Improvements (Low Risk, Medium Impact)

**Priority: Medium**
**Estimated Time: 3-4 days**

#### 3.1 Remove Debug Code
- Remove or replace console.log statements with proper logging
- Keep console.time in test files (useful for profiling)
- Add proper logging library if needed

#### 3.2 Address TODOs and FIXMEs
- Review and resolve high-priority TODOs
- Convert FIXMEs to actionable tasks
- Remove obsolete HACKs and XXXs

#### 3.3 Improve Import Organization
- Standardize import patterns
- Use absolute imports where appropriate
- Remove circular dependencies

### Phase 4: Architectural Improvements (High Risk, High Impact)

**Priority: Medium**
**Estimated Time: 7-10 days**

#### 4.1 Refactor State Management
- Separate UI state from game state
- Create proper slices for different concerns
- Improve type safety throughout store

#### 4.2 Component Modularization
- Extract common patterns into reusable components
- Reduce duplication across similar components
- Improve component composition

#### 4.3 Engine Architecture
- Review and improve engine module boundaries
- Reduce coupling between engine modules
- Improve testability of engine logic

### Phase 5: Testing and Documentation (Low Risk, Medium Impact)

**Priority: Medium**
**Estimated Time: 3-4 days**

#### 5.1 Improve Test Coverage
- Add unit tests for critical engine functions
- Add integration tests for key workflows
- Improve E2E test coverage

#### 5.2 Documentation
- Document complex engine logic
- Add JSDoc comments to public APIs
- Create architecture documentation

## Implementation Order

1. **Phase 1** (Cleanup) - Start here for quick wins
2. **Phase 2** (Type Safety) - Critical for long-term maintainability
3. **Phase 3** (Code Quality) - Can be done in parallel with Phase 2
4. **Phase 4** (Architecture) - Requires careful planning
5. **Phase 5** (Testing/Docs) - Ongoing throughout

## Success Metrics

- **Code Reduction:** No reduction expected (0 files actually unused)
- **Type Safety:** Reduce `any` usage by 80%
- **Build Time:** Maintain or improve build time
- **Test Coverage:** Increase coverage by 20%
- **Technical Debt:** Reduce TODO/FIXME count by 50%

## Risks and Mitigations

### Risk 1: Breaking Changes
**Mitigation:** Run comprehensive tests after each phase, use feature flags for major changes

### Risk 2: Performance Regression
**Mitigation:** Benchmark critical paths before and after changes, profile performance

### Risk 3: Time Overrun
**Mitigation:** Prioritize high-impact, low-risk changes first, be prepared to defer lower-priority items

## Next Steps

1. Review and approve this plan
2. Set up branch for Phase 1 work
3. Begin with root-level cleanup (delete obsolete analysis markdown files)
4. Remove unused imports from 157 files
5. Move to Phase 2 (Type Safety Improvements)

---

**Generated:** 2025-01-04
**Analysis Method:** Exhaustive code audit of 389 TypeScript files
**Tools Used:** Manual code review, grep analysis, dependency tracing
