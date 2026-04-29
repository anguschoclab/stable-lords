import type { GameState, NewsletterItem, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import type { FightOutcome } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { calculateXP, applyXP } from '@/engine/progression';
import { checkDiscovery } from '@/engine/favorites';
import { generateId } from '@/utils/idUtils';
import { StateImpact } from '@/engine/impacts';

/**
 * Routes a per-warrior update to either the player's rosterUpdates map or to
 * the warrior's owning rival's rivalsUpdates map. Resolves ownership by:
 *   1. warrior.stableId (set on rival warriors by recruitment / aging)
 *   2. presence in state.roster (player)
 *   3. fallback: scan rivals.roster for warrior.id
 *
 * Pre-2026-04 the entire progression handler only wrote to rosterUpdates,
 * which silently dropped every update for rival warriors — meaning rival
 * warriors NEVER gained XP and NEVER discovered favorites. All progression
 * was player-only. World bouts produced zero rival progression.
 */
function routeUpdate(
  s: GameState,
  warrior: Warrior,
  partial: Partial<Warrior>,
  rosterUpdates: Map<WarriorId, Partial<Warrior>>,
  rivalsUpdates: Map<StableId, Partial<RivalStableData>>
): void {
  const isPlayer =
    s.player?.id === warrior.stableId || (s.roster || []).some((w) => w.id === warrior.id);
  if (isPlayer) {
    const existing = rosterUpdates.get(warrior.id) ?? {};
    rosterUpdates.set(warrior.id, { ...existing, ...partial });
    return;
  }
  // Find owning rival
  const rival = (s.rivals || []).find(
    (r) => r.id === warrior.stableId || r.roster.some((w) => w.id === warrior.id)
  );
  if (!rival) return;
  const existingRival = rivalsUpdates.get(rival.id);
  const baseRoster = (existingRival?.roster as Warrior[] | undefined) ?? rival.roster;
  const updatedRoster = baseRoster.map((w) => (w.id === warrior.id ? { ...w, ...partial } : w));
  rivalsUpdates.set(rival.id, { ...existingRival, roster: updatedRoster });
}

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
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
  const newsletterItems: NewsletterItem[] = [];

  // XP for both fighters — routed to the right roster regardless of ownership
  const updatedA = applyXP(wA, calculateXP(outcome, 'A', tags), rng).warrior;
  routeUpdate(s, wA, updatedA, rosterUpdates, rivalsUpdates);

  const updatedD = applyXP(wD, calculateXP(outcome, 'D', tags), rng).warrior;
  routeUpdate(s, wD, updatedD, rosterUpdates, rivalsUpdates);

  // Favorites discovery — also for both fighters (was player-only)
  const discRng = rng;
  for (const w of [wA, wD]) {
    const disc = checkDiscovery(w, () => discRng?.next() ?? 0.5);
    if (disc.updated) {
      routeUpdate(s, w, { favorites: w.favorites }, rosterUpdates, rivalsUpdates);
      if (disc.hints.length > 0) {
        newsletterItems.push({
          id: discRng ? discRng.uuid() : generateId(undefined, 'newsletter'),
          week,
          title: 'Training Insight',
          items: disc.hints,
        });
      }
    }
  }

  // Upset / Giant Killer Flair — also routed
  if (outcome.winner) {
    const winner = outcome.winner === 'A' ? wA : wD;
    const loser = outcome.winner === 'A' ? wD : wA;
    if (
      loser.fame >= (winner.fame || 0) + 10 &&
      (loser.fame || 0) >= (winner.fame || 0) * 2 &&
      !winner.flair.includes('Giant Killer')
    ) {
      routeUpdate(
        s,
        winner,
        { flair: [...(winner.flair || []), 'Giant Killer'] },
        rosterUpdates,
        rivalsUpdates
      );
    }
  }
  // Suppress the unused-import lint while keeping the marker for future use
  void rivalStableId;

  const impact: StateImpact = { rosterUpdates, rivalsUpdates };
  if (newsletterItems.length > 0) impact.newsletterItems = newsletterItems;
  return impact;
}
