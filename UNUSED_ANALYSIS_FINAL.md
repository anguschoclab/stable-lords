# Unused TypeScript Analysis Report (Transitive Dependency Analysis)

Generated: 2026-04-12T19:26:34.585Z

## Summary

- Total TypeScript files analyzed: 389
- Files not reachable from entry points: 33
- Files with unused imports: 157

## Analysis Method

This analysis uses **transitive dependency tracing** from entry points:
1. Starts from entry points (main.tsx, App.tsx, etc.)
2. Traces all imports recursively through the dependency tree
3. Identifies files that are NOT reachable from any entry point
4. This is more accurate than checking for direct imports only

## Entry Points

The following files are entry points:

- `src/main.tsx`
- `src/App.tsx`
- `vite.config.ts`
- `tailwind.config.ts`
- `vitest.config.ts`

## Confirmed Unused Files

The following files are NOT reachable from any entry point:

- `src/components/BoutVisualizer.tsx`
- `src/components/EventLog.tsx`
- `src/components/MarkdownReader.tsx`
- `src/components/SubNav.tsx`
- `src/components/WarriorBuilder.tsx`
- `src/components/widgets/NextBoutWidget.tsx`
- `src/components/widgets/WeatherWidget.tsx`
- `src/engine/combat/services/simulateFightService.ts`
- `src/engine/combat/simulate/core/simulateHelpers.ts`
- `src/engine/core/rng/TestRNGService.ts`
- `src/engine/core/rng/index.ts`
- `src/engine/core/worldSeeder.ts`
- `src/engine/dayPipeline.ts`
- `src/engine/matchmaking/aiBoutSimulator.ts`
- `src/engine/matchmaking/aiPoolCollector.ts`
- `src/engine/matchmaking/bidReconciler.ts`
- `src/engine/matchmaking/eligibility.ts`
- `src/engine/matchmaking/rivalScheduler.ts`
- `src/engine/matchmaking/tournament/tournamentFreelancerGenerator.ts`
- `src/engine/promoters/promoterGenerator.ts`
- `src/engine/stats/simulationMetrics.ts`
- `src/engine/storage/truncation.ts`
- `src/engine/tick/TickOrchestrator.ts`
- `src/engine/tick/tickHandler.ts`
- `src/engine/worker.ts`
- `src/hooks/useCoachTip.ts`
- `src/hooks/useKeyboardShortcuts.ts`
- `src/lore/HallOfFights.tsx`
- `src/pages/AdminTools.tsx`
- `src/pages/ArenaHub.tsx`
- `src/pages/PhysicalsSimulator.tsx`
- `src/pages/Recruit.tsx`
- `src/utils/mathUtils.ts`

## Excluded Files (Not Analyzed)

The following files were excluded from analysis:

