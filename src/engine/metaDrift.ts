/**
 * Stable Lords — Meta Drift System
 * Styles gain or lose effectiveness based on arena-wide outcomes.
 */
import { FightingStyle } from '@/types/shared.types';
import type { FightSummary } from '@/types/combat.types';

export type StyleMeta = Record<FightingStyle, number>; // -10 to +10 drift

export function createDefaultMeta(): StyleMeta {
  const meta = {} as StyleMeta;
  for (const style of Object.values(FightingStyle)) {
    meta[style] = 0;
  }
  return meta;
}

/**
 * Recalculate style meta from fight history.
 * Winning styles drift positive, losing styles drift negative.
 */
export function computeMetaDrift(history: FightSummary[], window = 20): StyleMeta {
  const meta = createDefaultMeta();
  const recent = history.slice(-window);

  const wins: Record<string, number> = {};
  const losses: Record<string, number> = {};

  for (const f of recent) {
    if (f.winner === 'A') {
      wins[f.styleA] = (wins[f.styleA] ?? 0) + 1;
      losses[f.styleD] = (losses[f.styleD] ?? 0) + 1;
    } else if (f.winner === 'D') {
      wins[f.styleD] = (wins[f.styleD] ?? 0) + 1;
      losses[f.styleA] = (losses[f.styleA] ?? 0) + 1;
    }
  }

  for (const style of Object.values(FightingStyle)) {
    const w = wins[style] ?? 0;
    const l = losses[style] ?? 0;
    const total = w + l;
    if (total === 0) continue;
    // Drift = normalized win rate shifted to -10..+10
    const winRate = w / total;
    meta[style] = Math.round((winRate - 0.5) * 20);
    meta[style] = Math.max(-10, Math.min(10, meta[style]));
  }

  return meta;
}

export function getMetaLabel(drift: number): string {
  if (drift >= 5) return 'Dominant';
  if (drift >= 2) return 'Rising';
  if (drift <= -5) return 'Declining';
  if (drift <= -2) return 'Struggling';
  return 'Stable';
}

export function getMetaColor(drift: number): string {
  if (drift >= 5) return 'text-arena-treasury';
  if (drift >= 2) return 'text-arena-pop';
  if (drift <= -5) return 'text-destructive';
  if (drift <= -2) return 'text-arena-fame';
  return 'text-muted-foreground';
}
