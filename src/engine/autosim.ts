/**
 * Autosim Engine — runs multiple weeks automatically with stop conditions.
 * Extracts the core "run one week of combat" logic from RunRound into a pure function.
 */
import type { GameState, FightSummary, Warrior } from "@/types/game";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { computeCrowdMood, getMoodModifiers } from "@/engine/crowdMood";
import { advanceWeek, killWarrior } from "@/state/gameStore";
import { generateMatchCard, addRestState, addMatchRecord, detectRivalries } from "@/engine/matchmaking";
import { rollForInjury, isTooInjuredToFight, type Injury } from "@/engine/injuries";
import { calculateXP, applyXP } from "@/engine/progression";
import { StyleMeter } from "@/metrics/StyleMeter";
import { LoreArchive } from "@/lore/LoreArchive";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { StyleRollups } from "@/engine/stats/styleRollups";
import { commentatorFor } from "@/ui/commentator";
import { recapLine } from "@/ui/fightVariety";

export type StopReason =
  | "death"
  | "player_death"
  | "injury"
  | "rivalry_escalation"
  | "tournament_week"
  | "max_weeks"
  | "no_pairings";

export interface AutosimResult {
  finalState: GameState;
  weeksSimmed: number;
  stopReason: StopReason;
  stopDetail: string;
  /** Summary of notable events per week */
  weekSummaries: WeekSummary[];
}

export interface WeekSummary {
  week: number;
  bouts: number;
  deaths: number;
  injuries: number;
  deathNames: string[];
  injuryNames: string[];
}

/**
 * Run a single week of combat and return the updated state + summary.
 * This is the pure-function extraction of RunRound's runWeek logic.
 */
