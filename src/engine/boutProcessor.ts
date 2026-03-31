import { GameState, Warrior, FightOutcome, FightSummary } from "@/types/game";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { computeCrowdMood, getMoodModifiers } from "@/engine/crowdMood";
import { killWarrior } from "@/state/gameStore";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { StyleRollups } from "@/engine/stats/styleRollups";
import { commentatorFor, blurb, type AnnounceTone } from "@/lore/AnnouncerAI";
import { rollForInjury } from "@/engine/injuries";
import { isFightReady } from "@/engine/warriorStatus";
import { calculateXP, applyXP } from "@/engine/progression";
import { checkDiscovery } from "@/engine/favorites";
import { generateMatchCard, addRestState, addMatchRecord, updateRivalriesFromBouts } from "@/engine/matchmaking";
import { generateFightNarrative, generateWeeklyGazette } from "@/engine/gazetteNarrative";
import { getFightsForWeek } from "@/engine/core/historyUtils";
import { LoreArchive } from "@/lore/LoreArchive";
import { engineEventBus } from "@/engine/core/EventBus";
import { generateId } from "@/utils/idUtils";
import { updateEntityInList } from "@/utils/stateUtils";

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

/**
 * Encapsulates all state changes and events resulting from a single bout.
 */
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
    state.trainers
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

// ─── Internal Resolution Helpers ──────────────────────────────────────────

function applyRecords(s: GameState, wA: Warrior, wD: Warrior, outcome: FightOutcome, tags: string[], fameA: number, popA: number, fameD: number, popD: number, rivalStableId?: string): GameState {
  const updateW = (w: Warrior, f: number, p: number, win: boolean, kill: boolean) => ({
    ...w, 
    fame: Math.max(0, w.fame + f), 
    popularity: Math.max(0, w.popularity + p),
    career: { 
      ...w.career, 
      wins: w.career.wins + (win ? 1 : 0), 
      losses: w.career.losses + (!win ? 1 : 0), 
      kills: w.career.kills + (kill ? 1 : 0) 
    },
    flair: win && tags.includes("Flashy") ? Array.from(new Set([...w.flair, "Flashy"])) : w.flair,
  });

  s.roster = updateEntityInList(s.roster, wA.id, w => updateW(w, fameA, popA, outcome.winner === "A", outcome.winner === "A" && outcome.by === "Kill"));
  
  if (!rivalStableId) {
    s.roster = updateEntityInList(s.roster, wD.id, w => updateW(w, fameD, popD, outcome.winner === "D", outcome.winner === "D" && outcome.by === "Kill"));
  } else {
    s.rivals = (s.rivals || []).map(r => r.owner.id === rivalStableId 
      ? { ...r, roster: updateEntityInList(r.roster, wD.id, w => updateW(w, fameD, 0, outcome.winner === "D", outcome.winner === "D" && outcome.by === "Kill")) } 
      : r);
    s.matchHistory = addMatchRecord(s.matchHistory || [], wA.id, wD.id, rivalStableId, s.week);
  }
  
  return s;
}

function handleDeath(s: GameState, wA: Warrior, wD: Warrior, outcome: FightOutcome, week: number, tags: string[], rivalStableId?: string) {
  if (outcome.by !== "Kill") return { s, death: false, playerDeath: false, deathNames: [] };
  
  const victim = outcome.winner === "A" ? wD : wA;
  const isPlayerVictim = outcome.winner !== "A";
  
  const boutId = generateId();
  const narrative = generateFightNarrative({ 
    id: boutId, week, a: wA.name, d: wD.name, winner: outcome.winner, by: outcome.by, 
    styleA: wA.style, styleD: wD.style, transcript: [], title: `${wA.name} vs ${wD.name}`, phase: "resolution" 
  } as any, s.crowdMood);
  
  const event = { boutId, killerId: outcome.winner === "A" ? wA.id : wD.id, deathSummary: narrative, memorialTags: tags };

  const nextS = killWarrior(s, victim.id, outcome.winner === "A" ? wA.name : wD.name, "Arena Combat", event);
  
  if (isPlayerVictim) {
    nextS.fame = Math.max(0, (nextS.fame || 0) + 5);
    if (nextS.player) nextS.player.fame = Math.max(0, (nextS.player.fame || 0) + 5);
  }
  
  const deathSummary: FightSummary = { 
    id: boutId, week, winner: outcome.winner, by: outcome.by, a: wA.name, d: wD.name, 
    styleA: wA.style, styleD: wD.style, isDeathEvent: true, deathEventData: event, createdAt: new Date().toISOString() 
  } as any;
  
  nextS.arenaHistory = [...nextS.arenaHistory, deathSummary];
  nextS.newsletter = [...nextS.newsletter, { week, title: "Arena Obituary", items: [narrative] }];
  
  // Decoupled notification
  engineEventBus.emit({ 
    type: 'WARRIOR_KILLED', 
    payload: { warriorId: victim.id, killerName: outcome.winner === "A" ? wA.name : wD.name, narrative } 
  });

  if (rivalStableId && outcome.winner === "A") { // Player killed a rival
    nextS.rivals = (nextS.rivals || []).map(r => r.owner.id === rivalStableId 
      ? { ...r, roster: r.roster.filter(w => w.id !== wD.id) }
      : r);
  }

  return { s: nextS, death: true, playerDeath: isPlayerVictim, deathNames: [victim.name] };
}

