/**
 * Bout Processor — shared fight resolution logic for RunRound and Autosim.
 *
 * Extracts the duplicated ~300-line bout processing pipeline into a single
 * pure-function module. Both manual round simulation and autosim delegate here.
 */
import type { GameState, FightSummary, Warrior } from "@/types/game";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { computeCrowdMood, getMoodModifiers } from "@/engine/crowdMood";
import { killWarrior } from "@/state/gameStore";
import { LoreArchive } from "@/lore/LoreArchive";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { StyleRollups } from "@/engine/stats/styleRollups";
import { commentatorFor, recapLine, blurb, type AnnounceTone } from "@/lore/AnnouncerAI";
import { rollForInjury, isTooInjuredToFight, type Injury } from "@/engine/injuries";
import { calculateXP, applyXP } from "@/engine/progression";
import {
  generateMatchCard,
  addRestState,
  addMatchRecord,
  detectRivalries,
} from "@/engine/matchmaking";

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
  outcome: ReturnType<typeof simulateFight>;
  announcement?: string;
  isRivalry: boolean;
  rivalStable?: string;
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

// ─── Pairing Generation ───────────────────────────────────────────────────

/**
 * Generate pairings for the current week — cross-stable if rivals exist,
 * otherwise internal matchmaking.
 */
export function generatePairings(state: GameState): BoutPairing[] {
  const matchCard = generateMatchCard(state);
  const pairings: BoutPairing[] = [];

  if (matchCard.length > 0) {
    for (const mp of matchCard) {
      pairings.push({
        a: mp.playerWarrior,
        d: mp.rivalWarrior,
        isRivalry: mp.isRivalryBout,
        rivalStable: mp.rivalStable.owner.stableName,
        rivalStableId: mp.rivalStable.owner.id,
      });
    }
  } else {
    // Fallback: internal matchmaking
    const activeWarriors = state.roster.filter(w => {
      if (w.status !== "Active") return false;
      const injObjs = (w.injuries || []).filter((i): i is Injury => typeof i !== "string");
      return !isTooInjuredToFight(injObjs);
    });
    const paired = new Set<string>();
    for (let i = 0; i < activeWarriors.length; i++) {
      if (paired.has(activeWarriors[i].id)) continue;
      for (let j = i + 1; j < activeWarriors.length; j++) {
        if (paired.has(activeWarriors[j].id)) continue;
        // Guard: stablemates cannot fight each other
        const sameStable = (activeWarriors[i].stableId ?? "") === (activeWarriors[j].stableId ?? "") && !!(activeWarriors[i].stableId);
        if (sameStable) continue;
        pairings.push({ a: activeWarriors[i], d: activeWarriors[j], isRivalry: false });
        paired.add(activeWarriors[i].id);
        paired.add(activeWarriors[j].id);
        break;
      }
    }
  }

  return pairings;
}

// ─── Single Bout Processing ───────────────────────────────────────────────

interface BoutContext {
  warrior: Warrior;
  opponent: Warrior;
  isRivalry: boolean;
  rivalStable?: string;
  rivalStableId?: string;
  moodMods: ReturnType<typeof getMoodModifiers>;
  week: number;
  playerId: string;
  playerStableName: string;
}

/**
 * Resolve a single bout and return the updated state + result.
 * Handles: combat sim, record updates, death, injuries, XP, match history,
 * fight summary, side-effect singletons (StyleMeter, ArenaHistory, etc.).
 */
