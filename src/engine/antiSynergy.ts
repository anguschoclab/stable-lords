/**
 * Anti-synergy lookups: style × tactic penalties.
 * 
 * LEGACY — basic flat penalties. Style-flavored anti-synergy is now in stylePassives.ts.
 * This file is kept for backward compatibility with existing imports.
 */

export const antiSynergy = {
  offensive: {
    "BASHING ATTACK": { Lunge: 0.6, Aim: 0.7, Slash: 0.85 },
    "LUNGING ATTACK": { Bash: 0.7 },
    "PARRY-RIPOSTE": { Decisiveness: 0.7, Lunge: 0.85 },
    "AIMED BLOW": { Bash: 0.4, Slash: 0.6 },
    "TOTAL PARRY": { Lunge: 0.4, Bash: 0.4, Slash: 0.5 },
    "SLASHING ATTACK": { Bash: 0.5 },
  } as Record<string, Record<string, number>>,
  defensive: {
    "BASHING ATTACK": { Responsiveness: 0.9, Parry: 0.92, Dodge: 0.5, Riposte: 0.5 },
    "PARRY-LUNGE": { Riposte: 1.05 },
    "LUNGING ATTACK": { Parry: 0.6 },
    "STRIKING ATTACK": { Riposte: 0.6 },
    "SLASHING ATTACK": { Parry: 0.6 },
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
