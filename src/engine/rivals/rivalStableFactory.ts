/**
 * Rival Stable Factory - Generates rival stables from templates
 * Extracted from rivals.ts to follow SRP.
 *
 * **Intentional asymmetry (audited 2026-04-19)**: startup rivals are seeded
 * with `biasedAttrs`/`createRivalWarrior` rather than drawn from the player's
 * shared recruit pool (`recruitment.ts::generateRecruit`). This is a catch-up
 * scaffold — rivals need an initial roster before the recruit-pool pipeline
 * has had a chance to run. *Ongoing* rival recruitment (post-startup) goes
 * through `recruitmentWorker.ts` and signs from the same shared pool the
 * player sees. Don't "fix" the factory bias without also replacing the
 * startup-state warrior generator.
 */
import type { RivalStableData, Owner } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { StableTemplate } from '@/data/stableTemplates';
import { STABLE_TEMPLATES } from '@/data/stableTemplates';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { FightingStyle } from '@/types/shared.types';
import { generateCrest } from '../crest/crestGenerator';
import { biasedAttrs, createRivalWarrior } from './rivalWarriorFactory';
import { generateStableTrainers } from './rivalTrainerFactory';

/**
 * Gets stable templates.
 */
export function getStableTemplates(): StableTemplate[] {
  return [...STABLE_TEMPLATES];
}

/**
 * Generate rival stables from templates.
 * Scaling: Provides bonus gold and stats for expansion stables joining mid-game.
 */
export function generateRivalStables(
  count: number,
  seed: number,
  week: number = 0
): RivalStableData[] {
  const rng = new SeededRNGService(seed);
  const usedWarriorNames = new Set<string>();
  const rivals: RivalStableData[] = [];

  // Support for count > templates.length via over-sampling with procedural variance
  const iterations = Math.ceil(count / STABLE_TEMPLATES.length);
  const picked: { tmpl: StableTemplate; iteration: number }[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    const shuffled = [...STABLE_TEMPLATES].sort(() => rng.next() - 0.5);
    shuffled.forEach((tmpl) => {
      if (picked.length < count) {
        picked.push({ tmpl, iteration: iter });
      }
    });
  }

  for (let i = 0; i < picked.length; i++) {
    const { tmpl, iteration } = picked[i]!;
    const stableId = `rival_${i}`;

    // Procedural name variance for duplicates
    const nameSuffix =
      iteration > 0
        ? ` [${iteration === 1 ? 'II' : iteration === 2 ? 'III' : iteration === 3 ? 'IV' : 'V'}]`
        : '';
    const stableName = `${tmpl.stableName}${nameSuffix}`;
    const owner: Owner = {
      id: stableId,
      name:
        iteration > 0
          ? `${tmpl.ownerName} ${String.fromCharCode(64 + iteration + 1)}`
          : tmpl.ownerName,
      stableName: stableName,
      fame:
        tmpl.fameRange[0] + Math.floor(rng.next() * (tmpl.fameRange[1] - tmpl.fameRange[0] + 1)),
      renown: tmpl.tier === 'Legendary' ? 5 : tmpl.tier === 'Major' ? 2 : 0,
      titles:
        tmpl.tier === 'Legendary'
          ? 2 + Math.floor(rng.next() * 3)
          : tmpl.tier === 'Major'
            ? Math.floor(rng.next() * 3)
            : 0,
      personality: tmpl.personality,
      metaAdaptation: tmpl.metaAdaptation,
      favoredStyles: tmpl.preferredStyles,
      backstoryId: tmpl.backstoryId,
    };

    const [minR, maxR] = tmpl.rosterRange;
    const warriorCount = minR + Math.floor(rng.next() * (maxR - minR + 1));
    const warriors: Warrior[] = [];
    const namePool = [...tmpl.warriorNames].sort(() => rng.next() - 0.5);

    for (let j = 0; j < warriorCount; j++) {
      let wName = namePool.find((n) => !usedWarriorNames.has(n));
      if (!wName) wName = `${tmpl.stableName.split(' ').pop()?.toUpperCase()}_${j}`;
      usedWarriorNames.add(wName);

      const style =
        rng.next() < 0.7 && tmpl.preferredStyles.length > 0
          ? tmpl.preferredStyles[Math.floor(rng.next() * tmpl.preferredStyles.length)]!
          : Object.values(FightingStyle)[
              Math.floor(rng.next() * Object.values(FightingStyle).length)
            ]!;

      // Catch-up Attribute Scaling: +1 point per week (cap +40)
      const catchupStats = Math.min(40, week);
      const attrs = biasedAttrs(() => rng.next(), tmpl.attrBias, catchupStats);

      const wId = `rival_w_${i}_${j}`;
      const warrior = createRivalWarrior(wId, wName, style, attrs, stableId, tmpl.fameRange, rng);

      warriors.push(warrior);
    }

    const [minT, maxT] = tmpl.trainerRange;
    const trainers = generateStableTrainers(
      () => rng.next(),
      stableId,
      tmpl.philosophy,
      minT + Math.floor(rng.next() * (maxT - minT + 1)),
      tmpl.tier
    );

    const catchupGold = week * 50;
    const initialGold =
      (tmpl.tier === 'Legendary'
        ? 2000
        : tmpl.tier === 'Major'
          ? 1200
          : tmpl.tier === 'Established'
            ? 800
            : 500) + catchupGold;

    // Generate crest for this stable
    const crestSeed = Math.floor(rng.next() * 100000);
    const crest = generateCrest({
      seed: crestSeed,
      philosophy: tmpl.philosophy,
      tier: tmpl.tier,
    });

    rivals.push({
      id: stableId,
      owner: {
        ...owner,
        generation: 0,
      },
      roster: warriors,
      treasury: initialGold,
      motto: tmpl.motto,
      origin: tmpl.origin,
      philosophy: tmpl.philosophy,
      tier: tmpl.tier,
      trainers,
      strategy: {
        intent: iteration % 3 === 0 ? 'EXPANSION' : 'CONSOLIDATION',
        planWeeksRemaining: 4 + Math.floor(rng.next() * 4),
      },
      agentMemory: {
        lastTreasury: initialGold,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
      },
      actionHistory: [],
      fame: iteration > 0 ? 50 + iteration * 100 : 0,
      crest,
    });
  }
  return rivals;
}
