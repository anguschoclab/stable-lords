import { GameState, Warrior, FightOutcome } from "@/types/game";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { computeCrowdMood, getMoodModifiers } from "@/engine/crowdMood";
import { isFightReady } from "@/engine/warriorStatus";
import { generateMatchCard, addMatchRecord, updateRivalriesFromBouts } from "@/engine/matchmaking";
import { generateWeeklyGazette } from "@/engine/gazetteNarrative";
import { getFightsForWeek } from "@/engine/core/historyUtils";
import { engineEventBus } from "@/engine/core/EventBus";
import { NewsletterFeed } from "@/engine/newsletter/feed";

// Extracted Handlers
import { applyRecords } from "./bout/recordHandler";
import { handleDeath } from "./bout/mortalityHandler";
import { handleInjuries } from "./bout/injuryHandler";
import { handleProgressions } from "./bout/progressionHandler";
import { handleReporting } from "./bout/reportingHandler";

// ─── Types ────────────────────────────────────────────────────────────────

export interface BoutPairing {
  a: Warrior;
  d: Warrior;
  isRivalry: boolean;
  rivalStable?: string;
  rivalStableId?: string;
}

export interface BoutResult {
  a: Warrior;
  d: Warrior;
  outcome: FightOutcome;
  announcement?: string;
  isRivalry: boolean;
  rivalStable?: string;
}

export interface BoutImpact {
  state: GameState;
  result: BoutResult;
  stats: {
    death: boolean;
    playerDeath: boolean;
    injured: boolean;
    deathNames: string[];
    injuredNames: string[];
  };
}

export interface WeekBoutSummary {
  bouts: number;
  deaths: number;
  injuries: number;
  deathNames: string[];
  injuryNames: string[];
  hadPlayerDeath: boolean;
  hadRivalryEscalation: boolean;
}

interface BoutContext {
  warriorMap: Map<string, Warrior>;
  warrior: Warrior;
  opponent: Warrior;
  isRivalry: boolean;
  rivalStable?: string;
  rivalStableId?: string;
  moodMods: ReturnType<typeof getMoodModifiers>;
  week: number;
  playerId: string;
}

// ─── Pairing Generation ───────────────────────────────────────────────────

export function generatePairings(state: GameState): BoutPairing[] {
  const matchCard = generateMatchCard(state);
  if (matchCard.length > 0) {
    return matchCard.map(mp => ({
      a: mp.playerWarrior,
      d: mp.rivalWarrior,
      isRivalry: mp.isRivalryBout,
      rivalStable: mp.rivalStable.owner.stableName,
      rivalStableId: mp.rivalStable.owner.id,
    }));
  }

  // Fallback: internal matchmaking (skip stablemates)
  const activeWarriors = state.roster.filter(w => isFightReady(w));
  const pairings: BoutPairing[] = [];
  const pairedIds = new Set<string>();
  for (let i = 0; i < activeWarriors.length; i++) {
    if (pairedIds.has(activeWarriors[i].id)) continue;
    for (let j = i + 1; j < activeWarriors.length; j++) {
      if (pairedIds.has(activeWarriors[j].id) || activeWarriors[i].stableId === activeWarriors[j].stableId) continue;
      pairings.push({ a: activeWarriors[i], d: activeWarriors[j], isRivalry: false });
      pairedIds.add(activeWarriors[i].id);
      pairedIds.add(activeWarriors[j].id);
      break;
    }
  }
  return pairings;
}

// ─── Bout Resolution Core ──────────────────────────────────────────────

/**
 * Resolves a single bout, calculating outcome, fame, deaths, injuries, and progression.
 * Returns a BoutImpact object describing the changes.
 */
