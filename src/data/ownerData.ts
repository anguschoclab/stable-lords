import { OwnerPersonality, FightPlan, FightingStyle, MetaAdaptation } from '@/types/game';

/** Personality modifiers applied on top of style defaults */
export const PERSONALITY_PLAN_MODS: Record<OwnerPersonality, Partial<FightPlan>> = {
  Aggressive: { OE: 2, AL: 1, killDesire: 3 },
  Methodical: { OE: -1, AL: 0, killDesire: -1 },
  Showman: { OE: 1, AL: 2, killDesire: 1 },
  Pragmatic: { OE: 0, AL: 0, killDesire: 0 },
  Tactician: { OE: -1, AL: 1, killDesire: -2 },
};

/** Philosophy modifiers — layered on top of personality */
export const PHILOSOPHY_PLAN_MODS: Record<string, Partial<FightPlan>> = {
  'Brute Force': { OE: 2, AL: -1, killDesire: 2 },
  'Speed Kills': { OE: 1, AL: 3, killDesire: 1 },
  'Iron Defense': { OE: -2, AL: -1, killDesire: -2 },
  Balanced: { OE: 0, AL: 0, killDesire: 0 },
  Spectacle: { OE: 1, AL: 2, killDesire: 2 },
  Cunning: { OE: -1, AL: 1, killDesire: -1 },
  Endurance: { OE: -1, AL: -2, killDesire: -1 },
  Specialist: { OE: 0, AL: 1, killDesire: 1 },
};

/** Personality compatibility — some owners naturally clash */
export const PERSONALITY_CLASH: Record<OwnerPersonality, OwnerPersonality[]> = {
  Aggressive: ['Methodical', 'Tactician'],
  Methodical: ['Aggressive', 'Showman'],
  Showman: ['Methodical', 'Pragmatic'],
  Pragmatic: ['Showman'],
  Tactician: ['Aggressive'],
};

/** Philosophy drift options — losing stables adapt; winning stables double down */
export const PHILOSOPHY_DRIFT: Record<string, string[]> = {
  'Brute Force': ['Spectacle', 'Balanced'],
  'Speed Kills': ['Cunning', 'Spectacle'],
  'Iron Defense': ['Endurance', 'Balanced'],
  Balanced: ['Cunning', 'Iron Defense', 'Brute Force'],
  Spectacle: ['Speed Kills', 'Brute Force'],
  Cunning: ['Iron Defense', 'Speed Kills'],
  Endurance: ['Iron Defense', 'Balanced'],
  Specialist: ['Cunning', 'Balanced'],
};

/** Flavor quotes for recruitment based on meta adaptation */
export const META_RECRUIT_QUOTES: Record<MetaAdaptation, string> = {
  MetaChaser: '"If it wins, we buy it."',
  Traditionalist: '"We rely on what we know."',
  Opportunist: '"There is room in the market for a new face."',
  Innovator: '"They will never see this coming."',
};

/** Map philosophy to preferred fighting styles */
export const PHILOSOPHY_TO_STYLES: Record<string, FightingStyle[]> = {
  'Brute Force': [
    FightingStyle.BashingAttack,
    FightingStyle.StrikingAttack,
    FightingStyle.LungingAttack,
  ],
  'Speed Kills': [
    FightingStyle.LungingAttack,
    FightingStyle.SlashingAttack,
    FightingStyle.AimedBlow,
  ],
  'Iron Defense': [FightingStyle.TotalParry, FightingStyle.WallOfSteel, FightingStyle.ParryStrike],
  Balanced: [FightingStyle.StrikingAttack, FightingStyle.ParryStrike, FightingStyle.SlashingAttack],
  Spectacle: [
    FightingStyle.SlashingAttack,
    FightingStyle.ParryRiposte,
    FightingStyle.LungingAttack,
  ],
  Cunning: [FightingStyle.ParryRiposte, FightingStyle.AimedBlow, FightingStyle.ParryLunge],
  Endurance: [FightingStyle.WallOfSteel, FightingStyle.TotalParry, FightingStyle.ParryStrike],
  Specialist: [FightingStyle.AimedBlow, FightingStyle.StrikingAttack, FightingStyle.ParryStrike],
};

/** Map personality to preferred fighting styles for AI drafting */
export const PERSONALITY_STYLE_PREFS: Record<OwnerPersonality, FightingStyle[]> = {
  Aggressive: [
    FightingStyle.BashingAttack,
    FightingStyle.LungingAttack,
    FightingStyle.SlashingAttack,
    FightingStyle.StrikingAttack,
  ],
  Methodical: [FightingStyle.ParryStrike, FightingStyle.ParryRiposte, FightingStyle.WallOfSteel],
  Showman: [FightingStyle.AimedBlow, FightingStyle.SlashingAttack, FightingStyle.LungingAttack],
  Pragmatic: [FightingStyle.StrikingAttack, FightingStyle.ParryStrike, FightingStyle.WallOfSteel],
  Tactician: [FightingStyle.ParryRiposte, FightingStyle.ParryLunge, FightingStyle.AimedBlow],
};

export function getPhilosophyStyles(philosophy: string): FightingStyle[] {
  return PHILOSOPHY_TO_STYLES[philosophy] ?? Object.values(FightingStyle);
}
