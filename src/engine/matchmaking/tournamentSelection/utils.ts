import type { GameState, Warrior, TournamentEntry } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { aiPlanForWarrior, defaultPlanForWarrior } from '@/engine';

const warriorCache = new WeakMap<GameState, Map<string, Warrior>>();

export function findWarriorById(
  state: GameState,
  warriorId: string,
  tournament?: TournamentEntry
): Warrior | undefined {
  let map = warriorCache.get(state);
  if (!map) {
    map = new Map<string, Warrior>();
    for (let i = 0; i < state.roster.length; i++) {
      const w = state.roster[i];
      map.set(w.id, w);
    }
    for (let i = 0; i < state.rivals.length; i++) {
      const r = state.rivals[i];
      for (let j = 0; j < r.roster.length; j++) {
        const w = r.roster[j];
        map.set(w.id, w);
      }
    }
    warriorCache.set(state, map);
  }

  const w = map.get(warriorId);
  if (w) return w;

  if (tournament) {
    for (let i = 0; i < tournament.participants.length; i++) {
      if (tournament.participants[i].id === warriorId) {
        return tournament.participants[i];
      }
    }
  }

  return undefined;
}

export function getAIPlan(
  state: GameState,
  w: Warrior,
  opponentStyle?: FightingStyle,
  opponentOwnerId?: string
) {
  // warrior.stableId is rival.id (StableId), not owner.id
  const rival = state.rivals.find((r) => r.id === w.stableId);
  if (!rival) return { ...defaultPlanForWarrior(w), killDesire: 7 };

  let grudgeIntensity = 0;
  if (opponentOwnerId) {
    // 🛡️ 1.0 Hardening: Correctly identify grudge between owner and opponent
    const grudge = state.ownerGrudges?.find(
      (g) =>
        (g.ownerIdA === rival.owner.id && g.ownerIdB === opponentOwnerId) ||
        (g.ownerIdB === rival.owner.id && g.ownerIdA === opponentOwnerId)
    );
    grudgeIntensity = grudge?.intensity ?? 0;
  }

  return aiPlanForWarrior(
    w,
    rival.owner.personality || 'Pragmatic',
    rival.philosophy || 'Opportunist',
    opponentStyle,
    rival.strategy?.intent,
    grudgeIntensity
  );
}

export function generateFreelancer(tier: string, index: number, rng: SeededRNG): Warrior {
  const styles = Object.values(FightingStyle);
  const style = rng.pick(styles);
  const pool = tier === 'Gold' ? 120 : tier === 'Silver' ? 100 : tier === 'Bronze' ? 85 : 70;
  const attrs = { ST: 5, CN: 5, SZ: 10, WT: 10, WL: 10, SP: 5, DF: 5 };
  let remaining = pool - 50;
  const keys: (keyof typeof attrs)[] = ['ST', 'CN', 'SP', 'DF', 'WL', 'WT'];
  while (remaining > 0) {
    const key = rng.pick(keys);
    if (attrs[key] < 25) {
      attrs[key]++;
      remaining--;
    }
  }
  return makeWarrior(
    undefined,
    `Freelancer ${rng.pick(['Thrax', 'Murmillo', 'Kaeso'])} #${index}`,
    style,
    attrs,
    {},
    rng
  );
}
