import type { GameState, NewsletterItem, LedgerEntry } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import narrativeContent from '@/data/narrativeContent.json';
import { StateImpact } from '@/engine/impacts';
import { type WarriorId, type InjuryId, type LedgerEntryId } from '@/types/shared.types';
import type { EventNarrative } from '@/types/narrative.types';

/**
 * Stable Lords — Random Event Pipeline Pass
 */
function t(template: string, data: Record<string, string | number>): string {
  return template.replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : match;
  });
}

export function runEventPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService
): StateImpact {
  const brawlRng = rootRng || new SeededRNGService(nextWeek * 999 + 1);
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const newsletterItems: NewsletterItem[] = [];
  let treasuryDelta = 0;
  const ledgerEntries: LedgerEntry[] = [];
  const events = narrativeContent.events as Record<string, EventNarrative>;

  // 🍺 Tavern Brawl Event
  if (brawlRng.next() < 0.05 && state.roster.length > 0) {
    const activeWarriors = state.roster.filter(
      (w) => w.status === 'Active' && (!w.injuries || w.injuries.length === 0)
    );
    if (activeWarriors.length > 0) {
      const brawler = brawlRng.pick(activeWarriors);
      const e = events.tavern_brawl;
      if (brawler && e) {
        rosterUpdates.set(brawler.id, {
          fame: (brawler.fame || 0) + 5,
          injuries: [
            ...(brawler.injuries || []),
            {
              id: brawlRng.uuid() as InjuryId,
              name: e.injury_name ?? 'Black Eye',
              description: e.injury_desc ?? 'Caught a nasty right hook in the tavern.',
              severity: 'Minor',
              weeksRemaining: 1,
              penalties: { ATT: -1 },
            },
          ],
        });

        newsletterItems.push({
          id: brawlRng.uuid('newsletter'),
          week: nextWeek,
          title: e.title,
          items: [t(brawlRng.pick(e.newsletter), { name: brawler.name, fame: 5 })],
          category: 'event',
        });
      }
    }
  }

  // ☄️ Star-crossed Blessing Event
  const blessingChance = state.weather === 'Mana Surge' ? 0.25 : 0.03;
  if (brawlRng.next() < blessingChance && state.roster.length > 0) {
    const youngWarriors = state.roster.filter((w) => w.status === 'Active' && (w.age || 0) <= 25);
    if (youngWarriors.length > 0) {
      const chosen = brawlRng.pick(youngWarriors);
      const e = events.celestial_blessing;
      if (chosen && e) {
        const existingUpdate = rosterUpdates.get(chosen.id) || {};
        rosterUpdates.set(chosen.id, {
          ...existingUpdate,
          fame: (chosen.fame || 0) + (existingUpdate.fame || 0) + 15,
          xp: (chosen.xp || 0) + (existingUpdate.xp || 0) + 2,
        });

        newsletterItems.push({
          id: brawlRng.uuid('newsletter'),
          week: nextWeek,
          title: e.title,
          items: [t(brawlRng.pick(e.newsletter), { name: chosen.name, fame: 15, xp: 2 })],
          category: 'event',
        });
      }
    }
  }

  // 🏺 Lost Relic Discovery Event
  if (brawlRng.next() < 0.04 && state.roster.length > 0) {
    const activeWarriors = state.roster.filter((w) => w.status === 'Active');
    if (activeWarriors.length > 0) {
      const chosen = brawlRng.pick(activeWarriors);
      const e = events.lost_relic;
      if (chosen && e) {
        const existingUpdate = rosterUpdates.get(chosen.id) || {};
        rosterUpdates.set(chosen.id, {
          ...existingUpdate,
          fame: (chosen.fame || 0) + (existingUpdate.fame || 0) + 10,
          xp: (chosen.xp || 0) + (existingUpdate.xp || 0) + 5,
        });

        newsletterItems.push({
          id: brawlRng.uuid('newsletter'),
          week: nextWeek,
          title: e.title,
          items: [t(brawlRng.pick(e.newsletter), { name: chosen.name, fame: 10, xp: 5 })],
          category: 'event',
        });
      }
    }
  }

  // 💰 Mysterious Patron Event
  if (brawlRng.next() < 0.05) {
    const e = events.mysterious_patron;
    if (e) {
      const gold = 100 + Math.floor(brawlRng.next() * 401); // 100-500 gold
      treasuryDelta += gold;
      ledgerEntries.push({
        id: brawlRng.uuid('ledger') as LedgerEntryId,
        week: nextWeek,
        label: 'Mysterious Patron Donation',
        amount: gold,
        category: 'other',
      });

      newsletterItems.push({
        id: brawlRng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(brawlRng.pick(e.newsletter), { gold })],
        category: 'event',
      });
    }
  }

  return {
    rosterUpdates,
    newsletterItems,
    ...(ledgerEntries.length > 0 ? { ledgerEntries } : {}),
    ...(treasuryDelta > 0 ? { treasuryDelta } : {}),
  };
}