function handleInjuries(s: GameState, wA: Warrior, wD: Warrior, outcome: FightOutcome, week: number, rivalStableId?: string) {
  let injured = false; const names: string[] = [];
  
  if (outcome.by === "KO") {
    s.restStates = addRestState(s.restStates || [], outcome.winner === "A" ? wD.id : wA.id, "KO", week);
  }
  
  const injA = rollForInjury(wA, outcome, "A");
  if (injA) { 
    injured = true; 
    names.push(wA.name); 
    s.roster = updateEntityInList(s.roster, wA.id, w => ({ ...w, injuries: [...(w.injuries || []), injA] }));
  }
  
  if (!rivalStableId) {
    const injD = rollForInjury(wD, outcome, "D");
    if (injD) { 
        injured = true; 
        names.push(wD.name); 
        s.roster = updateEntityInList(s.roster, wD.id, w => ({ ...w, injuries: [...(w.injuries || []), injD] }));
    }
  }
  return { s, injured, injuredNames: names };
}

function handleProgressions(s: GameState, wA: Warrior, wD: Warrior, outcome: FightOutcome, tags: string[], week: number, rivalStableId?: string): GameState {
  // XP
  s.roster = updateEntityInList(s.roster, wA.id, w => applyXP(w, calculateXP(outcome, "A", tags)).warrior);
  
  if (!rivalStableId) {
    s.roster = updateEntityInList(s.roster, wD.id, w => applyXP(w, calculateXP(outcome, "D", tags)).warrior);
  }
  
  // Favorites Discovery
  [wA, !rivalStableId ? wD : null].forEach(w => {
    if (!w) return;
    const disc = checkDiscovery(w);
    if (disc.updated) {
      s.roster = updateEntityInList(s.roster, w.id, rw => ({ ...rw, favorites: w.favorites }));
      if (disc.hints.length > 0) {
        s.newsletter = [...s.newsletter, { week, title: "Training Insight", items: disc.hints }];
      }
    }
  });

  // Upset / Giant Killer Flair
  if (outcome.winner) {
    const winner = outcome.winner === "A" ? wA : wD;
    const loser = outcome.winner === "A" ? wD : wA;
    if (loser.fame >= winner.fame + 10 && loser.fame >= winner.fame * 2 && !winner.flair.includes("Giant Killer")) {
       s.roster = updateEntityInList(s.roster, winner.id, rw => ({ ...rw, flair: [...rw.flair, "Giant Killer"] }));
    }
  }
  return s;
}

function handleReporting(wA: Warrior, wD: Warrior, outcome: FightOutcome, tags: string[], fA: number, pA: number, fD: number, pD: number, week: number, rivalStableId?: string, isRivalry?: boolean) {
  const boutId = generateId();
  const summary: FightSummary = { 
    id: boutId, week, title: `${wA.name} vs ${wD.name}`, a: wA.name, d: wD.name, 
    winner: outcome.winner, by: outcome.by, styleA: wA.style, styleD: wD.style, 
    flashyTags: tags, fameDeltaA: fA, fameDeltaD: fD, fameA: wA.fame, fameD: wD.fame, 
    popularityDeltaA: pA, popularityDeltaD: pD, transcript: outcome.log.map(e => e.text), 
    isRivalry, createdAt: new Date().toISOString() 
  };
  
  // Side effects (decoupled via direct calls for now, but following service patterns)
  StyleRollups.addFight({ week, styleA: wA.style, styleD: wD.style, winner: outcome.winner, by: outcome.by });
  ArenaHistory.append(summary);
  LoreArchive.signalFight(summary);
  NewsletterFeed.appendFightResult({ summary, transcript: summary.transcript });

  const tone: AnnounceTone = outcome.by === "Kill" ? "grim" : (tags.includes("Flashy") ? "hype" : "neutral");
  const announcement = (outcome.by === "Kill" || outcome.by === "KO") 
    ? commentatorFor(outcome.by) 
    : blurb({ tone, winner: outcome.winner === "A" ? wA.name : wD.name, loser: outcome.winner === "A" ? wD.name : wA.name, by: outcome.by ?? undefined });

  return { summary, announcement };
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
