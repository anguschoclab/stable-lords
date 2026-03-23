import { type GameState, type InjuryData } from "@/types/game";
import { tickInjuries } from "@/engine/injuries";
import { clearExpiredRest } from "@/engine/matchmaking";

export const applyHealthUpdates: (state: GameState) => GameState = (state) => {
  const injuryNews: string[] = [];
  const rosterWithHealedInjuries = state.roster.map((w) => {
    const injuryObjects = (w.injuries || []).filter((i): i is InjuryData => typeof i !== "string");
    if (injuryObjects.length === 0) return w;
    const { active, healed } = tickInjuries(injuryObjects);
    if (healed.length > 0) injuryNews.push(`${w.name} recovered from ${healed.join(", ")}.`);
    return { ...w, injuries: active };
  });

  const s = { 
    ...state, 
    roster: rosterWithHealedInjuries,
    restStates: clearExpiredRest(state.restStates || [], state.week)
  };

  if (injuryNews.length > 0) {
    s.newsletter = [...(s.newsletter || []), { week: s.week, title: "Medical Report", items: injuryNews }];
  }

  return s;
};