function resolveBout(
  state: GameState,
  ctx: BoutContext
): { state: GameState; result: BoutResult; death: boolean; playerDeath: boolean; injured: boolean; injuredNames: string[]; deathNames: string[] } {
  const { warrior, opponent, isRivalry, rivalStable, rivalStableId, moodMods, week, playerId } = ctx;

  // Ensure both combatants are still active
  const currentW = state.roster.find(w => w.id === warrior.id);
  let currentO: Warrior | undefined;
  if (rivalStableId) {
    for (const r of state.rivals || []) {
      currentO = r.roster.find(w => w.id === opponent.id);
      if (currentO) break;
    }
  } else {
    currentO = state.roster.find(w => w.id === opponent.id);
  }

  // Skip if either is unavailable
  if (!currentW || currentW.status !== "Active" || !currentO) {
    return {
      state,
      result: { a: warrior, d: opponent, outcome: { winner: null, by: "Draw", minutes: 0, log: [] }, isRivalry, rivalStable },
      death: false, playerDeath: false, injured: false, injuredNames: [], deathNames: [],
    };
  }

  const planA = currentW.plan ?? defaultPlanForWarrior(currentW);
  const planD = currentO.plan ?? defaultPlanForWarrior(currentO);
  const outcome = simulateFight(planA, planD, currentW, currentO, undefined, state.trainers);

  const tags = outcome.post?.tags ?? [];
  const rawFameA = fameFromTags(outcome.winner === "A" ? tags : []);
  const rawFameD = fameFromTags(outcome.winner === "D" ? tags : []);
  const rivalryMult = isRivalry ? 2 : 1;
  const fameA = Math.round(rawFameA.fame * moodMods.fameMultiplier * rivalryMult);
  const popA = Math.round(rawFameA.pop * moodMods.popMultiplier);
  const fameD = Math.round(rawFameD.fame * moodMods.fameMultiplier);
  const popD = Math.round(rawFameD.pop * moodMods.popMultiplier);

  let s = { ...state };
  let death = false;
  let playerDeath = false;
  let injured = false;
  const injuredNames: string[] = [];
  const deathNames: string[] = [];

  // ── Batch roster update: records, fame, flair ──
  s.roster = s.roster.map(w => {
    if (w.id === warrior.id) {
      const won = outcome.winner === "A";
      const killed = outcome.by === "Kill" && won;
      return {
        ...w,
        fame: Math.max(0, w.fame + fameA),
        popularity: Math.max(0, w.popularity + popA),
        career: {
          ...w.career,
          wins: w.career.wins + (won ? 1 : 0),
          losses: w.career.losses + (outcome.winner === "D" ? 1 : 0),
          kills: w.career.kills + (killed ? 1 : 0),
        },
        flair: won && tags.includes("Flashy")
          ? Array.from(new Set([...w.flair, "Flashy"]))
          : w.flair,
      };
    }
    if (!rivalStableId && w.id === opponent.id) {
      const won = outcome.winner === "D";
      const killed = outcome.by === "Kill" && won;
      return {
        ...w,
        fame: Math.max(0, w.fame + fameD),
        popularity: Math.max(0, w.popularity + popD),
        career: {
          ...w.career,
          wins: w.career.wins + (won ? 1 : 0),
          losses: w.career.losses + (outcome.winner === "A" ? 1 : 0),
          kills: w.career.kills + (killed ? 1 : 0),
        },
      };
    }
    return w;
  });

  // ── Rival warrior records ──
  if (rivalStableId) {
    s.rivals = (s.rivals || []).map(r => ({
      ...r,
      roster: r.roster.map(w => {
        if (w.id === opponent.id) {
          const won = outcome.winner === "D";
          const killed = outcome.by === "Kill" && won;
          return {
            ...w,
            fame: Math.max(0, w.fame + fameD),
            career: {
              ...w.career,
              wins: w.career.wins + (won ? 1 : 0),
              losses: w.career.losses + (outcome.winner === "A" ? 1 : 0),
              kills: w.career.kills + (killed ? 1 : 0),
            },
          };
        }
        return w;
      }),
    }));
  }

  // ── Death ──
  if (outcome.by === "Kill") {
    death = true;
    if (outcome.winner === "A") {
      deathNames.push(opponent.name);
      if (rivalStableId) {
        s.rivals = (s.rivals || []).map(r => ({ ...r, roster: r.roster.filter(w => w.id !== opponent.id) }));
        s.rivalries = detectRivalries(s.rivalries || [], playerId, rivalStableId, warrior.name, opponent.name, week);
      } else {
        s = killWarrior(s, opponent.id, warrior.name, "Killed in arena combat");
      }
    } else {
      playerDeath = true;
      deathNames.push(warrior.name);
      s = killWarrior(s, warrior.id, opponent.name, "Killed in arena combat");
      if (rivalStableId) {
        s.rivalries = detectRivalries(s.rivalries || [], rivalStableId, playerId, opponent.name, warrior.name, week);
      }
    }
  }

  // ── Rest states (KO) ──
  if (outcome.by === "KO") {
    const loserId = outcome.winner === "A" ? opponent.id : warrior.id;
    s.restStates = addRestState(s.restStates || [], loserId, "KO", week);
  }

  // ── Injuries ──
  const injA = rollForInjury(warrior, outcome, "A");
  if (injA) {
    injured = true;
    injuredNames.push(warrior.name);
    s.roster = s.roster.map(w => w.id === warrior.id ? { ...w, injuries: [...(w.injuries || []), injA as any] } : w);
  }
  if (!rivalStableId) {
    const injD = rollForInjury(opponent, outcome, "D");
    if (injD) {
      injured = true;
      injuredNames.push(opponent.name);
      s.roster = s.roster.map(w => w.id === opponent.id ? { ...w, injuries: [...(w.injuries || []), injD as any] } : w);
    }
  }

  // ── XP ──
  const xpA = calculateXP(outcome, "A", tags);
  s.roster = s.roster.map(w => w.id === warrior.id ? applyXP(w, xpA).warrior : w);
  if (!rivalStableId) {
    const xpD = calculateXP(outcome, "D", tags);
    s.roster = s.roster.map(w => w.id === opponent.id ? applyXP(w, xpD).warrior : w);
  }

  // ── Match history ──
  if (rivalStableId) {
    s.matchHistory = addMatchRecord(s.matchHistory || [], warrior.id, opponent.id, rivalStableId, week);
  }

  // ── Giant Killer flair ──
  if (outcome.winner) {
    const winnerW = outcome.winner === "A" ? warrior : opponent;
    const loserW = outcome.winner === "A" ? opponent : warrior;
    if (loserW.fame >= winnerW.fame + 10 && loserW.fame >= winnerW.fame * 2) {
      const upsetCount = s.arenaHistory.filter(af => {
        if (af.fameA == null || af.fameD == null || !af.winner) return false;
        const wName = af.winner === "A" ? af.a : af.d;
        if (wName !== winnerW.name) return false;
        const wFame = af.winner === "A" ? af.fameA : af.fameD;
        const lFame = af.winner === "A" ? af.fameD : af.fameA;
        return lFame >= wFame + 10 && lFame >= wFame * 2;
      }).length;
      if (upsetCount >= 3 && !winnerW.flair.includes("Giant Killer")) {
        s.roster = s.roster.map(w => w.id === winnerW.id ? { ...w, flair: [...w.flair, "Giant Killer"] } : w);
      }
    }
  }

  // ── Fight summary ──
  const fightSummary: FightSummary = {
    id: `fight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    week,
    title: `${warrior.name} vs ${opponent.name}`,
    a: warrior.name,
    d: opponent.name,
    winner: outcome.winner,
    by: outcome.by,
    styleA: warrior.style,
    styleD: opponent.style,
    flashyTags: tags,
    fameDeltaA: fameA,
    fameDeltaD: fameD,
    fameA: warrior.fame,
    fameD: opponent.fame,
    popularityDeltaA: popA,
    popularityDeltaD: popD,
    transcript: outcome.log.map(e => e.text),
    createdAt: new Date().toISOString(),
  };
  s.arenaHistory = [...s.arenaHistory, fightSummary];

  // ── Side-effect singletons ──
  StyleRollups.addFight({ week, styleA: warrior.style, styleD: opponent.style, winner: outcome.winner, by: outcome.by });
  ArenaHistory.append(fightSummary);
  LoreArchive.signalFight(fightSummary);
  NewsletterFeed.appendFightResult({ summary: fightSummary, transcript: outcome.log.map(e => e.text) });

  // ── Announcement (commentator + AnnouncerAI blurb) ──
  let announcement: string | undefined;
  const announceTone: AnnounceTone = outcome.by === "Kill" ? "grim" : (tags.includes("Flashy") || tags.includes("Comeback") ? "hype" : "neutral");
  const announcerBlurb = blurb({
    tone: announceTone,
    winner: outcome.winner === "A" ? warrior.name : outcome.winner === "D" ? opponent.name : undefined,
    loser: outcome.winner === "A" ? opponent.name : outcome.winner === "D" ? warrior.name : undefined,
    by: outcome.by ?? undefined,
  });

  if (outcome.by === "Kill") announcement = commentatorFor("Kill");
  else if (outcome.by === "KO") announcement = commentatorFor("KO");
  else if (tags.includes("Flashy")) announcement = commentatorFor("Flashy");
  else if (tags.includes("Comeback")) announcement = commentatorFor("Upset");
  else if (outcome.winner) {
    const winnerName = outcome.winner === "A" ? warrior.name : opponent.name;
    const loserName = outcome.winner === "A" ? opponent.name : warrior.name;
    announcement = recapLine(winnerName, loserName, outcome.minutes);
  }

  // Append announcer flavour to the fight summary transcript
  if (announcerBlurb) {
    fightSummary.transcript = [...fightSummary.transcript, `🎙️ ${announcerBlurb}`];
  }

  return {
    state: s,
    result: { a: warrior, d: opponent, outcome, announcement, isRivalry, rivalStable },
    death, playerDeath, injured, injuredNames, deathNames,
  };
}

// ─── Full Week Processing ─────────────────────────────────────────────────

export interface ProcessedWeek {
  state: GameState;
  results: BoutResult[];
  summary: WeekBoutSummary;
}

/**
 * Process all bouts for a week. This is the single source of truth for bout
 * resolution — used by both RunRound (manual) and Autosim.
 */
export function processWeekBouts(state: GameState): ProcessedWeek {
  const pairings = generatePairings(state);
  const moodMods = getMoodModifiers(state.crowdMood as any);
  const prevRivalries = (state.rivalries || []).map(r => r.intensity);

  let s = { ...state };
  const results: BoutResult[] = [];
  const summary: WeekBoutSummary = {
    bouts: 0, deaths: 0, injuries: 0,
    deathNames: [], injuryNames: [],
    hadPlayerDeath: false, hadRivalryEscalation: false,
  };

  for (const pairing of pairings) {
    const boutOut = resolveBout(s, {
      warrior: pairing.a,
      opponent: pairing.d,
      isRivalry: pairing.isRivalry,
      rivalStable: pairing.rivalStable,
      rivalStableId: pairing.rivalStableId,
      moodMods,
      week: state.week,
      playerId: state.player.id,
      playerStableName: state.player.stableName,
    });

    s = boutOut.state;
    results.push(boutOut.result);
    summary.bouts++;
    if (boutOut.death) { summary.deaths += boutOut.deathNames.length; summary.deathNames.push(...boutOut.deathNames); }
    if (boutOut.playerDeath) summary.hadPlayerDeath = true;
    if (boutOut.injured) { summary.injuries += boutOut.injuredNames.length; summary.injuryNames.push(...boutOut.injuredNames); }
  }

  // ── Newsletter highlights ──
  const highlights: string[] = [];

  // Rivalry coverage
  const rivalryBouts = results.filter(r => r.isRivalry && r.rivalStable);
  if (rivalryBouts.length > 0) {
    const templates = [
      (p: string, r: string, st: string) => `🔥 RIVALRY BOUT: The blood feud between ${state.player.stableName} and ${st} continues — ${p} faced ${r}!`,
      (p: string, r: string, st: string) => `⚔️ VENDETTA: ${p} stepped into the arena against ${r} of ${st}!`,
      (p: string, r: string, st: string) => `🏟️ GRUDGE MATCH: ${state.player.stableName} vs ${st} — ${p} clashed with ${r}!`,
    ];
    for (const r of rivalryBouts) {
      highlights.push(templates[Math.floor(Math.random() * templates.length)](r.a.name, r.d.name, r.rivalStable!));
      if (r.outcome.by === "Kill") {
        const killer = r.outcome.winner === "A" ? r.a.name : r.d.name;
        const victim = r.outcome.winner === "A" ? r.d.name : r.a.name;
        highlights.push(`☠️ BLOOD FEUD ESCALATES: ${killer} slew ${victim}!`);
      }
    }
  }

  for (const r of results) {
    const winner = r.outcome.winner === "A" ? r.a.name : r.outcome.winner === "D" ? r.d.name : "Draw";
    const deathNote = r.outcome.by === "Kill" ? " ☠️" : "";
    const rivalTag = r.rivalStable ? ` (vs ${r.rivalStable})` : "";
    highlights.push(`${r.a.name} vs ${r.d.name}${rivalTag}: ${winner} ${r.outcome.by ? `by ${r.outcome.by}` : "(Draw)"}${deathNote}`);
  }

  // Top mover
  const fameChanges = new Map<string, number>();
  for (const r of results) {
    if (r.outcome.winner === "A") fameChanges.set(r.a.name, (fameChanges.get(r.a.name) ?? 0) + (r.outcome.post?.tags?.includes("Kill") ? 3 : 1));
    if (r.outcome.winner === "D" && !r.rivalStable) fameChanges.set(r.d.name, (fameChanges.get(r.d.name) ?? 0) + (r.outcome.post?.tags?.includes("Kill") ? 3 : 1));
  }
  const topMover = [...fameChanges.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topMover) highlights.push(`⭐ Top Mover: ${topMover[0]} (+${topMover[1]} fame)`);

  s.newsletter = [...s.newsletter, { week: state.week, title: "Arena Gazette", items: highlights }];

  // ── Stable fame ──
  let stableFameDelta = 0;
  for (const r of results) {
    if (r.outcome.winner === "A") stableFameDelta += r.outcome.post?.tags?.includes("Kill") ? 3 : 1;
  }
  s.fame = (s.fame ?? 0) + stableFameDelta;
  s.player = { ...s.player, fame: (s.player.fame ?? 0) + stableFameDelta };

  // ── Crowd mood ──
  s.crowdMood = computeCrowdMood(s.arenaHistory);

  // ── Fight of the week ──
  if (results.length > 0) {
    let bestIdx = 0, bestScore = -1;
    results.forEach((r, i) => {
      let score = 0;
      const t = r.outcome.post?.tags ?? [];
      if (t.includes("Kill")) score += 5;
      if (t.includes("KO")) score += 3;
      if (t.includes("Flashy")) score += 2;
      if (t.includes("Comeback")) score += 4;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });
    if (bestScore > 0) {
      const bestFight = s.arenaHistory[s.arenaHistory.length - results.length + bestIdx];
      if (bestFight) LoreArchive.markFightOfWeek(state.week, bestFight.id);
    }
  }

  NewsletterFeed.closeWeekToIssue(state.week);

  // ── Rivalry escalation detection ──
  const newRivalries = s.rivalries || [];
  summary.hadRivalryEscalation = newRivalries.some((r, i) => {
    const old = prevRivalries[i] ?? 0;
    return r.intensity > old && r.intensity >= 4;
  });

  return { state: s, results, summary };
}

// ─── Fame/Popularity Bump Helpers ─────────────────────────────────────────
// (Migrated from src/state/savePatches.ts)

export type FamePopBump = {
  fameDelta?: number;
  popDelta?: number;
  reason?: string;
};

export function applyFamePopBump(
  fame: number,
  pop: number,
  bump: FamePopBump
): { fame: number; pop: number } {
  return {
    fame: Math.max(0, Math.min(100, fame + (bump.fameDelta ?? 0))),
    pop: Math.max(0, Math.min(100, pop + (bump.popDelta ?? 0))),
  };
}
