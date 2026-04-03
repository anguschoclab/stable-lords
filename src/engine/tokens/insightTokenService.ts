import { GameState, InsightToken, InsightTokenType, Warrior } from "@/types/game";
import { generateId } from "@/utils/idUtils";

/**
 * InsightTokenService — Manages Tournament Reward Tokens.
 * These are awarded for placing in the top 3 of a tournament.
 */
export const InsightTokenService = {
  /**
   * Awards a token to the stable's pool.
   */
  awardToken(state: GameState, type: InsightTokenType, source: string): GameState {
    const newToken: InsightToken = {
      id: generateId(),
      type,
      warriorId: "", // Initially unassigned
      warriorName: "Unassigned",
      detail: `Awarded from ${source}`,
      discoveredWeek: state.week,
    };

    return {
      ...state,
      insightTokens: [...(state.insightTokens || []), newToken],
      newsletter: [
        ...(state.newsletter || []),
        {
          week: state.week,
          title: "Tournament Reward",
          items: [`The stable has earned a ${type} Insight Token from ${source}.`]
        }
      ]
    };
  },

  /**
   * Assigns a token to a specific warrior.
   */
  assignToken(state: GameState, tokenId: string, warriorId: string): GameState {
    const token = state.insightTokens?.find(t => t.id === tokenId);
    const warrior = state.roster.find(w => w.id === warriorId);

    if (!token || !warrior) return state;

    // Apply the mechanical benefit based on token type
    const updatedWarrior = { ...warrior };
    if (updatedWarrior.favorites) {
      if (token.type === "Weapon") {
        updatedWarrior.favorites = { 
          ...updatedWarrior.favorites, 
          discovered: { ...updatedWarrior.favorites.discovered, weapon: true } 
        };
      } else if (token.type === "Rhythm") {
        updatedWarrior.favorites = { 
          ...updatedWarrior.favorites, 
          discovered: { ...updatedWarrior.favorites.discovered, rhythm: true } 
        };
      }
    }

    const nextTokens = state.insightTokens.filter(t => t.id !== tokenId);

    return {
      ...state,
      roster: state.roster.map(w => w.id === warriorId ? updatedWarrior : w),
      insightTokens: nextTokens,
      newsletter: [
        ...(state.newsletter || []),
        {
          week: state.week,
          title: "Insight Gained",
          items: [`${warrior.name} has internalized the ${token.type} insight tokens from the stable archives.`]
        }
      ]
    };
  }
};
