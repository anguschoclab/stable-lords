import type {
  GameState,
  Owner,
  OwnerPersonality,
  MetaAdaptation,
  RivalStableData,
} from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

export type BackstoryId =
  | 'gladiator'
  | 'merchant'
  | 'noble'
  | 'veteran'
  | 'scholar'
  | 'outcast'
  | 'cutpurse'
  | 'priest'
  | 'sellsword';

export interface BackstoryEconomy {
  treasuryDelta?: number;
  fameDelta?: number;
  renownDelta?: number;
  rosterBonusDelta?: number;
}

export interface BackstoryIdentitySeed {
  personalityWeights: Partial<Record<OwnerPersonality, number>>;
  metaAdaptationWeights: Partial<Record<MetaAdaptation, number>>;
  favoredStyles?: FightingStyle[];
}

export interface BackstoryDef {
  id: BackstoryId;
  name: string;
  tagline: string;
  lore: string;
  bonusSummary: string[];
  economy: BackstoryEconomy;
  identitySeed: BackstoryIdentitySeed;
}

export const BACKSTORIES: Record<BackstoryId, BackstoryDef> = {
  gladiator: {
    id: 'gladiator',
    name: 'Former Gladiator',
    tagline: 'You bled in the sand. Now others will.',
    lore: 'A champion of the arena, you traded your sword for a ledger. The crowd still chants your name.',
    bonusSummary: ['+5 Fame', '+3 Renown', '+0.5 Roster Bonus'],
    economy: { treasuryDelta: -100, fameDelta: 5, renownDelta: 3, rosterBonusDelta: 0.5 },
    identitySeed: {
      personalityWeights: { Aggressive: 40, Showman: 30, Methodical: 20, Pragmatic: 10 },
      metaAdaptationWeights: { Traditionalist: 40, Innovator: 20, Opportunist: 20, MetaChaser: 20 },
      favoredStyles: [FightingStyle.StrikingAttack, FightingStyle.BashingAttack],
    },
  },
  merchant: {
    id: 'merchant',
    name: 'Rich Merchant',
    tagline: 'Steel is just another commodity.',
    lore: 'Your caravans crisscrossed the realm. Now you trade in flesh and glory.',
    bonusSummary: ['+500 Gold', '-2 Renown'],
    economy: { treasuryDelta: 500, renownDelta: -2 },
    identitySeed: {
      personalityWeights: { Pragmatic: 50, Methodical: 30, Showman: 20 },
      metaAdaptationWeights: { Opportunist: 50, MetaChaser: 30, Innovator: 20 },
    },
  },
  noble: {
    id: 'noble',
    name: 'Highborn Noble',
    tagline: 'Blood is currency, and yours is pure.',
    lore: 'Your house is older than the colosseum. Your servants carry your honors.',
    bonusSummary: ['+200 Gold', '+10 Fame', '+2 Renown'],
    economy: { treasuryDelta: 200, fameDelta: 10, renownDelta: 2 },
    identitySeed: {
      personalityWeights: { Methodical: 40, Showman: 30, Tactician: 30 },
      metaAdaptationWeights: { Traditionalist: 50, Innovator: 25, Opportunist: 25 },
      favoredStyles: [FightingStyle.ParryRiposte, FightingStyle.AimedBlow],
    },
  },
  veteran: {
    id: 'veteran',
    name: 'Veteran Soldier',
    tagline: "You've led men to die. Now they die for your profit.",
    lore: 'A campaign officer who traded the banner for the gate. You know drill, discipline, and survival.',
    bonusSummary: ['+2 Fame', '+2 Renown', '+1 Roster Bonus'],
    economy: { fameDelta: 2, renownDelta: 2, rosterBonusDelta: 1 },
    identitySeed: {
      personalityWeights: { Tactician: 40, Methodical: 40, Pragmatic: 20 },
      metaAdaptationWeights: { Traditionalist: 60, Opportunist: 40 },
      favoredStyles: [FightingStyle.WallOfSteel, FightingStyle.StrikingAttack],
    },
  },
  scholar: {
    id: 'scholar',
    name: 'Scholar of Arms',
    tagline: 'You studied the blade before you held it.',
    lore: 'Treatises, drills, and ancient manuals. Combat is a science and you are its practitioner.',
    bonusSummary: ['-100 Gold', '+4 Renown'],
    economy: { treasuryDelta: -100, renownDelta: 4 },
    identitySeed: {
      personalityWeights: { Methodical: 60, Tactician: 40 },
      metaAdaptationWeights: { Innovator: 60, Traditionalist: 40 },
      favoredStyles: [FightingStyle.ParryRiposte, FightingStyle.AimedBlow],
    },
  },
  outcast: {
    id: 'outcast',
    name: 'Arena Outcast',
    tagline: 'They cast you out. You bought the gate.',
    lore: 'Exiled, branded, forgotten — and back with a chip on your shoulder and coin in your fist.',
    bonusSummary: ['+300 Gold', '-3 Fame'],
    economy: { treasuryDelta: 300, fameDelta: -3 },
    identitySeed: {
      personalityWeights: { Aggressive: 40, Pragmatic: 40, Showman: 20 },
      metaAdaptationWeights: { Opportunist: 60, MetaChaser: 40 },
      favoredStyles: [FightingStyle.LungingAttack, FightingStyle.BashingAttack],
    },
  },
  cutpurse: {
    id: 'cutpurse',
    name: 'Former Cutpurse',
    tagline: 'You lifted a fortune off better men.',
    lore: 'Back-alley knife-work funded this stable. The guild still sends you Winter gifts.',
    bonusSummary: ['+250 Gold', '-3 Fame'],
    economy: { treasuryDelta: 250, fameDelta: -3 },
    identitySeed: {
      personalityWeights: { Pragmatic: 50, Tactician: 50 },
      metaAdaptationWeights: { Opportunist: 60, Innovator: 40 },
      favoredStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack],
    },
  },
  priest: {
    id: 'priest',
    name: 'Temple-Raised Priest',
    tagline: 'The gods demand a worthy offering.',
    lore: 'The temple taught you steel as well as scripture. Every fight is a sacrament.',
    bonusSummary: ['-50 Gold', '+3 Fame', '+5 Renown', '+0.5 Roster Bonus'],
    economy: { treasuryDelta: -50, fameDelta: 3, renownDelta: 5, rosterBonusDelta: 0.5 },
    identitySeed: {
      personalityWeights: { Methodical: 50, Pragmatic: 30, Tactician: 20 },
      metaAdaptationWeights: { Traditionalist: 80, Opportunist: 20 },
      favoredStyles: [FightingStyle.WallOfSteel, FightingStyle.ParryRiposte],
    },
  },
  sellsword: {
    id: 'sellsword',
    name: 'Wandering Sellsword',
    tagline: 'Every contract taught you something.',
    lore: "A hundred banners, a hundred scars. You'll bleed for anyone who pays.",
    bonusSummary: ['+100 Gold', '+0.5 Roster Bonus'],
    economy: { treasuryDelta: 100, rosterBonusDelta: 0.5 },
    identitySeed: {
      personalityWeights: { Pragmatic: 60, Aggressive: 40 },
      metaAdaptationWeights: { Opportunist: 50, MetaChaser: 30, Innovator: 20 },
    },
  },
};