function runOneWeek(state: GameState): {
  state: GameState;
  summary: WeekSummary;
  hadDeath: boolean;
  hadPlayerDeath: boolean;
  hadInjury: boolean;
  hadRivalryEscalation: boolean;
} {
  let updatedState = { ...state };
  const moodMods = getMoodModifiers(state.crowdMood as any);
  const matchCard = generateMatchCard(state);

  const pairings: { a: Warrior; d: Warrior; isRivalry: boolean; rivalStable?: string; rivalStableId?: string }[] = [];

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
    const activeWarriors = updatedState.roster.filter(w => {
      if (w.status !== "Active") return false;
      const injObjs = (w.injuries || []).filter((i): i is Injury => typeof i !== "string");
      return !isTooInjuredToFight(injObjs);
    });
    const paired = new Set<string>();
    for (let i = 0; i < activeWarriors.length; i++) {
      if (paired.has(activeWarriors[i].id)) continue;
      for (let j = i + 1; j < activeWarriors.length; j++) {
        if (paired.has(activeWarriors[j].id)) continue;
        pairings.push({ a: activeWarriors[i], d: activeWarriors[j], isRivalry: false });
        paired.add(activeWarriors[i].id);
        paired.add(activeWarriors[j].id);
        break;
      }
    }
  }

  const summary: WeekSummary = {
    week: state.week,
    bouts: 0,
    deaths: 0,
    injuries: 0,
    deathNames: [],
    injuryNames: [],
  };

  let hadDeath = false;
  let hadPlayerDeath = false;
  let hadInjury = false;
  const prevRivalries = (state.rivalries || []).map(r => r.intensity);

  const highlights: string[] = [];

  for (const pairing of pairings) {
    const { a: warrior, d: opponent, isRivalry, rivalStable, rivalStableId } = pairing;

    const currentW = updatedState.roster.find(w => w.id === warrior.id);
    let currentO: Warrior | undefined;
    if (rivalStableId) {
      for (const r of updatedState.rivals || []) {
        currentO = r.roster.find(w => w.id === opponent.id);
        if (currentO) break;
      }
    } else {
      currentO = updatedState.roster.find(w => w.id === opponent.id);
    }
    if (!currentW || currentW.status !== "Active" || !currentO) continue;

    const planA = currentW.plan ?? defaultPlanForWarrior(currentW);
    const planD = currentO.plan ?? defaultPlanForWarrior(currentO);
    const outcome = simulateFight(planA, planD, currentW, currentO, undefined, updatedState.trainers);

    const tags = outcome.post?.tags ?? [];
    const rawFameA = fameFromTags(outcome.winner === "A" ? tags : []);
    const rawFameD = fameFromTags(outcome.winner === "D" ? tags : []);
    const rivalryMult = isRivalry ? 2 : 1;
    const fameA = Math.round(rawFameA.fame * moodMods.fameMultiplier * rivalryMult);
    const popA = Math.round(rawFameA.pop * moodMods.popMultiplier);
    const fameD = Math.round(rawFameD.fame * moodMods.fameMultiplier);
    const popD = Math.round(rawFameD.pop * moodMods.popMultiplier);

    summary.bouts++;

    // Update player warrior records
    updatedState = {
      ...updatedState,
      roster: updatedState.roster.map(w => {
        if (w.id === warrior.id) {
          return {
            ...w,
            fame: Math.max(0, w.fame + fameA),
            popularity: Math.max(0, w.popularity + popA),
            career: {
              ...w.career,
              wins: w.career.wins + (outcome.winner === "A" ? 1 : 0),
              losses: w.career.losses + (outcome.winner === "D" ? 1 : 0),
              kills: w.career.kills + (outcome.by === "Kill" && outcome.winner === "A" ? 1 : 0),
            },
            flair: outcome.winner === "A" && tags.includes("Flashy")
              ? Array.from(new Set([...w.flair, "Flashy"]))
              : w.flair,
          };
        }
        if (!rivalStableId && w.id === opponent.id) {
          return {
            ...w,
            fame: Math.max(0, w.fame + fameD),
            popularity: Math.max(0, w.popularity + popD),
            career: {
              ...w.career,
              wins: w.career.wins + (outcome.winner === "D" ? 1 : 0),
              losses: w.career.losses + (outcome.winner === "A" ? 1 : 0),
              kills: w.career.kills + (outcome.by === "Kill" && outcome.winner === "D" ? 1 : 0),
            },
          };
        }
        return w;
      }),
    };

    // Update rival warrior records
    if (rivalStableId) {
      updatedState.rivals = (updatedState.rivals || []).map(r => ({
        ...r,
        roster: r.roster.map(w => {
          if (w.id === opponent.id) {
            return {
              ...w,
              fame: Math.max(0, w.fame + fameD),
              career: {
                ...w.career,
                wins: w.career.wins + (outcome.winner === "D" ? 1 : 0),
                losses: w.career.losses + (outcome.winner === "A" ? 1 : 0),
                kills: w.career.kills + (outcome.by === "Kill" && outcome.winner === "D" ? 1 : 0),
              },
            };
          }
          return w;
        }),
      }));
    }

    // Handle death
    if (outcome.by === "Kill") {
      hadDeath = true;
      if (outcome.winner === "A") {
        summary.deathNames.push(opponent.name);
        if (rivalStableId) {
          updatedState.rivals = (updatedState.rivals || []).map(r => ({
            ...r,
            roster: r.roster.filter(w => w.id !== opponent.id),
          }));
          updatedState.rivalries = detectRivalries(
            updatedState.rivalries || [], state.player.id, rivalStableId,
            warrior.name, opponent.name, state.week
          );
        } else {
          updatedState = killWarrior(updatedState, opponent.id, warrior.name, "Killed in arena combat");
        }
      } else {
        hadPlayerDeath = true;
        summary.deathNames.push(warrior.name);
        updatedState = killWarrior(updatedState, warrior.id, opponent.name, "Killed in arena combat");
        if (rivalStableId) {
          updatedState.rivalries = detectRivalries(
            updatedState.rivalries || [], rivalStableId, state.player.id,
            opponent.name, warrior.name, state.week
          );
        }
      }
      summary.deaths++;
    }

    // Rest states for KO
    if (outcome.by === "KO") {
      const loserId = outcome.winner === "A" ? opponent.id : warrior.id;
      updatedState.restStates = addRestState(updatedState.restStates || [], loserId, "KO", state.week);
    }

    // Injuries
    const injA = rollForInjury(warrior, outcome, "A");
    if (injA) {
      hadInjury = true;
      summary.injuries++;
      summary.injuryNames.push(warrior.name);
      updatedState = {
        ...updatedState,
        roster: updatedState.roster.map(w =>
          w.id === warrior.id ? { ...w, injuries: [...(w.injuries || []), injA as any] } : w
        ),
      };
    }
    if (!rivalStableId) {
      const injD = rollForInjury(opponent, outcome, "D");
      if (injD) {
        hadInjury = true;
        summary.injuries++;
        summary.injuryNames.push(opponent.name);
        updatedState = {
          ...updatedState,
          roster: updatedState.roster.map(w =>
            w.id === opponent.id ? { ...w, injuries: [...(w.injuries || []), injD as any] } : w
          ),
        };
      }
    }

    // XP
    const xpA = calculateXP(outcome, "A", tags);
    updatedState = {
      ...updatedState,
      roster: updatedState.roster.map(w => {
        if (w.id === warrior.id) return applyXP(w, xpA).warrior;
        return w;
      }),
    };
    if (!rivalStableId) {
      const xpD = calculateXP(outcome, "D", tags);
      updatedState = {
        ...updatedState,
        roster: updatedState.roster.map(w => {
          if (w.id === opponent.id) return applyXP(w, xpD).warrior;
          return w;
        }),
      };
    }

    // Match history
    if (rivalStableId) {
      updatedState.matchHistory = addMatchRecord(
        updatedState.matchHistory || [], warrior.id, opponent.id, rivalStableId, state.week
      );
    }

    // Fight summary
    const fightSummary: FightSummary = {
      id: `fight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      week: state.week,
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
    updatedState.arenaHistory = [...updatedState.arenaHistory, fightSummary];

    StyleMeter.recordFight({ styleA: warrior.style, styleD: opponent.style, winner: outcome.winner, by: outcome.by });
    StyleRollups.addFight({ week: state.week, styleA: warrior.style, styleD: opponent.style, winner: outcome.winner, by: outcome.by });
    ArenaHistory.append(fightSummary);
    LoreArchive.signalFight(fightSummary);
    NewsletterFeed.appendFightResult({ summary: fightSummary, transcript: outcome.log.map(e => e.text) });

    // Newsletter highlight
    const winner = outcome.winner === "A" ? warrior.name : outcome.winner === "D" ? opponent.name : "Draw";
    const deathNote = outcome.by === "Kill" ? " ☠️" : "";
    const rivalTag = rivalStable ? ` (vs ${rivalStable})` : "";
    highlights.push(`${warrior.name} vs ${opponent.name}${rivalTag}: ${winner} ${outcome.by ? `by ${outcome.by}` : "(Draw)"}${deathNote}`);
  }

  // Stable fame
  let stableFameDelta = 0;
  for (const h of highlights) {
    if (h.includes("by Kill")) stableFameDelta += 3;
    else if (!h.includes("Draw")) stableFameDelta += 1;
  }

  updatedState.newsletter = [...updatedState.newsletter, { week: state.week, title: "Arena Gazette", items: highlights }];
  updatedState.fame = (updatedState.fame ?? 0) + stableFameDelta;
  updatedState.player = { ...updatedState.player, fame: (updatedState.player.fame ?? 0) + stableFameDelta };
  updatedState.crowdMood = computeCrowdMood(updatedState.arenaHistory);

  NewsletterFeed.closeWeekToIssue(state.week);

  // Check rivalry escalation
  const newRivalries = updatedState.rivalries || [];
  const hadRivalryEscalation = newRivalries.some((r, i) => {
    const old = prevRivalries[i] ?? 0;
    return r.intensity > old && r.intensity >= 4;
  });

  // Run advanceWeek pipeline (training, economy, aging, etc.)
  updatedState = advanceWeek(updatedState);

  return { state: updatedState, summary, hadDeath, hadPlayerDeath, hadInjury, hadRivalryEscalation };
}

/**
 * Run the autosim loop with stop conditions.
 * Yields control back via onProgress callback for UI updates.
 */
export async function runAutosim(
  initialState: GameState,
  maxWeeks: number,
  onProgress: (weeksCompleted: number, totalWeeks: number, summary: WeekSummary) => void,
): Promise<AutosimResult> {
  let currentState = initialState;
  const weekSummaries: WeekSummary[] = [];

  for (let i = 0; i < maxWeeks; i++) {
    // Check if a tournament is active
    const activeTournament = currentState.tournaments.find(
      t => t.season === currentState.season && !t.completed
    );
    if (activeTournament) {
      return {
        finalState: currentState,
        weeksSimmed: i,
        stopReason: "tournament_week",
        stopDetail: `${activeTournament.name} is active — resolve it before continuing.`,
        weekSummaries,
      };
    }

    // Check pairings exist
    const matchCard = generateMatchCard(currentState);
    const fightReady = currentState.roster.filter(w => {
      if (w.status !== "Active") return false;
      const injObjs = (w.injuries || []).filter((inj): inj is Injury => typeof inj !== "string");
      return !isTooInjuredToFight(injObjs);
    });
    if (matchCard.length === 0 && fightReady.length < 2) {
      return {
        finalState: currentState,
        weeksSimmed: i,
        stopReason: "no_pairings",
        stopDetail: "No valid pairings available.",
        weekSummaries,
      };
    }

    const result = runOneWeek(currentState);
    currentState = result.state;
    weekSummaries.push(result.summary);
    onProgress(i + 1, maxWeeks, result.summary);

    // Yield to UI thread
    await new Promise(r => setTimeout(r, 0));

    // Stop conditions
    if (result.hadPlayerDeath) {
      return {
        finalState: currentState,
        weeksSimmed: i + 1,
        stopReason: "player_death",
        stopDetail: `${result.summary.deathNames.join(", ")} died in combat!`,
        weekSummaries,
      };
    }

    if (result.hadDeath) {
      return {
        finalState: currentState,
        weeksSimmed: i + 1,
        stopReason: "death",
        stopDetail: `${result.summary.deathNames.join(", ")} fell in the arena.`,
        weekSummaries,
      };
    }

    if (result.hadInjury) {
      return {
        finalState: currentState,
        weeksSimmed: i + 1,
        stopReason: "injury",
        stopDetail: `${result.summary.injuryNames.join(", ")} sustained injuries.`,
        weekSummaries,
      };
    }

    if (result.hadRivalryEscalation) {
      return {
        finalState: currentState,
        weeksSimmed: i + 1,
        stopReason: "rivalry_escalation",
        stopDetail: "A rivalry has escalated to dangerous levels!",
        weekSummaries,
      };
    }
  }

  return {
    finalState: currentState,
    weeksSimmed: maxWeeks,
    stopReason: "max_weeks",
    stopDetail: `Completed ${maxWeeks} weeks.`,
    weekSummaries,
  };
}