- src/routes/__root.tsx (route file - auto-discovered by TanStack Router)
- src/routes/command/__root.tsx (route file - auto-discovered by TanStack Router)
- src/routes/command/combat.tsx (route file - auto-discovered by TanStack Router)
- src/routes/command/index.tsx (route file - auto-discovered by TanStack Router)
- src/routes/command/roster.tsx (route file - auto-discovered by TanStack Router)
- src/routes/command/tactics.tsx (route file - auto-discovered by TanStack Router)
- src/routes/command/training.tsx (route file - auto-discovered by TanStack Router)
- src/routes/help.tsx (route file - auto-discovered by TanStack Router)
- src/routes/index.tsx (route file - auto-discovered by TanStack Router)
- src/routes/legacy/analytics.tsx (route file - auto-discovered by TanStack Router)
- src/routes/legacy/awards.tsx (route file - auto-discovered by TanStack Router)
- src/routes/legacy/hall-of-fame.tsx (route file - auto-discovered by TanStack Router)
- src/routes/legacy/index.tsx (route file - auto-discovered by TanStack Router)
- src/routes/legacy/tournament-awards.tsx (route file - auto-discovered by TanStack Router)
- src/routes/ops/__root.tsx (route file - auto-discovered by TanStack Router)
- src/routes/ops/contracts.tsx (route file - auto-discovered by TanStack Router)
- src/routes/ops/equipment.tsx (route file - auto-discovered by TanStack Router)
- src/routes/ops/finance.tsx (route file - auto-discovered by TanStack Router)
- src/routes/ops/index.tsx (route file - auto-discovered by TanStack Router)
- src/routes/ops/personnel.tsx (route file - auto-discovered by TanStack Router)
- src/routes/run-round.tsx (route file - auto-discovered by TanStack Router)
- src/routes/stable/$id.tsx (route file - auto-discovered by TanStack Router)
- src/routes/stable/contracts.tsx (route file - auto-discovered by TanStack Router)
- src/routes/stable/equipment.tsx (route file - auto-discovered by TanStack Router)
- src/routes/stable/finance.tsx (route file - auto-discovered by TanStack Router)
- src/routes/stable/index.tsx (route file - auto-discovered by TanStack Router)
- src/routes/stable/planner.tsx (route file - auto-discovered by TanStack Router)
- src/routes/stable/recruit.tsx (route file - auto-discovered by TanStack Router)
- src/routes/stable/trainers.tsx (route file - auto-discovered by TanStack Router)
- src/routes/stable/training.tsx (route file - auto-discovered by TanStack Router)
- src/routes/warrior/$id.tsx (route file - auto-discovered by TanStack Router)
- src/routes/welcome.tsx (route file - auto-discovered by TanStack Router)
- src/routes/world/__root.tsx (route file - auto-discovered by TanStack Router)
- src/routes/world/chronicle.tsx (route file - auto-discovered by TanStack Router)
- src/routes/world/gazette.tsx (route file - auto-discovered by TanStack Router)
- src/routes/world/history.tsx (route file - auto-discovered by TanStack Router)
- src/routes/world/index.tsx (route file - auto-discovered by TanStack Router)
- src/routes/world/intelligence.tsx (route file - auto-discovered by TanStack Router)
- src/routes/world/scouting.tsx (route file - auto-discovered by TanStack Router)
- src/routes/world/stable/$id.tsx (route file - auto-discovered by TanStack Router)
- src/routes/world/tournaments.tsx (route file - auto-discovered by TanStack Router)
- src/scripts/autobalance.ts (script file)
- src/scripts/daily_bard.ts (script file)
- src/scripts/simulation-harness.ts (script file)
- src/scripts/verify-economy.ts (script file)
- src/test/setup.ts (test file)
- src/test/testHelpers.ts (test file)
- src/test/testUtils.tsx (test file)
- src/types/combat.types.ts (type file - used for type checking)
- src/types/game.ts (type file - used for type checking)
- src/types/shared.types.ts (type file - used for type checking)
- src/types/state.types.ts (type file - used for type checking)
- src/types/warrior.types.ts (type file - used for type checking)
- scripts/daily_oracle.ts (script file)
- scripts/mock-env.ts (script file)
- scripts/season_smoke.ts (script file)
- autosim.ts (utility script)
- benchmark.ts (utility script)
- test_init.ts (test file)
- test_prof.ts (test file)
- test_sim.ts (test file)

## Unused Imports by File

*Note: This may have false positives for symbols used in JSX, template strings, or type assertions.*

### src/components/BoutViewer.tsx

Potentially unused imports:
- `Button`
- `Dna`
- `BarChart3`
- `TrendingUp`

### src/components/BoutVisualizer.tsx

Potentially unused imports:
- `ChevronDown`
- `ChevronUp`

### src/components/EquipmentLoadout.tsx

Potentially unused imports:
- `type EquipmentLoadout`
- `type EquipmentSlot`
- `type EquipmentItem`
- `type WeaponReqResult`

### src/components/PlanBuilder.tsx

Potentially unused imports:
- `Button`
- `Tabs`
- `TabsContent`
- `TabsList`
- `TabsTrigger`
- `Crosshair`
- `AlertTriangle`
- `ChevronDown`
- `Sparkles`
- `BookOpen`
- `getTempoBonus`
- `getStyleAntiSynergy`
- `getOffensiveSuitability`
- `getDefensiveSuitability`
- `SUITABILITY_COLORS`
- `STYLE_PRESETS`

### src/components/ResolutionReveal.tsx

Potentially unused imports:
- `BarChart3`
- `BrainCircuit`

### src/components/StableDossier.tsx

Potentially unused imports:
- `CardHeader`
- `CardTitle`
- `Trophy`
- `Star`
- `Flame`
- `Shield`
- `Activity`
- `History`
- `Swords`
- `Heart`
- `Zap`
- `Skull`
- `WarriorNameTag`

