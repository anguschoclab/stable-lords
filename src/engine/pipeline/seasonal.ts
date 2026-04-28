import type { GameState, NewsletterItem, LedgerEntry } from '@/types/state.types';
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import narrativeContent from '@/data/narrativeContent.json';
import { StateImpact } from '@/engine/impacts';
import { type WarriorId, type LedgerEntryId, type InsightId, type InjuryId } from '@/types/shared.types';
import type { InsightToken } from '@/types/state.types';

/**
 * Stable Lords — Seasonal Pipeline Pass (Offseason)
 * The Chaos Weaver 🎲
 */
function t(template: string, data: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
  }
  return result;
}

interface OffseasonEventNarrative {
  title: string;
  effectType: 'fame_boost' | 'winter_chill' | 'merchant_blessing' | 'epiphany' | 'tavern_brawl';
  newsletter: string[];
}

export function runSeasonalPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService
): StateImpact {
  // Only trigger on the transition to week 1 (off-season)
  if (nextWeek !== 1) {
    return {};
  }

  const seasonRng = rootRng || new SeededRNGService(state.year * 999 + 1);
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const newsletterItems: NewsletterItem[] = [];
  let treasuryDelta = 0;
  const ledgerEntries: LedgerEntry[] = [];
  const insightTokens: InsightToken[] = [];

  // Safe cast for our dynamic offseason data
  const events = (narrativeContent as any).offseason_events as
    | Record<string, OffseasonEventNarrative>
    | undefined;

  if (!events) {
    return {};
  }

  const eventKeys = Object.keys(events);
  if (eventKeys.length === 0) return {};

  const chosenEventKey = eventKeys[Math.floor(seasonRng.next() * eventKeys.length)]!;
  const e = events[chosenEventKey];

  if (!e) return {};

  if (e.effectType === 'fame_boost' && state.roster.length > 0) {
    const activeWarriors = state.roster.filter((w) => w.status === 'Active');
    if (activeWarriors.length > 0) {
      const chosen = activeWarriors[Math.floor(seasonRng.next() * activeWarriors.length)]!;
      rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + 25,
      });
      newsletterItems.push({
        id: seasonRng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(seasonRng.pick(e.newsletter) || '', { name: chosen.name, fame: 25 })],
      });
    }
  } else if (e.effectType === 'winter_chill') {
    // Costs some gold to heat the stable
    const cost = 150 + Math.floor(seasonRng.next() * 100);
    treasuryDelta -= cost;
    ledgerEntries.push({
      id: seasonRng.uuid('ledger') as LedgerEntryId,
      week: nextWeek,
      label: 'Winter Heating & Supplies',
      amount: -cost,
      category: 'other',
    });
    newsletterItems.push({
      id: seasonRng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(seasonRng.pick(e.newsletter) || '', { gold: cost })],
    });
  } else if (e.effectType === 'merchant_blessing') {
    // A traveling merchant donates to the stable
    const gold = 200 + Math.floor(seasonRng.next() * 200);
    treasuryDelta += gold;
    ledgerEntries.push({
      id: seasonRng.uuid('ledger') as LedgerEntryId,
      week: nextWeek,
      label: 'Offseason Sponsorship',
      amount: gold,
      category: 'other',
    });
    newsletterItems.push({
      id: seasonRng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(seasonRng.pick(e.newsletter) || '', { gold })],
    });
  } else if (e.effectType === 'epiphany') {
    const activeWarriors = state.roster.filter((w) => w.status === 'Active');
    if (activeWarriors.length > 0) {
      const chosen = seasonRng.pick(activeWarriors)!;

      rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + 10,
        xp: (chosen.xp || 0) + 15,
      });

      insightTokens.push({
        id: seasonRng.uuid('insight') as InsightId,
        type: 'Attribute',
        targetKey: 'ST',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Discovered a hidden reserve of strength during offseason meditation.',
        discoveredWeek: nextWeek,
      });

      newsletterItems.push({
        id: seasonRng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(seasonRng.pick(e.newsletter) || '', { name: chosen.name })],
      });
    }

  } else if (e.effectType === 'tavern_brawl') {
    const activeWarriors = state.roster.filter(
      (w) => w.status === 'Active' && (!w.injuries || w.injuries.length === 0)
    );
    if (activeWarriors.length > 0) {
      const chosen = seasonRng.pick(activeWarriors)!;
      const fameGained = 10 + Math.floor(seasonRng.next() * 11);

      const newInjury: InjuryData = {
        id: seasonRng.uuid('injury') as InjuryId,
        name: 'Bruised Ribs',
        description: 'Painful but manageable.',
        severity: 'Minor',
        weeksRemaining: 1 + Math.floor(seasonRng.next() * 2), // 1-2 weeks
        penalties: { CN: -1 },
      };

      const currentInjuries = chosen.injuries || [];

      rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + fameGained,
        injuries: [...currentInjuries, newInjury],
      });

      newsletterItems.push({
        id: seasonRng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(seasonRng.pick(e.newsletter) || '', { name: chosen.name, fame: fameGained })],
      });
    }
  }

  // Record this event in the State so the UI can pick it up
  const impact: StateImpact = {
    rosterUpdates,
    newsletterItems,
    ...(ledgerEntries.length > 0 ? { ledgerEntries } : {}),
    ...(treasuryDelta !== 0 ? { treasuryDelta } : {}),
    ...(insightTokens.length > 0 ? { insightTokens } : {}),
  };

  return impact;
}
