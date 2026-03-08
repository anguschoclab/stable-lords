/**
 * Wraps simulateFight with signal emission for UI toasts and fame tracking.
 */
import { simulateFight } from "./simulate";
import { sendSignal } from "./signals";
import { fameFromTags } from "./fame";
import type { FightPlan, FightOutcome, Warrior, TrainerData } from "@/types/game";

export function simulateFightAndSignal(
  planA: FightPlan,
  planD: FightPlan,
  warriorA?: Warrior,
  warriorD?: Warrior,
  seed?: number,
  trainers?: TrainerData[]
): FightOutcome {
  const out = simulateFight(planA, planD, warriorA, warriorD, seed, trainers);
  const tags = out.post?.tags ?? [];
  const famA = fameFromTags(out.winner === "A" ? tags : []);
  const famD = fameFromTags(out.winner === "D" ? tags : []);

  sendSignal({
    type: "fight:result",
    payload: {
      winnerSide: out.winner,
      by: out.by,
      minutes: out.minutes,
      tags,
      fameDeltaA: out.winner === "A" ? famA.fame : -1,
      fameDeltaD: out.winner === "D" ? famD.fame : -1,
      popDeltaA: out.winner === "A" ? famA.pop : 0,
      popDeltaD: out.winner === "D" ? famD.pop : 0,
    },
  });

  return out;
}