export const BACKSTORY_LIST: BackstoryDef[] = Object.values(BACKSTORIES);
export const BACKSTORY_IDS: BackstoryId[] = BACKSTORY_LIST.map((b) => b.id);

/** Roll a key from a weight map. Falls back to first key if weights are empty. */
function rollWeighted<K extends string>(weights: Partial<Record<K, number>>, rng: IRNGService): K {
  const entries = Object.entries(weights) as [K, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return entries[0]?.[0] as K;
  let roll = rng.next() * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll <= 0) return key;
  }
  const fallback = entries[entries.length - 1];
  if (!fallback) {
    throw new Error('No entries available for weighted roll');
  }
  return fallback[0];
}

/** Apply economy deltas to an Owner's fame/renown/titles-adjacent stats. */
function applyEconomyToOwner(owner: Owner, econ: BackstoryEconomy): void {
  if (econ.fameDelta) owner.fame = (owner.fame ?? 0) + econ.fameDelta;
  if (econ.renownDelta) owner.renown = (owner.renown ?? 0) + econ.renownDelta;
}

/** Seed personality/metaAdaptation/favoredStyles on an Owner if they aren't already set. */
function seedIdentity(owner: Owner, seed: BackstoryIdentitySeed, rng: IRNGService): void {
  if (!owner.personality) owner.personality = rollWeighted(seed.personalityWeights, rng);
  if (!owner.metaAdaptation) owner.metaAdaptation = rollWeighted(seed.metaAdaptationWeights, rng);
  if (!owner.favoredStyles && seed.favoredStyles) owner.favoredStyles = [...seed.favoredStyles];
}

/**
 * Apply a backstory to the player. Mutates `state.player` and top-level economy fields.
 * Seeds player personality/metaAdaptation/favoredStyles so the player joins NPC-parity systems.
 */
export function applyBackstoryToPlayer(state: GameState, id: BackstoryId, rng: IRNGService): void {
  const def = BACKSTORIES[id];
  if (!def) return;
  state.player.backstoryId = id;
  applyEconomyToOwner(state.player, def.economy);
  if (def.economy.treasuryDelta) state.treasury += def.economy.treasuryDelta;
  if (def.economy.fameDelta) state.fame += def.economy.fameDelta;
  if (def.economy.rosterBonusDelta) state.rosterBonus += def.economy.rosterBonusDelta;
  seedIdentity(state.player, def.identitySeed, rng);
}
