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

  // Weather System
  const weathers: import("@/types/game").WeatherType[] = ["Clear", "Blazing Sun", "Heavy Rain", "Fog", "Snow"];
  s.weather = weathers[Math.floor(Math.random() * weathers.length)];

  // Tavern Brawl (Off-season spontaneous event)
  if (Math.random() < 0.20 && s.roster && s.roster.length > 0) {
    const brawlIdx = Math.floor(Math.random() * s.roster.length);
    const brawler = s.roster[brawlIdx];

    brawler.fame = (brawler.fame || 0) + 2;
    brawler.popularity = (brawler.popularity || 0) + 1;

    const injuryId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2);

    brawler.injuries.push({
      id: injuryId,
      name: "Brawl Bruises",
      description: "Got into a minor scuffle at the tavern.",
      severity: "Minor",
      weeksRemaining: 2,
      penalties: { ST: -1 }
    } as import("@/types/game").InjuryData);

    s.newsletter = [...(s.newsletter || []), {
      week: s.week,
      title: "Tavern Brawl",
      items: [`${brawler.name} was caught in a minor tavern brawl! They gained some local notoriety but suffered minor bruises (-1 ST for 2 weeks).`]
    }];
  }

  return { ...s, week: newWeek, season: newSeason };
};
