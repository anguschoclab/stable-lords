import type { GameState, NewsletterItem } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { calculateXP, applyXP } from '@/engine/progression';
import { checkDiscovery } from '@/engine/favorites';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { updateEntityInList } from '@/utils/stateUtils';
import { generateId } from '@/utils/idUtils';
import { StateImpact } from '@/engine/impacts';

export function handleProgressions(
  s: GameState,
  wA: Warrior,
  wD: Warrior,
  outcome: FightOutcome,
  tags: string[],
  week: number,
  rivalStableId?: string,
  rng?: IRNGService
): StateImpact {
  const rosterUpdates = new Map<string, Partial<Warrior>>();
  const newsletterItems: NewsletterItem[] = [];

  // XP
  const updatedA = applyXP(wA, calculateXP(outcome, 'A', tags), rng).warrior;
  rosterUpdates.set(wA.id, updatedA);

  if (!rivalStableId) {
    const updatedD = applyXP(wD, calculateXP(outcome, 'D', tags), rng).warrior;
    rosterUpdates.set(wD.id, updatedD);
  }

  // Favorites Discovery
  const discRng = rng ?? new SeededRNGService(Date.now());
  [wA, !rivalStableId ? wD : null].forEach((w) => {
    if (!w) return;
    const disc = checkDiscovery(w, discRng);
    if (disc.updated) {
      const existing = rosterUpdates.get(w.id) || w;
      rosterUpdates.set(w.id, { ...existing, favorites: w.favorites });
      if (disc.hints.length > 0) {
        newsletterItems.push({
          id: discRng ? discRng.uuid() : generateId(undefined, 'newsletter'),
          week,
          title: 'Training Insight',
          items: disc.hints,
        });
      }
    }
  });

  // Upset / Giant Killer Flair
  if (outcome.winner) {
    const winner = outcome.winner === 'A' ? wA : wD;
    const loser = outcome.winner === 'A' ? wD : wA;
    if (
      loser.fame >= (winner.fame || 0) + 10 &&
      (loser.fame || 0) >= (winner.fame || 0) * 2 &&
      !winner.flair.includes('Giant Killer')
    ) {
      const existing = rosterUpdates.get(winner.id) || winner;
      rosterUpdates.set(winner.id, {
        ...existing,
        flair: [...(existing.flair || []), 'Giant Killer'],
      });
    }
  }

  const impact: StateImpact = { rosterUpdates };
  if (newsletterItems.length > 0) impact.newsletterItems = newsletterItems;
  return impact;
}
