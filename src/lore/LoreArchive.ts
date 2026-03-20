/**
 * Lore Archive — persists fight summaries and Hall of Fights entries.
 */
import type { FightSummary, HallEntry } from "@/types/game";

const KEY_FIGHTS = "sl.lore.fights";
const KEY_HALL = "sl.lore.hall";

function loadArray<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function saveArray<T>(key: string, arr: T[]) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(arr));
  }
}

export const LoreArchive = {
  allFights(): FightSummary[] {
    return loadArray<FightSummary>(KEY_FIGHTS);
  },

  allHall(): HallEntry[] {
    return loadArray<HallEntry>(KEY_HALL);
  },

  signalFight(f: FightSummary) {
    const fights = LoreArchive.allFights();
    fights.push(f);
    while (fights.length > 500) fights.shift();

    // Strip transcripts from older entries to save localstorage
    const cleaned = fights.map((fight, i, arr) => {
      if (arr.length - i > 20 && fight.transcript) {
        const { transcript, ...rest } = fight;
        return rest as FightSummary;
      }
      return fight;
    });

    saveArray(KEY_FIGHTS, cleaned);
  },

  markFightOfWeek(week: number, fightId: string) {
    const hall = LoreArchive.allHall().filter(
      (h) => !(h.label === "Fight of the Week" && h.week === week)
    );
    hall.push({ week, label: "Fight of the Week", fightId });
    saveArray(KEY_HALL, hall);
  },

  markFightOfTournament(week: number, fightId: string) {
    const hall = LoreArchive.allHall().filter(
      (h) => !(h.label === "Fight of the Tournament" && h.week === week)
    );
    hall.push({ week, label: "Fight of the Tournament", fightId });
    saveArray(KEY_HALL, hall);
  },
};
