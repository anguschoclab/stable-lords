import type { GameState, NewsletterItem, LedgerEntry } from '@/types/state.types';
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import narrativeContent from '@/data/narrativeContent.json';
import { StateImpact } from '@/engine/impacts';
import {
  type WarriorId,
  type LedgerEntryId,
  type InsightId,
  type InjuryId,
} from '@/types/shared.types';
import type { InsightToken } from '@/types/state.types';

/**
 * Stable Lords — Seasonal Pipeline Pass (Offseason)
 * The Chaos Weaver 🎲
 */
function t(template: string, data: Record<string, string | number>): string {
  return template.replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, key) => {
    const value = data[key];
    return (value !== undefined && Object.hasOwn(data, key)) ? String(value) : match;
  });
}

interface OffseasonEventNarrative {
  title: string;
  effectType:
    | 'fame_boost'
    | 'winter_chill'
    | 'merchant_blessing'
    | 'epiphany'
    | 'tavern_brawl'
    | 'bards_song'
    | 'plague_outbreak'
    | 'black_market_raid'
    | 'grand_feast'
    | 'wandering_healer'
    | 'mystic_vision'
    | 'wild_animal_attack'
    | 'loyal_stray';
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
  const events = (
    narrativeContent as unknown as { offseason_events: Record<string, OffseasonEventNarrative> }
  ).offseason_events;

  if (!events) {
    return {};
  }

  const eventKeys = Object.keys(events);
  if (eventKeys.length === 0) return {};

  const chosenEventKey = seasonRng.pick(eventKeys);
  if (!chosenEventKey) return {};
  const e = events[chosenEventKey];

  if (!e) return {};

