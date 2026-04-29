import { GameState, Warrior, BoutOffer } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';
import { getMoodModifiers } from '@/engine/crowdMood';
import { FightOutcome } from '@/types/combat.types';
import { fameFromTags } from '@/engine/fame';

export function validateBoutCombatants(currentW?: Warrior, currentO?: Warrior): boolean {
  return !!currentW && currentW.status === 'Active' && !!currentO;
}

export function getWinnerId(outcome: FightOutcome, wId: string, oId: string): string | null {
  if (outcome.winner === 'A') return wId;
  if (outcome.winner === 'D') return oId;
  return null;
}

export function calculateBoutFame(
  outcome: FightOutcome,
  tags: string[],
  moodMods: ReturnType<typeof getMoodModifiers>,
  isRivalry: boolean
) {
  const rawFameA = fameFromTags(outcome.winner === 'A' ? tags : []);
  const rawFameD = fameFromTags(outcome.winner === 'D' ? tags : []);
  return {
    fameA: Math.round(rawFameA.fame * moodMods.fameMultiplier * (isRivalry ? 2 : 1)),
    popA: Math.round(rawFameA.pop * moodMods.popMultiplier),
    fameD: Math.round(rawFameD.fame * moodMods.fameMultiplier),
    popD: Math.round(rawFameD.pop * moodMods.popMultiplier),
  };
}

export function processContractPayouts(
  state: GameState,
  contract: BoutOffer | undefined,
  winnerId: string | null,
  currentWId: string,
  currentOId: string,
  rivalStableId?: string
): StateImpact[] {
  if (!contract) return [];

  const impacts: StateImpact[] = [];
  const rivalsUpdates = new Map<string, any>();

  const purse = contract.purse;
  const showFee = Math.floor(purse * 0.2);

  // Find rivals
  const rivalA = state.rivals?.find((r) => r.roster.some((w) => w.id === currentWId));
  const rivalD = state.rivals?.find((r) => r.roster.some((w) => w.id === currentOId));

  // Player payouts go via treasuryDelta. Rival payouts are handled in
  // stableManager.weeklyIncome (which iterates arenaHistory and adds
  // FIGHT_PURSE / WIN_BONUS per bout) — paying them twice causes treasuries
  // to balloon into the millions. Multi-bout-per-tick clobbering on
  // rivalsUpdates' mapMerge would also lose payouts here, so the canonical
  // path is stableManager only.
  if (winnerId === currentWId) {
    if (!rivalA) impacts.push({ treasuryDelta: purse });
  } else if (winnerId === currentOId) {
    if (!rivalA) impacts.push({ treasuryDelta: showFee });
  } else {
    // Draw
    if (!rivalA) impacts.push({ treasuryDelta: showFee });
  }

  if (rivalsUpdates.size > 0) {
    impacts.push({ rivalsUpdates });
  }

  // Update Promoter History
  const updatedPromoters = { ...state.promoters };
  if (updatedPromoters[contract.promoterId]) {
    updatedPromoters[contract.promoterId] = {
      ...updatedPromoters[contract.promoterId],
      history: {
        ...updatedPromoters[contract.promoterId].history,
        totalPursePaid: (updatedPromoters[contract.promoterId].history.totalPursePaid || 0) + purse,
        notableBouts: [
          ...(updatedPromoters[contract.promoterId].history.notableBouts || []),
          `bout_${state.week}_${currentWId}_vs_${currentOId}`,
        ],
      },
    };
  }
  impacts.push({ promoters: updatedPromoters });

  // Close the contract
  const { [contract.id]: _, ...remainingBoutOffers } = state.boutOffers;
  impacts.push({ boutOffers: remainingBoutOffers });

  return impacts;
}

export function getDefaultPlan(w: Warrior, defaultPlanForWarrior: (w: Warrior) => any) {
  return w.plan ?? defaultPlanForWarrior(w);
}