### src/components/WarriorBuilder.tsx

Potentially unused imports:
- `Separator`
- `type Attributes`

### src/components/dashboard/AgentReasoningWidget.tsx

Potentially unused imports:
- `Badge`

### src/components/dashboard/FinancesWidget.tsx

Potentially unused imports:
- `Activity`
- `BarChart3`

### src/components/dashboard/IntelligenceHubWidget.tsx

Potentially unused imports:
- `Bell`
- `TrendingUp`
- `Target`
- `Activity`
- `cn`

### src/components/dashboard/MedicalAuditWidget.tsx

Potentially unused imports:
- `AlertCircle`
- `Thermometer`
- `ChevronRight`
- `Progress`

### src/components/dashboard/MetaPulseWidget.tsx

Potentially unused imports:
- `Zap`
- `Target`

### src/components/dashboard/RankingsWidget.tsx

Potentially unused imports:
- `Link`
- `Zap`
- `Tooltip`
- `TooltipContent`
- `TooltipTrigger`

### src/components/dashboard/RecentBoutsWidget.tsx

Potentially unused imports:
- `ScrollText`
- `Target`
- `Zap`

### src/components/dashboard/RivalryWidget.tsx

Potentially unused imports:
- `StableLink`
- `WarriorLink`
- `Activity`
- `Zap`
- `AlertCircle`
- `Sparkles`
- `Swords`
- `Tooltip`
- `TooltipContent`
- `TooltipTrigger`

### src/components/dashboard/RivalsListWidget.tsx

Potentially unused imports:
- `Shield`
- `Zap`
- `TrendingUp`
- `Sword`
- `Tooltip`
- `TooltipContent`
- `TooltipTrigger`

### src/components/dashboard/SeasonWidget.tsx

Potentially unused imports:
- `Trophy`
- `MapPin`
- `Gauge`
- `Sparkles`
- `SunDim`

### src/components/dashboard/StableComparisonWidget.tsx

Potentially unused imports:
- `Users`
- `Target`
- `Zap`
- `Star`
- `Award`
- `Skull`
- `type Warrior`
- `Tooltip`
- `TooltipContent`
- `TooltipTrigger`

### src/components/dashboard/StableWidget.tsx

Potentially unused imports:
- `Activity`
- `Heart`
- `Swords`
- `Star`
- `Tooltip`
- `TooltipContent`
- `TooltipTrigger`

### src/components/dashboard/TrainingWidget.tsx

Potentially unused imports:
- `Activity`
- `Target`
- `TrendingUp`
- `AlertCircle`
- `Sparkles`
- `Tooltip`
- `TooltipContent`
- `TooltipTrigger`

### src/components/gazette/GazetteArticle.tsx

Potentially unused imports:
- `Tooltip`
- `TooltipContent`
- `TooltipTrigger`

### src/components/gazette/GazetteLeaderboards.tsx

Potentially unused imports:
- `Activity`
- `LayoutGrid`
- `cn`

### src/components/ledger/Chronicle.tsx

Potentially unused imports:
- `BookOpen`
- `Clock`
- `Zap`
- `cn`

### src/components/ledger/ContractManager.tsx

Potentially unused imports:
- `Progress`
- `Target`
- `Calendar`
- `Clock`

### src/components/ledger/HallOfWarriors.tsx

Potentially unused imports:
- `Badge`
- `WarriorNameTag`
- `Skull`
- `Star`
- `Swords`
- `Target`
- `Activity`
- `Quote`
- `History`
- `Cross`
- `cn`

### src/components/ledger/InsightManager.tsx

Potentially unused imports:
- `Badge`
- `FightingStyle`

### src/components/ledger/InsightVault.tsx

Potentially unused imports:
- `Sparkles`
- `Info`
- `cn`
- `Tooltip`
- `TooltipContent`
- `TooltipTrigger`

### src/components/ledger/TreasuryOverview.tsx

Potentially unused imports:
- `Coins`
- `FileText`
- `Activity`
- `type Warrior`
- `type LedgerEntry`

### src/components/modals/DeathModal.tsx

Potentially unused imports:
- `useShallow`
- `AnimatePresence`
- `STYLE_ABBREV`

### src/components/navigation/SubTabNav.tsx

