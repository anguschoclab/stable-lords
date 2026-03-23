import { type GameState } from "@/types/game";
import { runAIvsAIBouts } from "@/engine/matchmaking";
import { aiDraftFromPool } from "@/engine/recruitment";
import { processAIRosterManagement } from "@/engine/ownerRoster";

export const applyRivalAI: (state: GameState) => GameState = (state) => {
  const s = { ...state };

  // AI Bouts
  if ((s.rivals || []).length > 0) {
    const { updatedRivals, gazetteItems } = runAIvsAIBouts(s);
    s.rivals = updatedRivals;
    if (gazetteItems.length > 0) {
      s.newsletter = [...(s.newsletter || []), { week: s.week, title: "Rival Arena Report", items: gazetteItems }];
    }
  }

  // AI Roster Management
  if ((s.rivals || []).length > 0) {
    const rosterMgmt = processAIRosterManagement(s);
    s.rivals = rosterMgmt.updatedRivals;
    if (rosterMgmt.gazetteItems.length > 0) {
      s.newsletter = [...(s.newsletter || []), { week: s.week, title: "Stable Management", items: rosterMgmt.gazetteItems }];
    }
  }

  return s;
};

export const applyRecruitment: (state: GameState) => GameState = (state) => {
  const s = { ...state };
  if ((s.rivals || []).length > 0 && (s.recruitPool || []).length > 0) {
    const draft = aiDraftFromPool(s.recruitPool, s.rivals, s.week);
    s.recruitPool = draft.updatedPool;
    s.rivals = draft.updatedRivals;
    if (draft.gazetteItems.length > 0) {
      s.newsletter = [...(s.newsletter || []), { week: s.week, title: "Draft Report", items: draft.gazetteItems }];
    }
  }
  return s;
};
