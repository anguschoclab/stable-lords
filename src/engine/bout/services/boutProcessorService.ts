import { GameState, Warrior, FightOutcome } from "@/types/game";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { computeCrowdMood, getMoodModifiers } from "@/engine/crowdMood";
import { updateRivalriesFromBouts } from "@/engine/matchmaking/rivalryLogic";
import { generateWeeklyGazette } from "@/engine/gazetteNarrative";
import { getFightsForWeek } from "@/engine/core/historyUtils";
import { engineEventBus } from "@/engine/core/EventBus";
import { NewsletterFeed } from "@/engine/newsletter/feed";

import { applyRecords } from "../recordHandler";
import { handleDeath } from "../mortalityHandler";
import { handleInjuries } from "../injuryHandler";
import { handleProgressions } from "../progressionHandler";
import { handleReporting } from "../reportingHandler";
import { generatePairings, BoutPairing } from "../core/pairings";

export interface BoutResult { a: Warrior; d: Warrior; outcome: FightOutcome; announcement?: string; isRivalry: boolean; rivalStable?: string; }
export interface BoutImpact { state: GameState; result: BoutResult; stats: { death: boolean; playerDeath: boolean; injured: boolean; deathNames: string[]; injuredNames: string[]; }; }
export interface WeekBoutSummary { bouts: number; deaths: number; injuries: number; deathNames: string[]; injuryNames: string[]; hadPlayerDeath: boolean; hadRivalryEscalation: boolean; }
export interface BoutContext { warriorMap: Map<string, Warrior>; warrior: Warrior; opponent: Warrior; isRivalry: boolean; rivalStable?: string; rivalStableId?: string; moodMods: ReturnType<typeof getMoodModifiers>; week: number; playerId: string; }

export function resolveBout(state: GameState, ctx: BoutContext): BoutImpact {
  const { warrior, opponent, isRivalry, rivalStable, rivalStableId, moodMods, week, warriorMap } = ctx;
  const currentW = warriorMap.get(warrior.id);
  const currentO = warriorMap.get(opponent.id);

  if (!currentW || currentW.status !== "Active" || !currentO) return { state, result: { a: warrior, d: opponent, outcome: { winner: null, by: "Draw", minutes: 0, log: [] } as any, isRivalry, rivalStable }, stats: { death: false, playerDeath: false, injured: false, deathNames: [], injuredNames: [] } };

  const outcome = simulateFight(currentW.plan ?? defaultPlanForWarrior(currentW), currentO.plan ?? defaultPlanForWarrior(currentO), currentW, currentO, undefined, state.trainers);
  const tags = outcome.post?.tags ?? [];
  const rawFameA = fameFromTags(outcome.winner === "A" ? tags : []);
  const rawFameD = fameFromTags(outcome.winner === "D" ? tags : []);

  const fameA = Math.round(rawFameA.fame * moodMods.fameMultiplier * (isRivalry ? 2 : 1));
  const popA = Math.round(rawFameA.pop * moodMods.popMultiplier);
  const fameD = Math.round(rawFameD.fame * moodMods.fameMultiplier);
  const popD = Math.round(rawFameD.pop * moodMods.popMultiplier);

  let s = { ...state };
  s = applyRecords(s, currentW, currentO, outcome, tags, fameA, popA, fameD, popD, rivalStableId);
  const deathRes = handleDeath(s, currentW, currentO, outcome, week, tags, rivalStableId);
  s = deathRes.s;
  const injuryRes = handleInjuries(s, currentW, currentO, outcome, week, rivalStableId);
  s = injuryRes.s;
  s = handleProgressions(s, currentW, currentO, outcome, tags, week, rivalStableId);

  const { summary, announcement } = handleReporting(currentW, currentO, outcome, tags, fameA, popA, fameD, popD, week, rivalStableId, isRivalry);
  s.arenaHistory = [...s.arenaHistory, summary];
  engineEventBus.emit({ type: 'BOUT_COMPLETED', payload: { summary, transcript: summary.transcript } });

  return { state: s, result: { a: warrior, d: opponent, outcome, announcement, isRivalry, rivalStable }, stats: { death: deathRes.death, playerDeath: deathRes.playerDeath, injured: injuryRes.injured, deathNames: deathRes.deathNames, injuredNames: injuryRes.injuredNames } };
}

function processSingleBout(s: GameState, p: BoutPairing, moodMods: any, warriorMap: Map<string, Warrior>): BoutImpact {
  return resolveBout(s, { warrior: p.a, opponent: p.d, isRivalry: p.isRivalry, rivalStable: p.rivalStable, rivalStableId: p.rivalStableId, moodMods, week: s.week, playerId: s.player.id, warriorMap });
}

function accumulateWeekStats(summary: WeekBoutSummary, res: BoutImpact) {
  summary.bouts++;
  if (res.stats.death) { summary.deaths += res.stats.deathNames.length; summary.deathNames.push(...res.stats.deathNames); }
  if (res.stats.playerDeath) summary.hadPlayerDeath = true;
  if (res.stats.injured) { summary.injuries += res.stats.injuredNames.length; summary.injuryNames.push(...res.stats.injuredNames); }
}

function finalizeWeekSideEffects(s: GameState, results: BoutResult[]) {
  const playerFameGain = results.filter(r => r.outcome.winner === "A").length;
  s.player = { ...s.player, fame: (s.player.fame || 0) + playerFameGain };
  s.fame = (s.fame || 0) + playerFameGain;
  s.crowdMood = computeCrowdMood(s.arenaHistory);
  s.moodHistory = [...(s.moodHistory || []).slice(-19), { week: s.week, mood: s.crowdMood }];

  const weekFights = getFightsForWeek(s.arenaHistory, s.week);
  s.gazettes = [...(s.gazettes || []), generateWeeklyGazette(weekFights, s.crowdMood, s.week, s.graveyard, s.arenaHistory)];
  s.rivalries = updateRivalriesFromBouts(s.rivalries || [], weekFights, s.week);
  NewsletterFeed.closeWeekToIssue(s.week);
}

export function processWeekBouts(state: GameState): { state: GameState; results: BoutResult[]; summary: WeekBoutSummary } {
  const warriorMap = new Map<string, Warrior>();
  state.roster.forEach(w => warriorMap.set(w.id, w));
  (state.rivals || []).forEach(r => r.roster.forEach(w => warriorMap.set(w.id, w)));

  const pairings = generatePairings(state);
  const moodMods = getMoodModifiers(state.crowdMood as any);

  let s = { ...state };
  const results: BoutResult[] = [];
  const summary: WeekBoutSummary = { bouts: 0, deaths: 0, injuries: 0, deathNames: [], injuryNames: [], hadPlayerDeath: false, hadRivalryEscalation: false };

  pairings.forEach(p => {
    const res = processSingleBout(s, p, moodMods, warriorMap);
    s = res.state;
    results.push(res.result);
    accumulateWeekStats(summary, res);

    // Redundant map refresh removed for performance
  });

  finalizeWeekSideEffects(s, results);
  return { state: s, results, summary };
}
