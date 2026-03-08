/**
 * Stable Lords — Fight Simulation (stub engine).
 * This is the stub that produces a deterministic draw.
 * Drop in the full engine here when ready.
 */
import {
  FightingStyle,
  type Warrior,
  type FightPlan,
  type FightOutcome,
  type MinuteEvent,
} from "@/types/game";

export function defaultPlanForWarrior(w: Warrior): FightPlan {
  return {
    style: w.style,
    OE: 7,
    AL: 6,
    killDesire: 5,
    target: "Any",
  };
}

/** Stub simulation — replace with full engine */
export function simulateFight(
  planA: FightPlan,
  planD: FightPlan
): FightOutcome {
  const log: MinuteEvent[] = [
    { minute: 1, text: "The audience falls silent as the dueling begins." },
    { minute: 1, text: "Both warriors test the measure of their foe." },
    { minute: 2, text: "Steel flashes; parries ring; no decisive blow." },
    { minute: 3, text: "Time! The Arenamaster signals a draw for this exhibition." },
  ];

  // Simple RNG outcome for demo
  const roll = Math.random();
  if (roll < 0.35) {
    const byRoll = Math.random();
    const by = byRoll < 0.15 ? "Kill" as const : byRoll < 0.4 ? "KO" as const : "Stoppage" as const;
    log.push({ minute: 3, text: `The attacker lands a decisive blow — ${by}!` });
    return {
      winner: "A",
      by,
      minutes: 3,
      log,
      post: { xpA: 2, xpD: 1, tags: by === "Kill" ? ["Kill"] : by === "KO" ? ["KO", "Flashy"] : ["Flashy"] },
    };
  } else if (roll < 0.7) {
    const byRoll = Math.random();
    const by = byRoll < 0.15 ? "Kill" as const : byRoll < 0.4 ? "KO" as const : "Stoppage" as const;
    log.push({ minute: 3, text: `The defender finds an opening and strikes — ${by}!` });
    return {
      winner: "D",
      by,
      minutes: 3,
      log,
      post: { xpA: 1, xpD: 2, tags: by === "Kill" ? ["Kill"] : by === "KO" ? ["KO"] : [] },
    };
  }

  return { winner: null, by: "Draw", minutes: 3, log, post: { xpA: 1, xpD: 1, tags: [] } };
}