Potentially unused imports:
- `type HubId`

### src/components/run-round/LethalityBadge.tsx

Potentially unused imports:
- `cn`

### src/components/run-round/RunResults.tsx

Potentially unused imports:
- `CardContent`
- `CardHeader`
- `CardTitle`
- `Trophy`
- `Swords`

### src/components/scouting/RivalStableList.tsx

Potentially unused imports:
- `Card`
- `CardContent`

### src/components/scouting/RivalWarriorList.tsx

Potentially unused imports:
- `Badge`

### src/components/scouting/ScoutIntelTab.tsx

Potentially unused imports:
- `Eye`
- `Activity`

### src/components/scouting/ScoutReportDetails.tsx

Potentially unused imports:
- `Button`

### src/components/scouting/StableComparison.tsx

Potentially unused imports:
- `TrendingUp`
- `Badge`

### src/components/scouting/WarriorComparison.tsx

Potentially unused imports:
- `Zap`

### src/components/stable/ReputationSliders.tsx

Potentially unused imports:
- `Badge`
- `Progress`

### src/components/stable/RosterWall.tsx

Potentially unused imports:
- `Badge`
- `Trophy`
- `Target`
- `BarChart3`

### src/components/stable/TrainerCard.tsx

Potentially unused imports:
- `Badge`
- `Clock`
- `ChevronRight`

### src/components/stable/TrainerTable.tsx

Potentially unused imports:
- `ChevronRight`
- `Activity`

### src/components/training/WarriorTrainingCard.tsx

Potentially unused imports:
- `type Warrior`
- `type TrainingAssignment`
- `type Attributes`
- `TooltipProvider`

### src/components/ui/CoachOverlay.tsx

Potentially unused imports:
- `AlertCircle`
- `ShieldAlert`
- `History`

### src/components/ui/Surface.tsx

Potentially unused imports:
- `type VariantProps`

### src/components/ui/WarriorBadges.tsx

Potentially unused imports:
- `type TagBadgeProps`
- `type StatBadgeProps`
- `type WarriorNameTagProps`

### src/components/ui/badge.tsx

Potentially unused imports:
- `type VariantProps`

### src/components/ui/button.tsx

Potentially unused imports:
- `type VariantProps`

### src/components/ui/label.tsx

Potentially unused imports:
- `type VariantProps`

### src/components/ui/sheet.tsx

Potentially unused imports:
- `type VariantProps`

### src/components/ui/toast.tsx

Potentially unused imports:
- `type VariantProps`

### src/components/warrior/CareerTimeline.tsx

Potentially unused imports:
- `type Warrior`
- `type FightSummary`

### src/components/warrior/ChronicleTab.tsx

Potentially unused imports:
- `type FightSummary`

### src/components/warrior/FavoritesCard.tsx

Potentially unused imports:
- `Lightbulb`
- `type Warrior`

### src/components/warrior/WarriorFightHistory.tsx

Potentially unused imports:
- `type FightSummary`

### src/components/warrior/WarriorHeroHeader.tsx

Potentially unused imports:
- `cn`

### src/components/warrior/WarriorStats.tsx

Potentially unused imports:
- `type Warrior`

### src/components/widgets/BubbleWatchWidget.tsx

Potentially unused imports:
- `HelpCircle`

### src/components/widgets/MetaDriftWidget.tsx

Potentially unused imports:
- `Progress`

### src/components/widgets/NextBoutWidget.tsx

Potentially unused imports:
- `TrendingUp`
- `WarriorLink`

### src/components/widgets/SchedulingWidget.tsx

Potentially unused imports:
- `type Warrior`
- `type MatchupScore`
- `CardHeader`
- `CardTitle`
- `Separator`
- `Target`

### src/components/world/RivalIntelligence.tsx

Potentially unused imports:
- `Target`
- `Coins`
- `TrendingUp`
- `type FightingStyle`
- `type RivalStableData`

### src/components/world/StableRankings.tsx

Potentially unused imports:
- `Star`
- `Swords`
- `Target`
- `Activity`

### src/components/world/WarriorLeaderboard.tsx

Potentially unused imports:
- `Star`
- `Swords`
- `Target`
- `Medal`

### src/data/orphanPool.ts

Potentially unused imports:
- `type Attributes`

### src/engine/aging.ts

Potentially unused imports:
- `type StateImpact`

