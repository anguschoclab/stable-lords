import { getRecentFights } from "@/engine/core/historyUtils";
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
export function generateOwnerNarratives(
  state: GameState,
  newSeason: Season
): string[] {
  if (newSeason === state.season) return [];

  const gazetteItems: string[] = [];
  const recentFights = getRecentFights(state.arenaHistory, state.week - 13);
  const rivals = state.rivals || [];

  for (const rival of rivals) {
    const personality = rival.owner.personality ?? "Pragmatic";
    const names = new Set(rival.roster.map(w => w.name));

    const wins = recentFights.filter(f =>
      (names.has(f.a) && f.winner === "A") || (names.has(f.d) && f.winner === "D")
    ).length;
    const losses = recentFights.filter(f =>
      (names.has(f.a) && f.winner === "D") || (names.has(f.d) && f.winner === "A")
    ).length;
    const kills = recentFights.filter(f =>
      f.by === "Kill" && (
        (names.has(f.a) && f.winner === "A") || (names.has(f.d) && f.winner === "D")
      )
    ).length;
    const deaths = recentFights.filter(f =>
      f.by === "Kill" && (
        (names.has(f.a) && f.winner === "D") || (names.has(f.d) && f.winner === "A")
      )
    ).length;

    const totalFights = wins + losses;
    if (totalFights === 0) continue;
    const winRate = wins / totalFights;

    // ── Personality-specific reactions ──

    // Aggressive owner losing badly
    if (personality === "Aggressive" && winRate < 0.35 && totalFights >= 4) {
      const templates = [
        `😤 ${rival.owner.name} (${rival.owner.stableName}) rages: "Heads will roll if results don't improve!"`,
        `🔥 ${rival.owner.name} fires ${rival.owner.stableName}'s head trainer after a dismal ${state.season}!`,
        `⚔️ ${rival.owner.name} declares: "Next season, we fight with fury or not at all!"`,
      ];
      gazetteItems.push(templates[Math.floor(Math.random() * templates.length)]);
    }

    // Methodical owner on a winning streak
    if (personality === "Methodical" && winRate >= 0.7 && totalFights >= 4) {
      gazetteItems.push(
        `📊 ${rival.owner.name} (${rival.owner.stableName}): "Our preparation is paying dividends — ${wins}W/${losses}L this ${state.season}."`
      );
    }

    // Showman with lots of kills
    if (personality === "Showman" && kills >= 2) {
      gazetteItems.push(
        `🎭 ${rival.owner.name} (${rival.owner.stableName}) boasts: "${kills} kills this ${state.season}! The crowd demands blood, and we deliver!"`
      );
    }

    // Pragmatic owner suffering deaths
    if (personality === "Pragmatic" && deaths >= 2) {
      gazetteItems.push(
        `💀 ${rival.owner.name} (${rival.owner.stableName}) grimly assesses: "${deaths} warriors lost this ${state.season}. Costs are unsustainable."`
      );
    }

    // Tactician dominating
    if (personality === "Tactician" && winRate >= 0.65 && kills === 0 && totalFights >= 3) {
      gazetteItems.push(
        `🧠 ${rival.owner.name} (${rival.owner.stableName}): "Clean victories, no unnecessary bloodshed — ${wins}W/${losses}L. Strategy prevails."`
      );
    }

    // Any owner with a dominant season
    if (winRate >= 0.8 && totalFights >= 5) {
      gazetteItems.push(
        `🏆 ${rival.owner.stableName} dominated ${state.season} with a record of ${wins}-${losses}!`
      );
    }

    // Any owner with devastating losses
    if (deaths >= 3) {
      gazetteItems.push(
        `⚰️ A grim ${state.season} for ${rival.owner.stableName} — ${deaths} warriors fell in the arena.`
      );
    }
  }

  // Add Blood Feud public taunts for player rivalry
  for (const rival of rivals) {
    const rivalries = state.rivalries || [];
    const rivalry = rivalries.find(rv =>
      (rv.stableIdA === state.player.id && rv.stableIdB === rival.owner.id) ||
      (rv.stableIdB === state.player.id && rv.stableIdA === rival.owner.id)
    );

    if (rivalry && rivalry.intensity >= 4 && Math.random() < 0.25) { // 25% chance per season to taunt the player if feud
        const tauntTemplates = [
            `🗣️ "${state.player.stableName} is a disgrace to the sands. I will see them bleed," vows ${rival.owner.name} (${rival.owner.stableName}).`,
            `🗣️ ${rival.owner.name} (${rival.owner.stableName}) issues a public challenge: "My warriors will hunt down the dogs of ${state.player.stableName}."`,
            `🗣️ "The feud with ${state.player.stableName} ends when their stable is ash," declares ${rival.owner.name}.`,
            `🗣️ Public Grudge: ${rival.owner.name} (${rival.owner.stableName}) was heard mocking the recent performances of ${state.player.stableName}.`
        ];

        // Pick a random taunt
        const taunt = tauntTemplates[Math.floor(Math.random() * tauntTemplates.length)];
        gazetteItems.push(taunt);
    }
  }

  return gazetteItems;
}

// ─── 5) Philosophy Evolution ──────────────────────────────────────────────

const PHILOSOPHY_DRIFT: Record<string, string[]> = {
  "Brute Force":  ["Spectacle", "Balanced"],
  "Speed Kills":  ["Cunning", "Spectacle"],
  "Iron Defense": ["Endurance", "Balanced"],
  "Balanced":     ["Cunning", "Iron Defense", "Brute Force"],
  "Spectacle":    ["Speed Kills", "Brute Force"],
  "Cunning":      ["Iron Defense", "Speed Kills"],
  "Endurance":    ["Iron Defense", "Balanced"],
  "Specialist":   ["Cunning", "Balanced"],
};

/**
 * Evolve stable philosophies based on season results.
 * Losing stables adapt; winning stables double down.
 * Runs on season change.
 */
/**
 * Iterates over AI factions and slightly evolves their underlying philosophies over time.
 * Models long-term shifting strategies and trends in the AI manager pool.
 *
 * @param globalState - The global application state object.
 * @param randomSeed - Deterministic random seed used for generating philosophical drift.
 */