import type { GameState, RivalStableData, RestState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import { rollForInjury } from '@/engine/injuries';
import { addRestState } from '@/engine/matchmaking/historyLogic';
import { updateEntityInList } from '@/utils/stateUtils';
import { StateImpact } from '@/engine/impacts';

export function handleInjuries(
  s: GameState,
  wA: Warrior,
  wD: Warrior,
  outcome: FightOutcome,
  week: number,
  rivalStableId?: string,
  seed?: number
) {
  let injured = false;
  const names: string[] = [];
  const rosterUpdates = new Map<string, Partial<Warrior>>();
  const rivalsUpdates = new Map<string, Partial<RivalStableData>>();
  const restStates: RestState[] = [];

  if (outcome.by === 'KO') {
    const victimId = outcome.winner === 'A' ? wD.id : wA.id;
    restStates.push(...addRestState([], victimId, 'KO', week));
  }

  // 1. Process Warrior A
  const injA = rollForInjury(wA, outcome, 'A', seed);
  if (injA) {
    injured = true;
    names.push(wA.name);
    const isPlayer = s.roster.some((w) => w.id === wA.id);
    if (isPlayer) {
      const existing = rosterUpdates.get(wA.id) || wA;
      rosterUpdates.set(wA.id, { ...existing, injuries: [...(existing.injuries || []), injA] });
    } else if (rivalStableId) {
      // rivalStableId is set from `rival.id` (StableId) by pairings/world bouts,
      // not owner.id. Looking up by owner.id silently dropped every rival
      // injury — they remained completely unmaimed across the whole sim.
      const rival = (s.rivals || []).find((r) => r.id === rivalStableId);
      if (rival) {
        const updatedRoster = updateEntityInList(rival.roster, wA.id, (w) => ({
          ...w,
          injuries: [...(w.injuries || []), injA],
        }));
        rivalsUpdates.set(rivalStableId, { roster: updatedRoster });
      }
    }
  }

  // 2. Process Warrior D
  const injD = rollForInjury(wD, outcome, 'D', seed ? seed + 1 : undefined);
  if (injD) {
    injured = true;
    names.push(wD.name);
    const isPlayer = s.roster.some((w) => w.id === wD.id);
    if (isPlayer) {
      const existing = rosterUpdates.get(wD.id) || wD;
      rosterUpdates.set(wD.id, { ...existing, injuries: [...(existing.injuries || []), injD] });
    } else if (rivalStableId) {
      // rivalStableId is set from `rival.id` (StableId) by pairings/world bouts,
      // not owner.id. Looking up by owner.id silently dropped every rival
      // injury — they remained completely unmaimed across the whole sim.
      const rival = (s.rivals || []).find((r) => r.id === rivalStableId);
      if (rival) {
        const updatedRoster = updateEntityInList(rival.roster, wD.id, (w) => ({
          ...w,
          injuries: [...(w.injuries || []), injD],
        }));
        rivalsUpdates.set(rivalStableId, { roster: updatedRoster });
      }
    }
  }

  const impact: StateImpact = {
    rosterUpdates,
    rivalsUpdates,
    restStates,
  };

  return { impact, injured, injuredNames: names };
}