### src/engine/ai/intentEngine.ts

Potentially unused imports:
- `PERSONALITY_CLASH`

### src/engine/ai/workers/competitionWorker.ts

Potentially unused imports:
- `type GameState`
- `type Warrior`
- `type RivalStableData`
- `type BoutOffer`
- `type WeatherType`
- `type CrowdMood`
- `logAgentAction`

### src/engine/ai/workers/recruitmentWorker.ts

Potentially unused imports:
- `type RivalStableData`
- `type PoolWarrior`
- `type Warrior`
- `generateId`
- `computeMetaDrift`

### src/engine/ai/workers/rosterWorker.ts

Potentially unused imports:
- `type AgentContext`

### src/engine/ai/workers/staffWorker.ts

Potentially unused imports:
- `type CrowdMood`
- `type AgentContext`

### src/engine/autosim.ts

Potentially unused imports:
- `type GameState`

### src/engine/bout/core/pairings.ts

Potentially unused imports:
- `BoutOffer`

### src/engine/bout/decisionLogic.ts

Potentially unused imports:
- `type FighterState`

### src/engine/bout/fighterState.ts

Potentially unused imports:
- `type BaseSkills`
- `type Warrior`
- `type FightPlan`
- `type Trainer`
- `getClassicWeaponBonus`
- `getLoadoutWeight`
- `type FighterState`

### src/engine/bout/mortalityHandler.ts

Potentially unused imports:
- `generateId`

### src/engine/bout/progressionHandler.ts

Potentially unused imports:
- `updateEntityInList`

### src/engine/bout/recordHandler.ts

Potentially unused imports:
- `addMatchRecord`

### src/engine/bout/reportingHandler.ts

Potentially unused imports:
- `type AnnounceTone`

### src/engine/bout/services/boutProcessorService.ts

Potentially unused imports:
- `type FightOutcome`
- `updatePromoterHistory`

### src/engine/combat/core/exchangeHelpers.ts

Potentially unused imports:
- `FightingStyle`
- `type Attributes`
- `type BaseSkills`
- `type DerivedStats`
- `type OffensiveTactic`
- `type DefensiveTactic`
- `fatiguePenalty`
- `Phase`
- `TACTIC_OVERUSE_CAP`
- `calculateFinalOEAL`
- `applyAggressionBias`

### src/engine/combat/narrator.ts

Potentially unused imports:
- `type FightingStyle`
- `type CombatEvent`
- `type MinuteEvent`
- `tauntLine`
- `getWeaponDisplayName`

### src/engine/combat/resolution.ts

Potentially unused imports:
- `evaluateInitiative`
- `skillCheck`
- `computeHitDamage`
- `rollHitLocation`
- `applyProtectMod`
- `calculateKillWindow`
- `getEnduranceMult`
- `getKillMechanic`
- `type Phase`
- `type MasteryTier`
- `GLOBAL_ATT_BONUS`
- `GLOBAL_PAR_PENALTY`
- `INITIATIVE_PRESS_BONUS`
- `DEFENDER_ENDURANCE_DISCOUNT`
- `CRIT_DAMAGE_MULT`
- `oeAttMod`
- `oeDefMod`

### src/engine/combat/simulate/core/simulateHelpers.ts

Potentially unused imports:
- `type WeatherType`

### src/engine/combat/tacticResolution.ts

Potentially unused imports:
- `type OffensiveTactic`
- `type DefensiveTactic`

### src/engine/core/worldSeeder.ts

Potentially unused imports:
- `type Attributes`
- `ATTRIBUTE_KEYS`
- `ATTRIBUTE_MAX`
- `createFreshState`

### src/engine/draftService.ts

Potentially unused imports:
- `type RivalStableData`
- `type PoolWarrior`
- `type GameState`

### src/engine/economy.ts

Potentially unused imports:
- `type StateImpact`

### src/engine/equipmentOptimizer.ts

Potentially unused imports:
- `STYLE_DISPLAY_NAMES`
- `WEAPONS`
- `ARMORS`
- `SHIELDS`
- `HELMS`
- `type EquipmentItem`
- `type EquipmentLoadout`

### src/engine/factories.ts

Potentially unused imports:
- `type GameState`
- `type Warrior`
- `type OwnerPersonality`
- `type FightSummary`
- `type PoolWarrior`
- `ATTRIBUTE_KEYS`
- `ATTRIBUTE_MAX`

