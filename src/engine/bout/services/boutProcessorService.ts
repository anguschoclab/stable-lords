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

export function resolveBout(state: GameState, ctx: BoutContext): BoutImpact {
  const { warrior, opponent, isRivalry, rivalStable, rivalStableId, moodMods, week, warriorMap, contract } = ctx;
  const cW = warriorMap?.get(warrior?.id);
  const cO = warriorMap?.get(opponent?.id);

  if (!validateBoutCombatants(cW, cO)) {
    return { impact: {}, result: { a: warrior, d: opponent, outcome: { winner: null, by: "Draw", minutes: 0, log: [] } as FightOutcome, isRivalry, rivalStable, contractId: contract?.id }, stats: { death: false, playerDeath: false, injured: false, deathNames: [], injuredNames: [] } };
  }

  if (!cW || !cO) {
    return { impact: {}, result: { a: warrior, d: opponent, outcome: { winner: null, by: "Error", minutes: 0, log: [] } as FightOutcome, isRivalry, rivalStable, contractId: contract?.id }, stats: { death: false, playerDeath: false, injured: false, deathNames: [], injuredNames: [] } };
  }
  const validCW = cW;
  const validCO = cO;

  const boutSeed = hashStr(`${week}|${validCW.id}|${validCO.id}`);
  const rng = new SeededRNGService(boutSeed);
  const outcome = simulateFight(getDefaultPlan(validCW, defaultPlanForWarrior), getDefaultPlan(validCO, defaultPlanForWarrior), validCW, validCO, boutSeed, state.trainers, state.weather, undefined, state.crowdMood);
  const tags = outcome.post?.tags ?? [];

  const { fameA, popA, fameD, popD } = calculateBoutFame(outcome, tags, moodMods, isRivalry);

  const impacts: StateImpact[] = processContractPayouts(state, contract, getWinnerId(outcome, validCW.id, validCO.id), validCW.id, validCO.id, rivalStableId);
  impacts.push(applyRecords(state, validCW, validCO, outcome, tags, fameA, popA, fameD, popD, rivalStableId));

  const deathRes = handleDeath(state, validCW, validCO, outcome, week, tags, rivalStableId, rng);
  const injuryRes = handleInjuries(state, validCW, validCO, outcome, week, rivalStableId, boutSeed);
  impacts.push(deathRes.impact, injuryRes.impact, handleProgressions(state, validCW, validCO, outcome, tags, week, rivalStableId, rng));

  const { summary, announcement } = handleReporting(validCW, validCO, outcome, tags, fameA, popA, fameD, popD, week, rivalStableId, isRivalry, 0, rng);
  impacts.push({ arenaHistory: [summary] });
  engineEventBus.emit({ type: 'BOUT_COMPLETED', payload: { summary, transcript: summary.transcript } });

  return { impact: mergeImpacts(impacts), result: { a: warrior, d: opponent, outcome, announcement, isRivalry, rivalStable, contractId: contract?.id }, stats: { death: deathRes.death, playerDeath: deathRes.playerDeath, injured: injuryRes.injured, deathNames: deathRes.deathNames, injuredNames: injuryRes.injuredNames } };
}

export function processWeekBouts(state: GameState): { impact: StateImpact; results: BoutResult[]; summary: WeekBoutSummary } {
  // ⚡ Bolt: Use cached warriorMap if available, otherwise build it
  const warriorMap = state.warriorMap || (() => {
    const map = new Map<string, Warrior>();
    state.roster.forEach(w => map.set(w.id, w));
    (state.rivals || []).forEach(r => r.roster.forEach(w => map.set(w.id, w)));
    return map;
  })();

  const pairings = generatePairings(state);
  const moodMods = getMoodModifiers(state.crowdMood);

  const impacts: StateImpact[] = [];
  const results: BoutResult[] = [];
  const summary = createWeekBoutSummary();

  pairings.forEach(p => {
    const contract = p.contractId ? state.boutOffers[p.contractId] : undefined;
    const res = resolveBout(state, { 
      warrior: p.a, 
      opponent: p.d, 
      isRivalry: p.isRivalry, 
      rivalStable: p.rivalStable, 
      rivalStableId: p.rivalStableId, 
      moodMods, 
      week: state.week, 
      playerId: state.player.id, 
      warriorMap,
      contract
    });
    impacts.push(res.impact);
    results.push(res.result);
    accumulateWeekStats(summary, res);
  });

  const sideEffectsImpact = finalizeWeekSideEffectsToImpact(state, results);
  impacts.push(sideEffectsImpact);
  
  const mergedImpact = mergeImpacts(impacts);
  return { impact: mergedImpact, results, summary };
}

