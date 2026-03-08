/**
 * Anti-synergy lookups: style × tactic penalties.
 */

export const antiSynergy = {
  offensive: {
    "BASHING ATTACK": { Lunge: 0.6, Aim: 0.7, Slash: 0.85 },
    "LUNGING ATTACK": { Bash: 0.7 },
    "PARRY-RIPOSTE": { Decisiveness: 0.7, Lunge: 0.85 },
  } as Record<string, Record<string, number>>,
  defensive: {
    "BASHING ATTACK": { Responsiveness: 0.9, Parry: 0.92 },
    "PARRY-LUNGE": { Riposte: 1.05 },
  } as Record<string, Record<string, number>>,
} as const;

export function getOffensivePenalty(style: string, tactic?: string): number {
  if (!tactic) return 1;
  const row = antiSynergy.offensive[style];
  if (!row) return 1;
  return row[tactic] ?? 1;
}

export function getDefensivePenalty(style: string, tactic?: string): number {
  if (!tactic) return 1;
  const row = antiSynergy.defensive[style];
  if (!row) return 1;
  return row[tactic] ?? 1;
}
