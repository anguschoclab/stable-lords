import type {
  GameState,
  RivalStableData,
  OwnerPersonality,
  OwnerGrudge,
} from '@/types/state.types';
import { getRecentFights } from '@/engine/core/historyUtils';
import { PERSONALITY_CLASH } from '@/data/ownerData';

/**
 * Detect and escalate owner-to-owner grudges based on personality clashes
 * and recent kill/loss history between stables.
 */
export function processOwnerGrudges(
  state: GameState,
  existingGrudges: OwnerGrudge[]
): { grudges: OwnerGrudge[]; gazetteItems: string[] } {
  const grudges = existingGrudges.map((g) => ({ ...g }));
  const gazetteItems: string[] = [];
  const rivals = state.rivals || [];

  // Check for personality clashes between stables that have recently fought
  const recentFights = getRecentFights(state.arenaHistory, state.week - 13);

  for (let i = 0; i < rivals.length; i++) {
    for (let j = i + 1; j < rivals.length; j++) {
      const rA = rivals[i];
      const rB = rivals[j];
      const persA = rA.owner.personality;
      const persB = rB.owner.personality;
      if (!persA || !persB) continue;

      // Check if personalities naturally clash
      const clash =
        PERSONALITY_CLASH[persA]?.includes(persB) || PERSONALITY_CLASH[persB]?.includes(persA);
      if (!clash) continue;

      // Check if they've had kills against each other recently
      const aNamesSet = new Set(rA.roster.map((w) => w.name));
      const bNamesSet = new Set(rB.roster.map((w) => w.name));

      let hasCrossFight = false;
      let hasKill = false;

      for (let k = 0; k < recentFights.length; k++) {
        const f = recentFights[k];
        const isCrossFight =
          (aNamesSet.has(f.a) && bNamesSet.has(f.d)) || (bNamesSet.has(f.a) && aNamesSet.has(f.d));

        if (isCrossFight) {
          hasCrossFight = true;
          if (f.by === 'Kill') {
            hasKill = true;
            break;
          }
        }
      }

      if (!hasCrossFight) continue;

      const existing = grudges.find(
        (g) =>
          (g.ownerIdA === rA.owner.id && g.ownerIdB === rB.owner.id) ||
          (g.ownerIdB === rA.owner.id && g.ownerIdA === rB.owner.id)
      );

      if (existing) {
        if (hasKill && existing.lastEscalation < state.week - 4) {
          existing.intensity = Math.min(5, existing.intensity + 1);
          existing.lastEscalation = state.week;
          existing.reason = `Blood spilled between ${rA.owner.stableName} and ${rB.owner.stableName}`;
          gazetteItems.push(
            `🔥 GRUDGE DEEPENS: ${rA.owner.name} (${persA}) and ${rB.owner.name} (${persB}) — their feud intensifies after another kill!`
          );
        }
      } else if (hasKill) {
        grudges.push({
          id: `grudge_${rA.owner.id}_${rB.owner.id}`,
          ownerIdA: rA.owner.id,
          ownerIdB: rB.owner.id,
          intensity: 2,
          reason: `Personality clash: ${persA} vs ${persB} — ignited by bloodshed`,
          startWeek: state.week,
          lastEscalation: state.week,
        });
        gazetteItems.push(
          `⚔️ NEW RIVALRY: ${rA.owner.name} the ${persA} and ${rB.owner.name} the ${persB} have declared a blood feud!`
        );
      }
    }
  }

  // Decay old grudges
  for (const g of grudges) {
    if (state.week - g.lastEscalation > 26 && g.intensity > 1) {
      g.intensity = Math.max(1, g.intensity - 1);
    }
  }

  return { grudges: grudges.filter((g) => g.intensity > 0), gazetteItems };
}

/**
 * Calculate rivalry intensity adjustment based on match outcomes.
 * Base (bouts fought) + Death (+5) + Upset (+3).
 */
export function calculateRivalryScore(
  boutsFought: number,
  deathsCount: number,
  upsetsCount: number
): number {
  let score = 0;
  score += Math.floor(boutsFought / 3);
  score += deathsCount * 5;
  score += upsetsCount * 3;
  return Math.max(1, Math.min(5, score));
}
