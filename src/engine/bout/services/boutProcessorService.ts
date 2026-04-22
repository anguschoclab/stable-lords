import { GameState, Warrior, BoutOffer } from "@/types/state.types";
import { type FightOutcome } from "@/types/combat.types";
import { simulateFight, defaultPlanForWarrior } from "@/engine/simulate";
import { getMoodModifiers } from "@/engine/crowdMood";
import { engineEventBus } from "@/engine/core/EventBus";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { StateImpact, mergeImpacts } from "@/engine/impacts";
import { hashStr } from "@/utils/random";
import { validateBoutCombatants, calculateBoutFame, processContractPayouts, getWinnerId, getDefaultPlan } from "../core/resolveHelpers";
import { applyRecords } from "../recordHandler";
import { handleDeath } from "../mortalityHandler";
import { handleInjuries } from "../injuryHandler";
import { handleProgressions } from "../progressionHandler";
import { handleReporting } from "../reportingHandler";
import { generatePairings } from "../core/pairings";
import { finalizeWeekSideEffectsToImpact } from "./WeekFinalizationService";
import { accumulateWeekStats, createWeekBoutSummary } from "./WeekStatsService";

export interface BoutResult { a: Warrior; d: Warrior; outcome: FightOutcome; announcement?: string; isRivalry: boolean; rivalStable?: string; contractId?: string; }
export interface BoutImpact { impact: StateImpact; result: BoutResult; stats: { death: boolean; playerDeath: boolean; injured: boolean; deathNames: string[]; injuredNames: string[]; }; }
export interface WeekBoutSummary { bouts: number; deaths: number; injuries: number; deathNames: string[]; injuryNames: string[]; hadPlayerDeath: boolean; hadRivalryEscalation: boolean; }
export interface BoutContext { warriorMap: Map<string, Warrior>; warrior: Warrior; opponent: Warrior; isRivalry: boolean; rivalStable?: string; rivalStableId?: string; moodMods: ReturnType<typeof getMoodModifiers>; week: number; playerId: string; contract?: BoutOffer; }

function getValidatedCombatants(ctx: BoutContext): { cW: Warrior; cO: Warrior } | null {
  const cW = ctx.warriorMap.get(ctx.warrior.id);
  const cO = ctx.warriorMap.get(ctx.opponent.id);
  if (!validateBoutCombatants(cW, cO)) return null;
  if (!cW || !cO) return null;
  return { cW, cO };
}

function handleInvalidBout(ctx: BoutContext): BoutImpact {
  return {
    impact: {},
    result: { a: ctx.warrior, d: ctx.opponent, outcome: { winner: null, by: "Draw", minutes: 0, log: [] } as FightOutcome, isRivalry: ctx.isRivalry, rivalStable: ctx.rivalStable, contractId: ctx.contract?.id },
    stats: { death: false, playerDeath: false, injured: false, deathNames: [], injuredNames: [] }
  };
}

function runBoutSimulation(state: GameState, ctx: BoutContext, validCW: Warrior, validCO: Warrior, boutSeed: number) {
  return simulateFight(
    getDefaultPlan(validCW, defaultPlanForWarrior),
    getDefaultPlan(validCO, defaultPlanForWarrior),
    validCW, validCO, boutSeed, state.trainers, state.weather, undefined, state.crowdMood
  );
}

function collectBoutImpacts(state: GameState, ctx: BoutContext, validCW: Warrior, validCO: Warrior, outcome: FightOutcome, boutSeed: number) {
  const tags = outcome.post?.tags ?? [];
  const rng = new SeededRNGService(boutSeed);
  const { fameA, popA, fameD, popD } = calculateBoutFame(outcome, tags, ctx.moodMods, ctx.isRivalry);

  const impacts: StateImpact[] = processContractPayouts(state, ctx.contract, getWinnerId(outcome, validCW.id, validCO.id), validCW.id, validCO.id, ctx.rivalStableId);
  impacts.push(applyRecords(state, validCW, validCO, outcome, tags, fameA, popA, fameD, popD, ctx.rivalStableId));

  const deathRes = handleDeath(state, validCW, validCO, outcome, ctx.week, tags, ctx.rivalStableId, rng);
  const injuryRes = handleInjuries(state, validCW, validCO, outcome, ctx.week, ctx.rivalStableId, boutSeed);
  impacts.push(deathRes.impact, injuryRes.impact, handleProgressions(state, validCW, validCO, outcome, tags, ctx.week, ctx.rivalStableId, rng));

  const { summary, announcement } = handleReporting(validCW, validCO, outcome, tags, fameA, popA, fameD, popD, ctx.week, ctx.rivalStableId, ctx.isRivalry, 0, rng);
  impacts.push({ arenaHistory: [summary] });
  engineEventBus.emit({ type: 'BOUT_COMPLETED', payload: { summary, transcript: summary.transcript } });

  return { impacts, deathRes, injuryRes, announcement, summary };
}

export function resolveBout(state: GameState, ctx: BoutContext): BoutImpact {
  const combatants = getValidatedCombatants(ctx);
  if (!combatants) return handleInvalidBout(ctx);

  const { cW, cO } = combatants;
  const boutSeed = hashStr(`${ctx.week}|${cW.id}|${cO.id}`);

  const outcome = runBoutSimulation(state, ctx, cW, cO, boutSeed);
  const { impacts, deathRes, injuryRes, announcement } = collectBoutImpacts(state, ctx, cW, cO, outcome, boutSeed);

  return {
    impact: mergeImpacts(impacts),
    result: { a: ctx.warrior, d: ctx.opponent, outcome, announcement, isRivalry: ctx.isRivalry, rivalStable: ctx.rivalStable, contractId: ctx.contract?.id },
    stats: { death: deathRes.death, playerDeath: deathRes.playerDeath, injured: injuryRes.injured, deathNames: deathRes.deathNames, injuredNames: injuryRes.injuredNames }
  };
}

function buildWarriorMap(state: GameState): Map<string, Warrior> {
  const map = new Map<string, Warrior>();
  state.roster.forEach(w => map.set(w.id, w));
  (state.rivals || []).forEach(r => r.roster.forEach(w => map.set(w.id, w)));
  return map;
}

export function processWeekBouts(state: GameState): { impact: StateImpact; results: BoutResult[]; summary: WeekBoutSummary } {
  const warriorMap = state.warriorMap || buildWarriorMap(state);
  const moodMods = getMoodModifiers(state.crowdMood);
  const impacts: StateImpact[] = [];
  const results: BoutResult[] = [];
  const summary = createWeekBoutSummary();

  generatePairings(state).forEach(p => {
    const contract = p.contractId ? state.boutOffers[p.contractId] : undefined;
    const res = resolveBout(state, { warrior: p.a, opponent: p.d, isRivalry: p.isRivalry, rivalStable: p.rivalStable, rivalStableId: p.rivalStableId, moodMods, week: state.week, playerId: state.player.id, warriorMap, contract });
    impacts.push(res.impact);
    results.push(res.result);
    accumulateWeekStats(summary, res);
  });

  impacts.push(finalizeWeekSideEffectsToImpact(state, results));
  return { impact: mergeImpacts(impacts), results, summary };
}
