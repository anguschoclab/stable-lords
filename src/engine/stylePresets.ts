/**
 * Style Strategy Presets — pre-built phase configurations per style.
 * From Strategy Editor Spec v1.0 §5
 */
import { FightingStyle, type FightPlan, type PhaseStrategy } from "@/types/game";

export interface StylePreset {
  name: string;
  description: string;
  plan: Pick<FightPlan, "OE" | "AL" | "killDesire" | "phases">;
}

function p(OE: number, AL: number, killDesire: number): PhaseStrategy {
  return { OE, AL, killDesire };
}

export const STYLE_PRESETS: Record<string, StylePreset[]> = {
  [FightingStyle.AimedBlow]: [
    { name: "Patient Surgeon", description: "Start cautious, escalate precision in late bout", plan: { OE: 4, AL: 5, killDesire: 3, phases: { opening: p(4, 5, 3), mid: p(6, 5, 5), late: p(7, 4, 7) } } },
    { name: "Aggressive Precision", description: "Push tempo early, close decisively", plan: { OE: 6, AL: 6, killDesire: 5, phases: { opening: p(6, 6, 5), mid: p(7, 5, 6), late: p(5, 3, 8) } } },
  ],
  [FightingStyle.BashingAttack]: [
    { name: "Steamroller", description: "Maximum early pressure, finish the wounded", plan: { OE: 8, AL: 5, killDesire: 6, phases: { opening: p(8, 5, 6), mid: p(7, 4, 7), late: p(5, 3, 9) } } },
    { name: "Measured Brute", description: "Conserve energy for a devastating finish", plan: { OE: 6, AL: 4, killDesire: 4, phases: { opening: p(6, 4, 4), mid: p(7, 5, 6), late: p(8, 3, 8) } } },
  ],
  [FightingStyle.LungingAttack]: [
    { name: "Blitz", description: "All-out speed and aggression, rest later", plan: { OE: 8, AL: 8, killDesire: 5, phases: { opening: p(8, 8, 5), mid: p(6, 6, 6), late: p(4, 4, 7) } } },
    { name: "Sustained Pressure", description: "Even pace with initiative advantage", plan: { OE: 6, AL: 7, killDesire: 4, phases: { opening: p(6, 7, 4), mid: p(6, 6, 5), late: p(5, 5, 6) } } },
  ],
  [FightingStyle.ParryLunge]: [
    { name: "Counter-Strike", description: "Defend early, explode when they tire", plan: { OE: 4, AL: 5, killDesire: 3, phases: { opening: p(4, 5, 3), mid: p(6, 6, 5), late: p(7, 5, 7) } } },
    { name: "Explosive Opener", description: "Strike first and hard, retreat to defense", plan: { OE: 7, AL: 7, killDesire: 5, phases: { opening: p(7, 7, 5), mid: p(5, 5, 5), late: p(4, 4, 6) } } },
  ],
  [FightingStyle.ParryRiposte]: [
    { name: "Classic Counter", description: "Let them come to you, punish every miss", plan: { OE: 3, AL: 4, killDesire: 3, phases: { opening: p(3, 4, 3), mid: p(4, 5, 4), late: p(5, 4, 6) } } },
    { name: "Aggressive Riposte", description: "More active riposting with kill intent", plan: { OE: 5, AL: 5, killDesire: 4, phases: { opening: p(5, 5, 4), mid: p(5, 5, 5), late: p(6, 4, 7) } } },
  ],
  [FightingStyle.ParryStrike]: [
    { name: "Measured Defense", description: "Efficient defense with clean counters", plan: { OE: 5, AL: 5, killDesire: 3, phases: { opening: p(5, 5, 3), mid: p(5, 5, 5), late: p(6, 4, 7) } } },
    { name: "Quick Finish", description: "Build to aggressive late-bout closing", plan: { OE: 6, AL: 6, killDesire: 5, phases: { opening: p(6, 6, 5), mid: p(7, 5, 6), late: p(5, 3, 8) } } },
  ],
  [FightingStyle.SlashingAttack]: [
    { name: "Pressure Cutter", description: "Relentless slashing with late escalation", plan: { OE: 7, AL: 6, killDesire: 5, phases: { opening: p(7, 6, 5), mid: p(7, 6, 6), late: p(6, 4, 7) } } },
    { name: "Cautious Slasher", description: "Save energy for a lethal finish", plan: { OE: 5, AL: 5, killDesire: 3, phases: { opening: p(5, 5, 3), mid: p(6, 6, 5), late: p(7, 5, 7) } } },
  ],
  [FightingStyle.StrikingAttack]: [
    { name: "Fast Finish", description: "Aggressive from the start, lethal at the end", plan: { OE: 7, AL: 6, killDesire: 6, phases: { opening: p(7, 6, 6), mid: p(7, 5, 7), late: p(6, 3, 9) } } },
    { name: "Technical Striker", description: "Balanced approach, efficient and deadly", plan: { OE: 5, AL: 5, killDesire: 4, phases: { opening: p(5, 5, 4), mid: p(6, 5, 5), late: p(6, 4, 7) } } },
  ],
  [FightingStyle.TotalParry]: [
    { name: "Endurance Wall", description: "Outlast everyone, barely attack", plan: { OE: 2, AL: 3, killDesire: 1, phases: { opening: p(2, 3, 1), mid: p(3, 3, 2), late: p(4, 3, 4) } } },
    { name: "Opportunistic", description: "Slightly more aggressive, capitalize on fatigue", plan: { OE: 3, AL: 4, killDesire: 2, phases: { opening: p(3, 4, 2), mid: p(4, 4, 4), late: p(5, 4, 6) } } },
  ],
  [FightingStyle.WallOfSteel]: [
    { name: "Iron Curtain", description: "Constant blade motion, grind them down", plan: { OE: 5, AL: 6, killDesire: 3, phases: { opening: p(5, 6, 3), mid: p(5, 5, 4), late: p(4, 4, 5) } } },
    { name: "Aggressive Wall", description: "More offense through the blade wall", plan: { OE: 6, AL: 7, killDesire: 5, phases: { opening: p(6, 7, 5), mid: p(6, 6, 5), late: p(5, 5, 6) } } },
  ],
};
