/**
 * Dynamic Orphanage Pool Generator
 * Generates randomized orphan warriors with thematic names, backstories,
 * personality traits, ages, and style-appropriate attribute spreads.
 */
import { FightingStyle } from '@/types/game';
import type { Attributes } from '@/types/game';
import type { AttributePotential } from '@/types/warrior.types';
import { generatePotential } from '@/engine/potential';
import { PERSONALITY_TRAITS, PERSONALITY_TRAIT_DATA } from '@/data/personalityTraits';
import { ARCHETYPE_NAMES } from '@/data/names/archetypeNames';
import { STYLE_ARCHETYPE, generateArchetypeAttrs } from '@/engine/factories/statGeneration';
import { generateLore, generateOrigin } from '@/engine/narrative/loreGenerator';

export interface OrphanWarrior {
  id: string;
  name: string;
  age: number;
  style: FightingStyle;
  attrs: Attributes;
  lore: string;
  trait: string;
  origin: string;
  potential: AttributePotential;
}

// ── RNG & Helpers ────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Generation Logic ─────────────────────────────────────────────────────

export function generateOrphanPool(count: number = 8, seed?: number): OrphanWarrior[] {
  const rng = seededRng(seed ?? Date.now());
  const styles = Object.values(FightingStyle);
  const usedNames = new Set<string>();
  const pool: OrphanWarrior[] = [];

  const guaranteedStyles = shuffled(
    [
      pick([FightingStyle.BashingAttack, FightingStyle.StrikingAttack], rng),
      pick([FightingStyle.LungingAttack, FightingStyle.SlashingAttack], rng),
      pick(
        [
          FightingStyle.AimedBlow,
          FightingStyle.ParryRiposte,
          FightingStyle.ParryLunge,
          FightingStyle.ParryStrike,
        ],
        rng
      ),
      pick([FightingStyle.TotalParry, FightingStyle.WallOfSteel], rng),
    ],
    rng
  );

  for (let i = 0; i < count; i++) {
    const style = i < guaranteedStyles.length ? guaranteedStyles[i] : pick(styles, rng);
    const archetype = STYLE_ARCHETYPE[style];

    // Combine the archetype name pool with the generic "tank" mixed pool for variety
    const namePool = [...ARCHETYPE_NAMES[archetype], ...ARCHETYPE_NAMES.tank].filter(
      (n) => !usedNames.has(n)
    );
    const name = namePool.length > 0 ? pick(namePool, rng) : `ORPHAN_${i}`;
    usedNames.add(name);

    const age = Math.floor(rng() * 5) + 15;
    const attrs = generateArchetypeAttrs(style, rng);
    const origin = generateOrigin(rng);
    const trait = pick(PERSONALITY_TRAITS, rng);
    const lore = generateLore(name, rng);

    const rarityRoll = rng();
    let tier: 'Common' | 'Promising' | 'Exceptional' | 'Prodigy' = 'Common';
    if (rarityRoll > 0.99) tier = 'Prodigy';
    else if (rarityRoll > 0.95) tier = 'Exceptional';
    else if (rarityRoll > 0.82) tier = 'Promising';

    const traitData = PERSONALITY_TRAIT_DATA[trait];
    if (traitData?.attrBonus) {
      for (const [key, bonus] of Object.entries(traitData.attrBonus)) {
        attrs[key as keyof Attributes] += bonus as number;
      }
    }

    const potential = generatePotential(attrs, tier, rng);

    pool.push({
      id: `orp_${i}_${Math.floor(rng() * 1e6)}`,
      name,
      age,
      style,
      attrs,
      lore,
      trait,
      origin,
      potential,
    });
  }

  return pool;
}

export { PERSONALITY_TRAIT_DATA as TRAIT_DATA };
