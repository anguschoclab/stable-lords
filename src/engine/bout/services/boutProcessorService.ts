import { GameState, Warrior, BoutOffer, RivalStableData } from "@/types/state.types";
import { type FightOutcome } from "@/types/combat.types";
import { simulateFight, defaultPlanForWarrior } from "@/engine/simulate";
import { fameFromTags } from "@/engine/fame";
import { computeCrowdMood, getMoodModifiers } from "@/engine/crowdMood";
import { updateRivalriesFromBouts } from "@/engine/matchmaking/rivalryLogic";
import { generateWeeklyGazette } from "@/engine/gazetteNarrative";
import { getFightsForWeek } from "@/engine/core/historyUtils";
import { engineEventBus } from "@/engine/core/EventBus";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { updatePromoterHistory } from "@/engine/promoters";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { StateImpact, mergeImpacts } from "@/engine/impacts";
import { validateBoutCombatants, calculateBoutFame, processContractPayouts, getWinnerId, getDefaultPlan } from "../core/resolveHelpers";


import { applyRecords } from "../recordHandler";
import { handleDeath } from "../mortalityHandler";
import { handleInjuries } from "../injuryHandler";
import { handleProgressions } from "../progressionHandler";
import { handleReporting } from "../reportingHandler";
import { generatePairings, BoutPairing } from "../core/pairings";

export interface BoutResult { a: Warrior; d: Warrior; outcome: FightOutcome; announcement?: string; isRivalry: boolean; rivalStable?: string; contractId?: string; }
export interface BoutImpact { impact: StateImpact; result: BoutResult; stats: { death: boolean; playerDeath: boolean; injured: boolean; deathNames: string[]; injuredNames: string[]; }; }
export interface WeekBoutSummary { bouts: number; deaths: number; injuries: number; deathNames: string[]; injuryNames: string[]; hadPlayerDeath: boolean; hadRivalryEscalation: boolean; }
export interface BoutContext { warriorMap: Map<string, Warrior>; warrior: Warrior; opponent: Warrior; isRivalry: boolean; rivalStable?: string; rivalStableId?: string; moodMods: ReturnType<typeof getMoodModifiers>; week: number; playerId: string; contract?: BoutOffer; }

/** Simple FNV-1a hash for deterministic seeds from IDs */
function hashStr(s: string): number {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function resolveBout(state: GameState, ctx: BoutContext): BoutImpact {
  const { warrior, opponent, isRivalry, rivalStable, rivalStableId, moodMods, week, warriorMap, contract } = ctx;
  const cW = warriorMap?.get(warrior?.id);
  const cO = warriorMap?.get(opponent?.id);

  if (!validateBoutCombatants(cW, cO)) {
    return { impact: {}, result: { a: warrior, d: opponent, outcome: { winner: null, by: "Draw", minutes: 0, log: [] } as FightOutcome, isRivalry, rivalStable, contractId: contract?.id }, stats: { death: false, playerDeath: false, injured: false, deathNames: [], injuredNames: [] } };
  }

  // After validation, cW and cO are guaranteed to be non-null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const validCW = cW!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const validCO = cO!;

  const boutSeed = hashStr(`${week}|${validCW.id}|${validCO.id}`);
  const rng = new SeededRNGService(boutSeed);
  const outcome = simulateFight(getDefaultPlan(validCW, defaultPlanForWarrior), getDefaultPlan(validCO, defaultPlanForWarrior), validCW, validCO, boutSeed, state.trainers, state.weather);
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
  const summary: WeekBoutSummary = { bouts: 0, deaths: 0, injuries: 0, deathNames: [], injuryNames: [], hadPlayerDeath: false, hadRivalryEscalation: false };

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

function processSingleBout(s: GameState, p: BoutPairing, moodMods: ReturnType<typeof import("@/engine/crowdMood").getMoodModifiers>, warriorMap: Map<string, Warrior>): BoutImpact {
  const contract = p.contractId ? s.boutOffers[p.contractId] : undefined;
  return resolveBout(s, { warrior: p.a, opponent: p.d, isRivalry: p.isRivalry, rivalStable: p.rivalStable, rivalStableId: p.rivalStableId, moodMods, week: s.week, playerId: s.player.id, warriorMap, contract });
}

function accumulateWeekStats(summary: WeekBoutSummary, res: BoutImpact) {
  summary.bouts++;
  if (res.stats.death) { summary.deaths += res.stats.deathNames.length; summary.deathNames.push(...res.stats.deathNames); }
  if (res.stats.playerDeath) summary.hadPlayerDeath = true;
  if (res.stats.injured) { summary.injuries += res.stats.injuredNames.length; summary.injuryNames.push(...res.stats.injuredNames); }
}

function updatePromoterHistoryToImpact(state: GameState, promoterId: string, purse: number, boutId: string): StateImpact {
  const updatedPromoters = { ...state.promoters };
  if (updatedPromoters[promoterId]) {
    updatedPromoters[promoterId] = {
      ...updatedPromoters[promoterId],
      history: {
        ...updatedPromoters[promoterId].history,
        totalPursePaid: (updatedPromoters[promoterId].history.totalPursePaid || 0) + purse,
        notableBouts: [...(updatedPromoters[promoterId].history.notableBouts || []), boutId]
      }
    };
  }
  return { promoters: updatedPromoters };
}

function finalizeWeekSideEffectsToImpact(state: GameState, results: BoutResult[]): StateImpact {
  const playerFameGain = results.filter(r => r.outcome.winner === "A" && !r.rivalStable).length;
  const newMood = computeCrowdMood(state.arenaHistory);
  const oldMood = state.crowdMood;
  
  // Unified fame tracking: player.fame is the authority
  const impact: StateImpact = {
    fameDelta: playerFameGain,
    crowdMood: newMood,
    moodHistory: [...(state.moodHistory || []).slice(-19), { week: state.week, mood: newMood }]
  };

  // Add mood change notification if mood changed significantly
  if (oldMood && oldMood !== newMood) {
    impact.newsletterItems = [{
      id: `mood_change_${state.week}`,
      week: state.week,
      title: `Crowd Mood Shift: ${oldMood} → ${newMood}`,
      items: [`The arena atmosphere has shifted from ${oldMood} to ${newMood}. This will affect fame gains, kill probabilities, and gazette tone this week.`]
    }];
  }

  const weekFights = getFightsForWeek(state.arenaHistory, state.week);
  const gazetteSeed = state.week * 9973 + 123;
  const gazetteRng = new SeededRNGService(gazetteSeed);
  impact.gazettes = [generateWeeklyGazette(weekFights, newMood, state.week, state.graveyard, state.arenaHistory, gazetteRng)];
  const rng = new SeededRNGService(state.week * 13);
  impact.rivalries = updateRivalriesFromBouts(state.rivalries || [], weekFights, state.week, rng);
  
  NewsletterFeed.closeWeekToIssue(state.week);
  
  return impact;
}