### src/engine/favorites.ts

Potentially unused imports:
- `STYLE_CLASSIC_WEAPONS`

### src/engine/gazetteNarrative.ts

Potentially unused imports:
- `generateId`

### src/engine/injuries.ts

Potentially unused imports:
- `generateId`

### src/engine/matchmaking/rivalScheduler.ts

Potentially unused imports:
- `type AIPoolWarrior`
- `type AIBoutResult`

### src/engine/matchmaking/tournament/tournamentResolver.ts

Potentially unused imports:
- `modifyWarrior`

### src/engine/matchmakingServices.ts

Potentially unused imports:
- `getStablePairKey`
- `getWarriorPairKey`

### src/engine/narrative/boutNarrator.ts

Potentially unused imports:
- `StatusNarrator`

### src/engine/narrative/combatNarrator.ts

Potentially unused imports:
- `type CombatContext`

### src/engine/narrative/narrativeUtils.ts

Potentially unused imports:
- `type WeaponType`

### src/engine/ownerRoster.ts

Potentially unused imports:
- `type StyleMeta`

### src/engine/pipeline/adapters/opfsArchiver.ts

Potentially unused imports:
- `type Season`
- `FightingStyle`

### src/engine/pipeline/core/tierProgression.ts

Potentially unused imports:
- `type Season`
- `generateId`

### src/engine/pipeline/passes/BoutSimulationPass.ts

Potentially unused imports:
- `generateId`

### src/engine/pipeline/passes/EventPass.ts

Potentially unused imports:
- `updateEntityInList`

### src/engine/pipeline/passes/WarriorPass.ts

Potentially unused imports:
- `PatronTokenService`

### src/engine/potential.ts

Potentially unused imports:
- `type Attributes`
- `FightingStyle`

### src/engine/recruitment.ts

Potentially unused imports:
- `type Attributes`
- `type BaseSkills`
- `type DerivedStats`
- `type AttributePotential`
- `type WarriorFavorites`
- `generateId`

### src/engine/rivals.ts

Potentially unused imports:
- `STYLE_DISPLAY_NAMES`
- `STYLE_ABBREV`
- `type Attributes`
- `ATTRIBUTE_KEYS`
- `ATTRIBUTE_LABELS`
- `ATTRIBUTE_MIN`
- `ATTRIBUTE_MAX`
- `ATTRIBUTE_TOTAL`
- `type BaseSkills`
- `type DerivedStats`
- `type Gear`
- `type FightPlan`
- `type DeathEvent`
- `type Trainer`
- `type TrainerTier`
- `type TrainerFocus`
- `computeWarriorStats`
- `type StableTemplate`

### src/engine/scouting.ts

Potentially unused imports:
- `generateId`

### src/engine/simulate.ts

Potentially unused imports:
- `type ResolutionContext`

### src/engine/skillCalc.ts

Potentially unused imports:
- `ATTRIBUTE_KEYS`
- `ATTRIBUTE_MAX`
- `type Attributes`
- `type BaseSkills`
- `type DerivedStats`

### src/engine/tick/TickOrchestrator.ts

Potentially unused imports:
- `advanceWeek`
- `resolveImpacts`
- `StateImpact`

### src/engine/trainers.ts

Potentially unused imports:
- `type TrainerTier`
- `type TrainerFocus`

### src/engine/training/coachLogic.ts

Potentially unused imports:
- `type Attributes`
- `type TrainerFocus`

### src/engine/training/facilityUpkeep.ts

Potentially unused imports:
- `type Attributes`
- `type SeasonalGrowth`
- `type Season`

### src/engine/training/trainingGains.ts

Potentially unused imports:
- `type GameState`
- `type TrainingAssignment`
- `type Warrior`
- `type InjuryData`
- `type Attributes`
- `type SeasonalGrowth`

### src/engine/training.ts

Potentially unused imports:
- `type StateImpact`
- `type TrainingResult`

### src/engine/worker.ts

Potentially unused imports:
- `PatronTokenService`

### src/hooks/useRivalryAlerts.ts

Potentially unused imports:
- `useCallback`

### src/lib/utils.ts

Potentially unused imports:
- `type ClassValue`

### src/pages/AdminTools.tsx

