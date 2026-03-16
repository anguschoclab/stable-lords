/**
 * Owner AI — Personality-driven decision-making, roster management,
 * owner rivalries, narrative events, and philosophy evolution.
 *
 * Consumes: Owner personalities, stable philosophies, match results, meta drift.
 * Produces: Plan adjustments, gazette events, roster changes, rivalry updates.
 */
import type {
  GameState, Warrior, RivalStableData, FightPlan, Owner,
  OwnerPersonality, Season, NewsletterItem, MetaAdaptation,
} from "@/types/game";
import { FightingStyle } from "@/types/game";
import { defaultPlanForWarrior } from "./simulate";
import { computeWarriorStats } from "./skillCalc";
import { computeMetaDrift, type StyleMeta } from "./metaDrift";

// ─── 1) Personality-Driven Plan Adjustments ───────────────────────────────

/** Personality modifiers applied on top of style defaults */
const PERSONALITY_PLAN_MODS: Record<OwnerPersonality, Partial<FightPlan>> = {
  Aggressive:  { OE: 2, AL: 1, killDesire: 3 },
  Methodical:  { OE: -1, AL: 0, killDesire: -1 },
  Showman:     { OE: 1, AL: 2, killDesire: 1 },
  Pragmatic:   { OE: 0, AL: 0, killDesire: 0 },
  Tactician:   { OE: -1, AL: 1, killDesire: -2 },
};
export function evolvePhilosophies(
  state: GameState,
  newSeason: Season
): { updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  if (newSeason === state.season) return { updatedRivals: state.rivals || [], gazetteItems: [] };

  const gazetteItems: string[] = [];
  const recentFights = state.arenaHistory.filter(f => f.week >= state.week - 13);
  const meta = computeMetaDrift(state.arenaHistory, 20);

  const updatedRivals = (state.rivals || []).map(rival => {
    const adaptation = rival.owner.metaAdaptation ?? "Opportunist";

    // Traditionalists NEVER change philosophy
    if (adaptation === "Traditionalist") return rival;

    const names = new Set(rival.roster.map(w => w.name));
    const wins = recentFights.filter(f =>
      (names.has(f.a) && f.winner === "A") || (names.has(f.d) && f.winner === "D")
    ).length;
    const losses = recentFights.filter(f =>
      (names.has(f.a) && f.winner === "D") || (names.has(f.d) && f.winner === "A")
    ).length;

    const totalFights = wins + losses;
    if (totalFights < 4) return rival;

    const winRate = wins / totalFights;
    const currentPhilosophy = rival.philosophy ?? "Balanced";
    const driftOptions = PHILOSOPHY_DRIFT[currentPhilosophy] ?? ["Balanced"];

    // Drift thresholds vary by adaptation type
    const driftThreshold = adaptation === "MetaChaser" ? 0.45 : adaptation === "Innovator" ? 0.40 : 0.35;
    const driftChance = adaptation === "MetaChaser" ? 0.5 : adaptation === "Innovator" ? 0.35 : 0.3;

    if (winRate < driftThreshold && Math.random() < driftChance) {
      let newPhilosophy: string;

      if (adaptation === "MetaChaser") {
        // Chase whatever philosophy aligns with the dominant meta style
        newPhilosophy = pickMetaAlignedPhilosophy(meta) ?? driftOptions[Math.floor(Math.random() * driftOptions.length)];
      } else if (adaptation === "Innovator") {
        // Pick a philosophy that counters the meta
        newPhilosophy = pickCounterMetaPhilosophy(meta) ?? driftOptions[Math.floor(Math.random() * driftOptions.length)];
      } else {
        newPhilosophy = driftOptions[Math.floor(Math.random() * driftOptions.length)];
      }

      const adaptLabel = adaptation === "MetaChaser" ? "chasing the meta" : adaptation === "Innovator" ? "innovating against the meta" : "seeking a new path";
      gazetteItems.push(
        `🔄 ${rival.owner.stableName} shifts from ${currentPhilosophy} to ${newPhilosophy} — ${rival.owner.name} is ${adaptLabel} after a losing ${state.season}.`
      );
      return { ...rival, philosophy: newPhilosophy };
    }

    return rival;
  });

  return { updatedRivals, gazetteItems };
}

/** Find the philosophy that best aligns with the current dominant meta styles */
function pickMetaAlignedPhilosophy(meta: StyleMeta): string | null {
  const philosophyStyleMap: Record<string, FightingStyle[]> = {
    "Brute Force": [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.LungingAttack],
    "Speed Kills": [FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.AimedBlow],
    "Iron Defense": [FightingStyle.TotalParry, FightingStyle.WallOfSteel, FightingStyle.ParryStrike],
    "Spectacle": [FightingStyle.SlashingAttack, FightingStyle.ParryRiposte, FightingStyle.LungingAttack],
    "Cunning": [FightingStyle.ParryRiposte, FightingStyle.AimedBlow, FightingStyle.ParryLunge],
    "Endurance": [FightingStyle.WallOfSteel, FightingStyle.TotalParry, FightingStyle.ParryStrike],
  };

  let best: string | null = null;
  let bestScore = -Infinity;
  for (const [phil, styles] of Object.entries(philosophyStyleMap)) {
    const score = styles.reduce((sum, s) => sum + (meta[s] ?? 0), 0);
    if (score > bestScore) { bestScore = score; best = phil; }
  }
  return bestScore > 0 ? best : null;
}

/** Find a philosophy that counters the current meta (styles that are declining = opponents not prepared) */
function pickCounterMetaPhilosophy(meta: StyleMeta): string | null {
  const philosophyStyleMap: Record<string, FightingStyle[]> = {
    "Brute Force": [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.LungingAttack],
    "Speed Kills": [FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.AimedBlow],
    "Iron Defense": [FightingStyle.TotalParry, FightingStyle.WallOfSteel, FightingStyle.ParryStrike],
    "Spectacle": [FightingStyle.SlashingAttack, FightingStyle.ParryRiposte, FightingStyle.LungingAttack],
    "Cunning": [FightingStyle.ParryRiposte, FightingStyle.AimedBlow, FightingStyle.ParryLunge],
    "Endurance": [FightingStyle.WallOfSteel, FightingStyle.TotalParry, FightingStyle.ParryStrike],
  };

  // Pick the philosophy whose styles are least popular (counter-pick)
  let best: string | null = null;
  let bestScore = Infinity;
  for (const [phil, styles] of Object.entries(philosophyStyleMap)) {
    const score = styles.reduce((sum, s) => sum + (meta[s] ?? 0), 0);
    if (score < bestScore) { bestScore = score; best = phil; }
  }
  return best;
}

// ─── Owner Scoring & Ranking ──────────────────────────────────────────────
// (Migrated from src/modules/owners.ts)

export type OwnerScore = {
  id: string;
  score: number;
  rank: number;
};
