import { type GameState } from "@/types/game";
import { generateWeeklyGazette } from "@/engine/gazetteNarrative";

export const applyNarrative: (state: GameState) => GameState = (state) => {
  const s = { ...state };
  const weekFights = s.arenaHistory.filter(f => f.week === s.week);
  const story = generateWeeklyGazette(weekFights, s.crowdMood, s.week, s.graveyard, s.arenaHistory);
  s.gazettes = [...(s.gazettes || []), { ...story, week: s.week }];
  s.gazettes = s.gazettes.slice(-50); // Keep last 50 issues
  return s;
};