Potentially unused imports:
- `CardTitle`

### src/pages/ArenaHub.tsx

Potentially unused imports:
- `STYLE_DISPLAY_NAMES`
- `FightingStyle`
- `type CrowdMood`
- `Flame`
- `Zap`
- `Target`
- `Info`
- `TooltipProvider`

### src/pages/BookingOffice.tsx

Potentially unused imports:
- `ScrollArea`

### src/pages/Gazette.tsx

Potentially unused imports:
- `Info`
- `Search`
- `useShallow`

### src/pages/Graveyard.tsx

Potentially unused imports:
- `Card`
- `CardContent`
- `Button`
- `Armchair`
- `Swords`
- `Trophy`
- `Link`
- `AnimatePresence`

### src/pages/HallOfFame/InducteeCard.tsx

Potentially unused imports:
- `Trophy`
- `Medal`
- `Star`

### src/pages/Help.tsx

Potentially unused imports:
- `Card`
- `CardContent`
- `CardHeader`
- `CardTitle`

### src/pages/KillAnalytics.tsx

Potentially unused imports:
- `StyleRollups`
- `type StyleRecord`
- `Progress`
- `Users`
- `Info`
- `Legend`
- `cn`

### src/pages/Orphanage.tsx

Potentially unused imports:
- `FightingStyle`
- `STYLE_DISPLAY_NAMES`
- `ATTRIBUTE_KEYS`
- `ATTRIBUTE_LABELS`
- `type Warrior`
- `type FightSummary`
- `DAMAGE_LABELS`
- `generateId`
- `Tooltip`
- `TooltipContent`
- `TooltipProvider`
- `TooltipTrigger`
- `Swords`
- `Sparkles`
- `Skull`
- `Shield`
- `CheckCircle2`
- `Trophy`
- `User`
- `MapPin`
- `Brain`

### src/pages/PhysicalsSimulator.tsx

Potentially unused imports:
- `Shield`
- `Battery`

### src/pages/Recruit.tsx

Potentially unused imports:
- `type Attributes`
- `generateRecruitPool`
- `type PoolWarrior`
- `type RecruitTier`

### src/pages/RunRound.tsx

Potentially unused imports:
- `type GameState`
- `type Warrior`
- `type RivalStableData`
- `type BoutResult`
- `type AutosimResult`
- `Shield`
- `FastForward`
- `useShallow`

### src/pages/Scouting.tsx

Potentially unused imports:
- `type ScoutQuality`
- `type ScoutReportData`
- `type RivalStableData`
- `type Warrior`

### src/pages/SeasonalAwards.tsx

Potentially unused imports:
- `useState`
- `STYLE_DISPLAY_NAMES`
- `CardHeader`
- `CardTitle`
- `Tabs`
- `TabsContent`
- `TabsList`
- `TabsTrigger`
- `Swords`
- `Star`
- `Flame`
- `Zap`
- `Heart`
- `Trophy`

### src/pages/StableDetail.tsx

Potentially unused imports:
- `STYLE_DISPLAY_NAMES`
- `ATTRIBUTE_LABELS`
- `CardHeader`
- `CardTitle`
- `Progress`
- `Dumbbell`

### src/pages/StableHall.tsx

Potentially unused imports:
- `Users`
- `Medal`
- `Award`

### src/pages/StartGame.tsx

Potentially unused imports:
- `type SaveSlotMeta`
- `Badge`
- `Users`
- `Flame`

### src/pages/TournamentAwards.tsx

Potentially unused imports:
- `STYLE_DISPLAY_NAMES`
- `CardHeader`
- `CardTitle`
- `Badge`
- `Collapsible`
- `CollapsibleContent`
- `CollapsibleTrigger`
- `Swords`
- `Star`
- `Zap`
- `ChevronDown`
- `Flame`
- `cn`

### src/pages/Tournaments.tsx

Potentially unused imports:
- `simulateFight`
- `defaultPlanForWarrior`
- `fameFromTags`
- `aiPlanForWarrior`
- `type TournamentEntry`
- `type TournamentBout`
- `type FightSummary`
- `type Warrior`
- `FightingStyle`
- `generateId`
- `hashStr`
- `SeededRNG`
- `ArenaHistory`
- `NewsletterFeed`
- `StyleRollups`
- `getFightsForTournament`
- `FastForward`

