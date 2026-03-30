import { type GameState } from "@/types/game";
import { processHallOfFame, processTierProgression, computeNextSeason } from "@/engine/weekPipeline";
import { generateOwnerNarratives } from "@/engine/ownerNarrative";
import { evolvePhilosophies } from "@/engine/ownerPhilosophy";
import { processOwnerGrudges } from "@/engine/ownerGrudges";

export const applySeasonalUpdates: (state: GameState) => GameState = (state) => {
  const newWeek = state.week + 1;
  const newSeason = computeNextSeason(newWeek);
  let s = { ...state };

  // Hall of Fame
  s = processHallOfFame(s, newWeek);

  // Tier Progression (on season change)
  s = processTierProgression(s, newSeason, newWeek);

  // Owner Grudges
  const grudgeResult = processOwnerGrudges(s, s.ownerGrudges || []);
  s.ownerGrudges = grudgeResult.grudges;
  if (grudgeResult.gazetteItems.length > 0) {
    s.newsletter = [...(s.newsletter || []), { week: s.week, title: "Owner Feuds", items: grudgeResult.gazetteItems }];
  }

  // Owner Narratives (on season change)
  const narratives = generateOwnerNarratives(s, newSeason);
  if (narratives.length > 0) {
    s.newsletter = [...(s.newsletter || []), { week: s.week, title: `${state.season} Season Review`, items: narratives }];
  }

  // Philosophy Evolution (on season change)
  const philResult = evolvePhilosophies(s, newSeason);
  s.rivals = philResult.updatedRivals;
  if (philResult.gazetteItems.length > 0) {
    s.newsletter = [...(s.newsletter || []), { week: s.week, title: "Strategy Shifts", items: philResult.gazetteItems }];
  }

  return { ...s, week: newWeek, season: newSeason };
};
