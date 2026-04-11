import { GameState, Warrior, BoutOffer } from "@/types/state.types";
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
import { SeededRNGService } from "@/engine/core/rng";

import { applyRecords } from "../recordHandler";
import { handleDeath } from "../mortalityHandler";
import { handleInjuries } from "../injuryHandler";
import { handleProgressions } from "../progressionHandler";
import { handleReporting } from "../reportingHandler";
import { generatePairings, BoutPairing } from "../core/pairings";

export interface BoutResult { a: Warrior; d: Warrior; outcome: FightOutcome; announcement?: string; isRivalry: boolean; rivalStable?: string; contractId?: string; }
export interface BoutImpact { state: GameState; result: BoutResult; stats: { death: boolean; playerDeath: boolean; injured: boolean; deathNames: string[]; injuredNames: string[]; }; }
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
  const currentW = warriorMap?.get(warrior?.id);
  const currentO = warriorMap?.get(opponent?.id);

  if (!currentW || currentW.status !== "Active" || !currentO) {
    return { 
      state, 
      result: { 
        a: warrior, 
        d: opponent, 
        outcome: { winner: null, by: "Draw", minutes: 0, log: [] } as FightOutcome, 
        isRivalry, 
        rivalStable, 
        contractId: contract?.id 
      }, 
      stats: { death: false, playerDeath: false, injured: false, deathNames: [], injuredNames: [] } 
    };
  }

  // 🛡️ Determinism: Generate a unique seed for this specific bout
  const boutSeed = hashStr(`${week}|${currentW.id}|${currentO.id}`);
  const outcome = simulateFight(currentW.plan ?? defaultPlanForWarrior(currentW), currentO.plan ?? defaultPlanForWarrior(currentO), currentW, currentO, boutSeed, state.trainers, state.weather);
  const tags = outcome.post?.tags ?? [];
  const rawFameA = fameFromTags(outcome.winner === "A" ? tags : []);
  const rawFameD = fameFromTags(outcome.winner === "D" ? tags : []);

  const fameA = Math.round(rawFameA.fame * moodMods.fameMultiplier * (isRivalry ? 2 : 1));
  const popA = Math.round(rawFameA.pop * moodMods.popMultiplier);
  const fameD = Math.round(rawFameD.fame * moodMods.fameMultiplier);
  const popD = Math.round(rawFameD.pop * moodMods.popMultiplier);

  let s = { ...state };
  
  // 💰 Apply Contract Payouts
  if (contract) {
    const winnerId = outcome.winner === "A" ? currentW.id : outcome.winner === "D" ? currentO.id : null;
    const purse = contract.purse;
    const showFee = Math.floor(purse * 0.2);

    // Winner gets full purse, Loser gets show fee
    if (winnerId === currentW.id) {
       s.treasury += purse;
       // If D is a rival, give them show fee
       if (rivalStableId) {
         s.rivals = s.rivals.map(r => r.owner.id === rivalStableId ? { ...r, treasury: r.treasury + showFee } : r);
       }
    } else if (winnerId === currentO.id) {
       if (rivalStableId) {
         s.rivals = s.rivals.map(r => r.owner.id === rivalStableId ? { ...r, treasury: r.treasury + purse } : r);
       }
       s.treasury += showFee;
    } else {
       // Draw: both get show fee
       s.treasury += showFee;
       if (rivalStableId) {
         s.rivals = s.rivals.map(r => r.owner.id === rivalStableId ? { ...r, treasury: r.treasury + showFee } : r);
       }
    }
    
    // Update Promoter History
    s = updatePromoterHistory(s, contract.promoterId, purse, `bout_${week}_${currentW.id}_vs_${currentO.id}`);
    
    // Close the contract
    delete s.boutOffers[contract.id];
  }

  s = applyRecords(s, currentW, currentO, outcome, tags, fameA, popA, fameD, popD, rivalStableId);
  const deathRes = handleDeath(s, currentW, currentO, outcome, week, tags, rivalStableId);
  s = deathRes.s;
  const injuryRes = handleInjuries(s, currentW, currentO, outcome, week, rivalStableId, boutSeed);
  s = injuryRes.s;
  s = handleProgressions(s, currentW, currentO, outcome, tags, week, rivalStableId, new SeededRNGService(boutSeed));

  const { summary, announcement } = handleReporting(currentW, currentO, outcome, tags, fameA, popA, fameD, popD, week, rivalStableId, isRivalry, 0, new SeededRNGService(boutSeed));
  s.arenaHistory = [...s.arenaHistory, summary];
  engineEventBus.emit({ type: 'BOUT_COMPLETED', payload: { summary, transcript: summary.transcript } });

  return { state: s, result: { a: warrior, d: opponent, outcome, announcement, isRivalry, rivalStable, contractId: contract?.id }, stats: { death: deathRes.death, playerDeath: deathRes.playerDeath, injured: injuryRes.injured, deathNames: deathRes.deathNames, injuredNames: injuryRes.injuredNames } };
}

export function processWeekBouts(state: GameState): { state: GameState; results: BoutResult[]; summary: WeekBoutSummary } {
  // ⚡ Bolt: Use cached warriorMap if available, otherwise build it
  const warriorMap = state.warriorMap || (() => {
    const map = new Map<string, Warrior>();
    state.roster.forEach(w => map.set(w.id, w));
    (state.rivals || []).forEach(r => r.roster.forEach(w => map.set(w.id, w)));
    return map;
  })();

  const pairings = generatePairings(state);
  const moodMods = getMoodModifiers(state.crowdMood);

  let s = { ...state };
  const results: BoutResult[] = [];
  const summary: WeekBoutSummary = { bouts: 0, deaths: 0, injuries: 0, deathNames: [], injuryNames: [], hadPlayerDeath: false, hadRivalryEscalation: false };

  pairings.forEach(p => {
    const contract = p.contractId ? s.boutOffers[p.contractId] : undefined;
    const res = resolveBout(s, { 
      warrior: p.a, 
      opponent: p.d, 
      isRivalry: p.isRivalry, 
      rivalStable: p.rivalStable, 
      rivalStableId: p.rivalStableId, 
      moodMods, 
      week: s.week, 
      playerId: s.player.id, 
      warriorMap,
      contract
    });
    s = res.state;
    results.push(res.result);
    accumulateWeekStats(summary, res);
  });

  finalizeWeekSideEffects(s, results);
  return { state: s, results, summary };
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

function finalizeWeekSideEffects(s: GameState, results: BoutResult[]) {
  const playerFameGain = results.filter(r => r.outcome.winner === "A" && !r.rivalStable).length;
  // Unified fame tracking: player.fame is the authority
  s.player = { ...s.player, fame: (s.player.fame || 0) + playerFameGain };
  s.fame = s.player.fame; 
  s.crowdMood = computeCrowdMood(s.arenaHistory);
  s.moodHistory = [...(s.moodHistory || []).slice(-19), { week: s.week, mood: s.crowdMood }];

  const weekFights = getFightsForWeek(s.arenaHistory, s.week);
  const gazetteSeed = s.week * 9973 + 123;
  const gazetteRng = new SeededRNGService(gazetteSeed);
  s.gazettes = [...(s.gazettes || []), generateWeeklyGazette(weekFights, s.crowdMood, s.week, s.graveyard, s.arenaHistory, gazetteRng)];
  const rng = new SeededRNGService(s.week * 13);
  s.rivalries = updateRivalriesFromBouts(s.rivalries || [], weekFights, s.week, rng);
  NewsletterFeed.closeWeekToIssue(s.week);
}
