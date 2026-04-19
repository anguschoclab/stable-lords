import type { GameState, NewsletterItem, LedgerEntry } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { generateId } from "@/utils/idUtils";
import narrativeContent from "@/data/narrativeContent.json";
import { StateImpact } from "@/engine/impacts";
import { type WarriorId, type InjuryId, type LedgerEntryId } from "@/types/shared.types";

/**
 * Stable Lords — Random Event Pipeline Pass
 */
export const PASS_METADATA = {
  name: "EventPass",
  dependencies: ["RivalStrategyPass"]
};

function t(template: string, data: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }
  return result;
}

interface EventNarrative {
  title: string;
  injury_name: string;
  injury_desc: string;
  newsletter: string[];
}

export function runEventPass(state: GameState, nextWeek: number, rootRng?: IRNGService): StateImpact {
  const brawlRng = rootRng || new SeededRNGService(nextWeek * 999 + 1);
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const newsletterItems: NewsletterItem[] = [];
  let treasuryDelta = 0;
  const ledgerEntries: LedgerEntry[] = [];
  const events = narrativeContent.events as Record<string, EventNarrative>;
  
  // 🍺 Tavern Brawl Event
  if (brawlRng.next() < 0.05 && state.roster.length > 0) {
    const activeWarriors = state.roster.filter(w => w.status === "Active" && (!w.injuries || w.injuries.length === 0));
    if (activeWarriors.length > 0) {
      const brawlerIndex = Math.floor(brawlRng.next() * activeWarriors.length);
      const brawler = activeWarriors[brawlerIndex];
      const e = events.tavern_brawl;
      
      rosterUpdates.set(brawler.id, {
        fame: (brawler.fame || 0) + 5,
        injuries: [...(brawler.injuries || []), {
          id: brawlRng.uuid() as InjuryId,
          name: e.injury_name,
          description: e.injury_desc,
          severity: "Minor",
          weeksRemaining: 1,
          penalties: { ATT: -1 }
        }]
      });

      newsletterItems.push({
        id: generateId(brawlRng, "newsletter"),
        week: nextWeek,
        title: e.title,
        items: [t(brawlRng.pick(e.newsletter), { name: brawler.name, fame: 5 })]
      });
    }
  }


  // ☄️ Star-crossed Blessing Event
  if (brawlRng.next() < 0.03 && state.roster.length > 0) {
    const youngWarriors = state.roster.filter(w => w.status === "Active" && (w.age || 0) <= 25);
    if (youngWarriors.length > 0) {
      const chosenIndex = Math.floor(brawlRng.next() * youngWarriors.length);
      const chosen = youngWarriors[chosenIndex];
      const e = events.celestial_blessing;

      const existingUpdate = rosterUpdates.get(chosen.id) || {};
      rosterUpdates.set(chosen.id, {
        ...existingUpdate,
        fame: (chosen.fame || 0) + (existingUpdate.fame || 0) + 15,
        xp: (chosen.xp || 0) + (existingUpdate.xp || 0) + 2
      });

      newsletterItems.push({
        id: generateId(brawlRng, "newsletter"),
        week: nextWeek,
        title: e.title,
        items: [t(brawlRng.pick(e.newsletter), { name: chosen.name, fame: 15, xp: 2 })]
      });
    }
  }

  // 🏺 Lost Relic Discovery Event
  if (brawlRng.next() < 0.04 && state.roster.length > 0) {
    const activeWarriors = state.roster.filter(w => w.status === "Active");
    if (activeWarriors.length > 0) {
      const chosenIndex = Math.floor(brawlRng.next() * activeWarriors.length);
      const chosen = activeWarriors[chosenIndex];
      const e = events.lost_relic;

      const existingUpdate = rosterUpdates.get(chosen.id) || {};
      rosterUpdates.set(chosen.id, {
        ...existingUpdate,
        fame: (chosen.fame || 0) + (existingUpdate.fame || 0) + 10,
        xp: (chosen.xp || 0) + (existingUpdate.xp || 0) + 5
      });

      newsletterItems.push({
        id: generateId(brawlRng, "newsletter"),
        week: nextWeek,
        title: e.title,
        items: [t(brawlRng.pick(e.newsletter), { name: chosen.name, fame: 10, xp: 5 })]
      });
    }
  }


  // 💰 Mysterious Patron Event
  if (brawlRng.next() < 0.05) {
    const e = events.mysterious_patron;
    const gold = 100 + Math.floor(brawlRng.next() * 401); // 100-500 gold
    treasuryDelta += gold;
    ledgerEntries.push({
      id: generateId(brawlRng, "ledger") as LedgerEntryId,
      week: nextWeek,
      label: "Mysterious Patron Donation",
      amount: gold,
      category: "other"
    });

    newsletterItems.push({
      id: generateId(brawlRng, "newsletter"),
      week: nextWeek,
      title: e.title,
      items: [t(brawlRng.pick(e.newsletter), { gold })]
    });
  }

  return { rosterUpdates, newsletterItems, ...(ledgerEntries.length > 0 ? { ledgerEntries } : {}), ...(treasuryDelta > 0 ? { treasuryDelta } : {}) };

}