### src/pages/Trainers.tsx

Potentially unused imports:
- `STYLE_DISPLAY_NAMES`
- `type TrainerTier`
- `Button`
- `generateId`

### src/pages/Training.tsx

Potentially unused imports:
- `useShallow`
- `type TrainingAssignment`
- `type Attributes`
- `Badge`

### src/pages/TrainingPlanner.tsx

Potentially unused imports:
- `type Attributes`
- `type FightingStyle`

### src/pages/WarriorDetail.tsx

Potentially unused imports:
- `type FightPlan`
- `type GameState`
- `type EquipmentLoadout`

### src/pages/WorldOverview.tsx

Potentially unused imports:
- `Skull`
- `Crown`
- `Activity`

### src/scripts/simulation-harness.ts

Potentially unused imports:
- `type GameState`
- `processWeekBouts`
- `type SimPulse`

### src/state/mutations/contractMutations.ts

Potentially unused imports:
- `BoutOffer`

### src/state/slices/economySlice.ts

Potentially unused imports:
- `GameState`
- `canTransact`

### src/state/slices/rosterSlice.ts

Potentially unused imports:
- `GameState`

### src/state/useGameStore.ts

Potentially unused imports:
- `type BoutResult`
- `hashStr`
- `SeededRNG`

### src/test/testHelpers.ts

Potentially unused imports:
- `createFreshState`
- `generateId`

### src/types/state.types.ts

Potentially unused imports:
- `type Attributes`
- `type Season`
- `type CrowdMoodType`
- `type NewsletterItem`
- `type TrainerTier`
- `type TrainerFocus`
- `type Trainer`
- `type ScoutQuality`
- `type WeatherType`
- `type Warrior`
- `type DeathEvent`
- `type FightSummary`
- `type FightOutcomeBy`

### src/utils/historyResolver.ts

Potentially unused imports:
- `FightSummary`

### src/utils/idUtils.ts

Potentially unused imports:
- `type SeededRNG`

### scripts/daily_oracle.ts

Potentially unused imports:
- `runAutosim`
- `generateFTUEState`

### scripts/season_smoke.ts

Potentially unused imports:
- `type GameState`

### benchmark.ts

Potentially unused imports:
- `FAME_DIVIDEND`

### test_init.ts

Potentially unused imports:
- `createFreshState`

## Cleanup Recommendations

### Priority 1: Safe to Delete

The following files are not reachable from any entry point and can be safely deleted:

- `src/components/BoutVisualizer.tsx`
- `src/components/EventLog.tsx`
- `src/components/MarkdownReader.tsx`
- `src/components/SubNav.tsx`
- `src/components/WarriorBuilder.tsx`
- `src/components/widgets/NextBoutWidget.tsx`
- `src/components/widgets/WeatherWidget.tsx`
- `src/engine/combat/services/simulateFightService.ts`
- `src/engine/combat/simulate/core/simulateHelpers.ts`
- `src/engine/core/rng/TestRNGService.ts`
- `src/engine/core/rng/index.ts`
- `src/engine/core/worldSeeder.ts`
- `src/engine/dayPipeline.ts`
- `src/engine/matchmaking/aiBoutSimulator.ts`
- `src/engine/matchmaking/aiPoolCollector.ts`
- `src/engine/matchmaking/bidReconciler.ts`
- `src/engine/matchmaking/eligibility.ts`
- `src/engine/matchmaking/rivalScheduler.ts`
- `src/engine/matchmaking/tournament/tournamentFreelancerGenerator.ts`
- `src/engine/promoters/promoterGenerator.ts`
- `src/engine/stats/simulationMetrics.ts`
- `src/engine/storage/truncation.ts`
- `src/engine/tick/TickOrchestrator.ts`
- `src/engine/tick/tickHandler.ts`
- `src/engine/worker.ts`
- `src/hooks/useCoachTip.ts`
- `src/hooks/useKeyboardShortcuts.ts`
- `src/lore/HallOfFights.tsx`
- `src/pages/AdminTools.tsx`
- `src/pages/ArenaHub.tsx`
- `src/pages/PhysicalsSimulator.tsx`
- `src/pages/Recruit.tsx`
- `src/utils/mathUtils.ts`

### Priority 2: Review Unused Imports

Review the unused imports listed above. Some may be false positives due to JSX usage.