export function resolveBout(
  state: GameState,
  ctx: BoutContext
): BoutImpact {
  const { warrior, opponent, isRivalry, rivalStable, rivalStableId, moodMods, week, warriorMap } = ctx;
  const currentW = warriorMap.get(warrior.id);
  const currentO = warriorMap.get(opponent.id);

  if (!currentW || currentW.status !== "Active" || !currentO) {
    return { 
      state, 
      result: { a: warrior, d: opponent, outcome: { winner: null, by: "Draw", minutes: 0, log: [] } as any, isRivalry, rivalStable }, 
      stats: { death: false, playerDeath: false, injured: false, deathNames: [], injuredNames: [] } 
    };
  }

  const outcome = simulateFight(
    currentW.plan ?? defaultPlanForWarrior(currentW), 
    currentO.plan ?? defaultPlanForWarrior(currentO), 
    currentW, 
    currentO, 
    undefined, 
    state.trainers,
    state.weather
  );
  
  const tags = outcome.post?.tags ?? [];
  const rawFameA = fameFromTags(outcome.winner === "A" ? tags : []);
  const rawFameD = fameFromTags(outcome.winner === "D" ? tags : []);
  
  const fameA = Math.round(rawFameA.fame * moodMods.fameMultiplier * (isRivalry ? 2 : 1));
  const popA = Math.round(rawFameA.pop * moodMods.popMultiplier);
  const fameD = Math.round(rawFameD.fame * moodMods.fameMultiplier);
  const popD = Math.round(rawFameD.pop * moodMods.popMultiplier);

  let s = { ...state };
  
  // 1. Records & Statistics
  s = applyRecords(s, currentW, currentO, outcome, tags, fameA, popA, fameD, popD, rivalStableId);
  
  // 2. Mortality
  const deathRes = handleDeath(s, currentW, currentO, outcome, week, tags, rivalStableId);
  s = deathRes.s;

  // 3. Health & Injuries
  const injuryRes = handleInjuries(s, currentW, currentO, outcome, week, rivalStableId);
  s = injuryRes.s;

  // 4. Progression (XP, Discovery, Flairs)
  s = handleProgressions(s, currentW, currentO, outcome, tags, week, rivalStableId);
  
  // 5. Narrative & Side Effects
  const { summary, announcement } = handleReporting(currentW, currentO, outcome, tags, fameA, popA, fameD, popD, week, rivalStableId, isRivalry);
  s.arenaHistory = [...s.arenaHistory, summary];

  // Emit event for decoupled narrative subscribers
  engineEventBus.emit({ type: 'BOUT_COMPLETED', payload: { summary, transcript: summary.transcript } });

  return {
    state: s,
    result: { a: warrior, d: opponent, outcome, announcement, isRivalry, rivalStable },
    stats: { 
      death: deathRes.death, 
      playerDeath: deathRes.playerDeath, 
      injured: injuryRes.injured, 
      deathNames: deathRes.deathNames, 
      injuredNames: injuryRes.injuredNames 
    }
  };
}

// ─── Batch Week Processing ────────────────────────────────────────────────

export function processWeekBouts(state: GameState): { state: GameState; results: BoutResult[]; summary: WeekBoutSummary } {
  const warriorMap = new Map<string, Warrior>();
  state.roster.forEach(w => warriorMap.set(w.id, w));
  (state.rivals || []).forEach(r => r.roster.forEach(w => warriorMap.set(w.id, w)));

  const pairings = generatePairings(state);
  const moodMods = getMoodModifiers(state.crowdMood as any);
  
  let s = { ...state };
  const results: BoutResult[] = [];
  const summary: WeekBoutSummary = { 
    bouts: 0, deaths: 0, injuries: 0, deathNames: [], injuryNames: [], hadPlayerDeath: false, hadRivalryEscalation: false 
  };

  pairings.forEach(p => {
    const res = resolveBout(s, { 
      warrior: p.a, opponent: p.d, isRivalry: p.isRivalry, 
      rivalStable: p.rivalStable, rivalStableId: p.rivalStableId, 
      moodMods, week: s.week, playerId: s.player.id, warriorMap 
    });
    
    s = res.state;
    results.push(res.result);
    summary.bouts++;
    
    if (res.stats.death) { 
      summary.deaths += res.stats.deathNames.length; 
      summary.deathNames.push(...res.stats.deathNames); 
    }
    if (res.stats.playerDeath) summary.hadPlayerDeath = true;
    if (res.stats.injured) { 
      summary.injuries += res.stats.injuredNames.length; 
      summary.injuryNames.push(...res.stats.injuredNames); 
    }
    
    // Refresh warrior map for next pairing to ensure sequential processing uses latest stats
    s.roster.forEach(w => warriorMap.set(w.id, w));
    (s.rivals || []).forEach(r => r.roster.forEach(w => warriorMap.set(w.id, w)));
  });

  // Final reporting side-effects
  const playerFameGain = results.filter(r => r.outcome.winner === "A").length;
  s.player = { ...s.player, fame: (s.player.fame || 0) + playerFameGain };
  s.fame = (s.fame || 0) + playerFameGain;
  s.crowdMood = computeCrowdMood(s.arenaHistory);
  s.moodHistory = [...(s.moodHistory || []).slice(-19), { week: s.week, mood: s.crowdMood }];
  
  const weekFights = getFightsForWeek(s.arenaHistory, s.week);
  s.gazettes = [...(s.gazettes || []), generateWeeklyGazette(weekFights, s.crowdMood, s.week, s.graveyard, s.arenaHistory)];
  s.rivalries = updateRivalriesFromBouts(s.rivalries || [], weekFights, s.week);
  
  NewsletterFeed.closeWeekToIssue(s.week);
  
  return { state: s, results, summary };
}
