/**
 * Autosim Engine — runs multiple weeks automatically with stop conditions.
 * Delegates to boutProcessor for the actual fight resolution (no duplication).
 */
import type { GameState } from "@/types/game";
import { advanceWeek } from "@/state/gameStore";
import { processWeekBouts, generatePairings, type WeekBoutSummary } from "@/engine/boutProcessor";
import { isTooInjuredToFight, type Injury } from "@/engine/injuries";

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
 * Run the autosim loop with stop conditions.
 */
export async function runAutosim(
  initialState: GameState,
  maxWeeks: number,
  onProgress: (weeksCompleted: number, totalWeeks: number, summary: WeekSummary) => void,
): Promise<AutosimResult> {
  let currentState = initialState;
  const weekSummaries: WeekSummary[] = [];

  for (let i = 0; i < maxWeeks; i++) {
    // Check for active tournament
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
    const pairings = generatePairings(currentState);
    const fightReady = currentState.roster.filter(w => {
      if (w.status !== "Active") return false;
      const injObjs = (w.injuries || []).filter((inj): inj is Injury => typeof inj !== "string");
      return !isTooInjuredToFight(injObjs);
    });
    if (pairings.length === 0 && fightReady.length < 2) {
      return {
        finalState: currentState,
        weeksSimmed: i,
        stopReason: "no_pairings",
        stopDetail: "No valid pairings available.",
        weekSummaries,
      };
    }

    // Process bouts via shared engine
    const processed = processWeekBouts(currentState);

    // Run advanceWeek pipeline
    currentState = advanceWeek(processed.state);

    const weekSummary: WeekSummary = {
      week: processed.state.week,
      bouts: processed.summary.bouts,
      deaths: processed.summary.deaths,
      injuries: processed.summary.injuries,
      deathNames: processed.summary.deathNames,
      injuryNames: processed.summary.injuryNames,
    };
    weekSummaries.push(weekSummary);
    onProgress(i + 1, maxWeeks, weekSummary);

    // Yield to UI thread
    await new Promise(r => setTimeout(r, 0));

    // Stop conditions
    if (processed.summary.hadPlayerDeath) {
      return {
        finalState: currentState,
        weeksSimmed: i + 1,
        stopReason: "player_death",
        stopDetail: `${processed.summary.deathNames.join(", ")} died in combat!`,
        weekSummaries,
      };
    }

    if (processed.summary.deaths > 0) {
      return {
        finalState: currentState,
        weeksSimmed: i + 1,
        stopReason: "death",
        stopDetail: `${processed.summary.deathNames.join(", ")} fell in the arena.`,
        weekSummaries,
      };
    }

    if (processed.summary.injuries > 0) {
      return {
        finalState: currentState,
        weeksSimmed: i + 1,
        stopReason: "injury",
        stopDetail: `${processed.summary.injuryNames.join(", ")} sustained injuries.`,
        weekSummaries,
      };
    }

    if (processed.summary.hadRivalryEscalation) {
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