  if (e.effectType === 'fame_boost' && state.roster.length > 0) {
    const activeWarriors = state.roster.filter((w) => w.status === 'Active');
    if (activeWarriors.length > 0) {
      const chosen = seasonRng.pick(activeWarriors);
      if (!chosen) return {};
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
      const chosen = seasonRng.pick(activeWarriors);
      if (!chosen) return {};

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
      const chosen = seasonRng.pick(activeWarriors);
      if (!chosen) return {};
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
  } else if (e.effectType === 'bards_song') {
    const activeWarriors = state.roster.filter((w) => w.status === 'Active');
    if (activeWarriors.length > 0) {
      const chosen = seasonRng.pick(activeWarriors);
      if (!chosen) return {};
      const fameGained = 15 + Math.floor(seasonRng.next() * 20);
      rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + fameGained,
      });
      newsletterItems.push({
        id: seasonRng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(seasonRng.pick(e.newsletter) || '', { name: chosen.name, fame: fameGained })],
      });
    }
  } else if (e.effectType === 'plague_outbreak') {
    const activeWarriors = state.roster.filter(
      (w) => w.status === 'Active' && (!w.injuries || w.injuries.length === 0)
    );
    if (activeWarriors.length > 0) {
      const chosen = seasonRng.pick(activeWarriors);
      if (!chosen) return {};
      const fameLost = 5 + Math.floor(seasonRng.next() * 10);

      const newInjury: InjuryData = {
        id: seasonRng.uuid('injury') as InjuryId,
        name: 'Camp Fever',
        description: 'Leaves the victim weak and fatigued.',
        severity: 'Minor',
        weeksRemaining: 2 + Math.floor(seasonRng.next() * 2), // 2-3 weeks
        penalties: { CN: -2, ST: -1 },
      };

      const currentInjuries = chosen.injuries || [];

      rosterUpdates.set(chosen.id, {
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
        injuries: [...currentInjuries, newInjury],
      });

      newsletterItems.push({
        id: seasonRng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(seasonRng.pick(e.newsletter) || '', { name: chosen.name, fame: fameLost })],
      });
    }
  } else if (e.effectType === 'black_market_raid') {
    const activeWarriors = state.roster.filter((w) => w.status === 'Active');
    const goldLost = 50 + Math.floor(seasonRng.next() * 101); // 50-150 gold
    treasuryDelta -= goldLost;
    ledgerEntries.push({
      id: seasonRng.uuid('ledger') as LedgerEntryId,
      week: nextWeek,
      label: 'Black Market Fines',
      amount: -goldLost,
      category: 'other',
    });

    if (activeWarriors.length > 0) {
      const chosen = seasonRng.pick(activeWarriors);
      if (chosen) {
        newsletterItems.push({
          id: seasonRng.uuid('newsletter'),
          week: nextWeek,
          title: e.title,
          items: [t(seasonRng.pick(e.newsletter) || '', { name: chosen.name, gold: goldLost })],
        });
      }
    } else {
      newsletterItems.push({
        id: seasonRng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(seasonRng.pick(e.newsletter) || '', { name: 'Someone', gold: goldLost })],
      });
    }
  } else if (e.effectType === 'grand_feast') {
    const goldCost = 200 + Math.floor(seasonRng.next() * 201); // 200-400 gold
    treasuryDelta -= goldCost;
    ledgerEntries.push({
      id: seasonRng.uuid('ledger') as LedgerEntryId,
      week: nextWeek,
      label: 'Grand Feast Expenses',
      amount: -goldCost,
      category: 'other',
    });

    const activeWarriors = state.roster.filter((w) => w.status === 'Active');
    for (const w of activeWarriors) {
      rosterUpdates.set(w.id, {
        xp: (w.xp || 0) + 10,
      });
    }

    newsletterItems.push({
      id: seasonRng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(seasonRng.pick(e.newsletter) || '', { gold: goldCost })],
    });
  } else if (e.effectType === 'wandering_healer') {
    const goldCost = 50 + Math.floor(seasonRng.next() * 51); // 50-100 gold
    treasuryDelta -= goldCost;
    ledgerEntries.push({
      id: seasonRng.uuid('ledger') as LedgerEntryId,
      week: nextWeek,
      label: 'Medical Tonics',
      amount: -goldCost,
      category: 'medical',
    });

    const activeInjured = state.roster.filter(
      (w) => w.status === 'Active' && w.injuries && w.injuries.length > 0
    );

    if (activeInjured.length > 0) {
      const chosen = seasonRng.pick(activeInjured);
      if (chosen) {
        const remainingInjuries = [...(chosen.injuries || [])];
        if (remainingInjuries.length > 0) {
          // Remove a random injury
          const injuryIndex = Math.floor(seasonRng.next() * remainingInjuries.length);
          remainingInjuries.splice(injuryIndex, 1);
        }
        rosterUpdates.set(chosen.id, {
          injuries: remainingInjuries,
        });

        newsletterItems.push({
          id: seasonRng.uuid('newsletter'),
          week: nextWeek,
          title: e.title,
          items: [t(e.newsletter[0] || '', { name: chosen.name, gold: goldCost })],
        });
      }
    } else {
      newsletterItems.push({
        id: seasonRng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(e.newsletter[1] || '', { gold: goldCost })],
      });
    }
  } else if (e.effectType === 'mystic_vision') {
    const activeWarriors = state.roster.filter((w) => w.status === 'Active');
    if (activeWarriors.length > 0) {
      const chosen = seasonRng.pick(activeWarriors);
      if (!chosen) return {};

      rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + 15,
        fame: (chosen.fame || 0) + 10,
      });

      newsletterItems.push({
        id: seasonRng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(seasonRng.pick(e.newsletter) || '', { name: chosen.name, xp: 15, fame: 10 })],
      });
    }
  } else if (e.effectType === 'wild_animal_attack') {
    const activeWarriors = state.roster.filter(
      (w) => w.status === 'Active' && (!w.injuries || w.injuries.length === 0)
    );
    if (activeWarriors.length > 0) {
      const chosen = seasonRng.pick(activeWarriors);
      if (!chosen) return {};
      const fameGained = 5 + Math.floor(seasonRng.next() * 6); // 5-10 fame

      const newInjury: InjuryData = {
        id: seasonRng.uuid('injury') as InjuryId,
        name: 'Bite Wound',
        description: 'A nasty bite from a wild beast.',
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
  } else if (e.effectType === 'loyal_stray') {
    const goldCost = 25;
    treasuryDelta -= goldCost;
    ledgerEntries.push({
      id: seasonRng.uuid('ledger') as LedgerEntryId,
      week: nextWeek,
      label: 'Dog Food & Treats',
      amount: -goldCost,
      category: 'other',
    });

    const activeWarriors = state.roster.filter((w) => w.status === 'Active');
    if (activeWarriors.length > 0) {
      const chosen = seasonRng.pick(activeWarriors);
      if (chosen) {
        rosterUpdates.set(chosen.id, {
          xp: (chosen.xp || 0) + 10,
          fame: (chosen.fame || 0) + 5,
        });

        newsletterItems.push({
          id: seasonRng.uuid('newsletter'),
          week: nextWeek,
          title: e.title,
          items: [t(seasonRng.pick(e.newsletter) || '', { name: chosen.name })],
        });
      }
    } else {
      newsletterItems.push({
        id: seasonRng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(seasonRng.pick(e.newsletter) || '', { name: 'Someone' })],
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
