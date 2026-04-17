/**
 * Week Stats Service
 * Accumulates bout statistics for weekly summary
 * Extracted from boutProcessorService.ts to enforce SRP
 */
import type { WeekBoutSummary, BoutImpact } from "@/engine/bout/services/boutProcessorService";

/**
 * Creates a fresh week bout summary
 */
export function createWeekBoutSummary(): WeekBoutSummary {
  return {
    bouts: 0,
    deaths: 0,
    injuries: 0,
    deathNames: [],
    injuryNames: [],
    hadPlayerDeath: false,
    hadRivalryEscalation: false,
  };
}

/**
 * Accumulates bout results into week summary
 * Mutates summary for performance (internal accumulator pattern)
 */
export function accumulateWeekStats(
  summary: WeekBoutSummary,
  res: BoutImpact
): void {
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
}
