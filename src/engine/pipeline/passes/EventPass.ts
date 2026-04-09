import type { GameState } from "@/types/state.types";
import { SeededRNG } from "@/utils/random";
import { updateEntityInList } from "@/utils/stateUtils";
import { generateId } from "@/utils/idUtils";
import narrativeContent from "@/data/narrativeContent.json";

/**
 * Stable Lords — Random Event Pipeline Pass
 */

function t(template: string, data: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }
  return result;
}

export function runEventPass(state: GameState, nextWeek: number, rootRng?: SeededRNG): GameState {
  const nextState = { ...state };
  const brawlRng = rootRng?.clone() ?? new SeededRNG(nextWeek * 999 + 1);
  
  // 🍺 Tavern Brawl Event
  if (brawlRng.next() < 0.05 && nextState.roster.length > 0) {
    const activeWarriors = nextState.roster.filter(w => w.status === "Active" && (!w.injuries || w.injuries.length === 0));
    if (activeWarriors.length > 0) {
      const brawlerIndex = Math.floor(brawlRng.next() * activeWarriors.length);
      const brawler = activeWarriors[brawlerIndex];
      const e = narrativeContent.events.tavern_brawl;
      
      nextState.roster = updateEntityInList(nextState.roster, brawler.id, (w) => ({
        ...w,
        fame: (w.fame || 0) + 5,
        injuries: [...(w.injuries || []), {
          id: generateId(brawlRng, "injury"),
          name: e.injury_name,
          description: e.injury_desc,
          severity: "Minor",
          weeksRemaining: 1,
          penalties: { ATT: -1 }
        }]
      }));

      nextState.newsletter = [...(nextState.newsletter || []), {
        id: generateId(brawlRng, "newsletter"),
        week: nextWeek,
        title: e.title,
        items: [t(brawlRng.pick(e.newsletter), { name: brawler.name, fame: 5 })]
      }];
    }
  }


  // ☄️ Star-crossed Blessing Event
  if (brawlRng.next() < 0.03 && nextState.roster.length > 0) {
    const youngWarriors = nextState.roster.filter(w => w.status === "Active" && (w.age || 0) <= 25);
    if (youngWarriors.length > 0) {
      const chosenIndex = Math.floor(brawlRng.next() * youngWarriors.length);
      const chosen = youngWarriors[chosenIndex];
      const e = narrativeContent.events.celestial_blessing;

      nextState.roster = updateEntityInList(nextState.roster, chosen.id, (w) => ({
        ...w,
        fame: (w.fame || 0) + 15,
        xp: (w.xp || 0) + 2
      }));

      nextState.newsletter = [...(nextState.newsletter || []), {
        id: generateId(brawlRng, "newsletter"),
        week: nextWeek,
        title: e.title,
        items: [t(brawlRng.pick(e.newsletter), { name: chosen.name, fame: 15, xp: 2 })]
      }];
    }
  }

  // 🏺 Lost Relic Discovery Event
  if (brawlRng.next() < 0.04 && nextState.roster.length > 0) {
    const activeWarriors = nextState.roster.filter(w => w.status === "Active");
    if (activeWarriors.length > 0) {
      const chosenIndex = Math.floor(brawlRng.next() * activeWarriors.length);
      const chosen = activeWarriors[chosenIndex];
      const e = narrativeContent.events.lost_relic;

      nextState.roster = updateEntityInList(nextState.roster, chosen.id, (w) => ({
        ...w,
        fame: (w.fame || 0) + 10,
        xp: (w.xp || 0) + 5
      }));

      nextState.newsletter = [...(nextState.newsletter || []), {
        id: generateId(brawlRng, "newsletter"),
        week: nextWeek,
        title: e.title,
        items: [t(brawlRng.pick(e.newsletter), { name: chosen.name, fame: 10, xp: 5 })]
      }];
    }
  }

  return nextState;
}
