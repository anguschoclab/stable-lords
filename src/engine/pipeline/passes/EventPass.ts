import { GameState } from "@/types/game";
import { SeededRNG } from "@/utils/random";
import { updateEntityInList } from "@/utils/stateUtils";
import { generateId } from "@/utils/idUtils";

/**
 * Stable Lords — Random Event Pipeline Pass
 */

export function runEventPass(state: GameState, nextWeek: number, rootRng?: SeededRNG): GameState {
  const nextState = { ...state };
  const brawlRng = rootRng?.clone() ?? new SeededRNG(nextWeek * 999 + 1);
  
  // 🍺 Tavern Brawl Event
  if (brawlRng.next() < 0.05 && nextState.roster.length > 0) {
    const activeWarriors = nextState.roster.filter(w => w.status === "Active" && (!w.injuries || w.injuries.length === 0));
    if (activeWarriors.length > 0) {
      const brawlerIndex = Math.floor(brawlRng.next() * activeWarriors.length);
      const brawler = activeWarriors[brawlerIndex];
      
      nextState.roster = updateEntityInList(nextState.roster, brawler.id, (w) => ({
        ...w,
        fame: (w.fame || 0) + 5,
        injuries: [...(w.injuries || []), {
          id: generateId(),
          name: "Bruised knuckles (Tavern Brawl)",
          description: "Got into a scrap at the local tavern. The crowd loved it, but the hands took a beating.",
          severity: "Minor",
          weeksRemaining: 1,
          penalties: { ATT: -1 }
        }]
      }));

      nextState.newsletter = [...(nextState.newsletter || []), {
        week: nextWeek,
        title: "Tavern Brawl!",
        items: [`${brawler.name} got into a wild tavern brawl last night! They gained +5 Fame but suffered a minor injury.`]
      }];
    }
  }

  return nextState;
}
