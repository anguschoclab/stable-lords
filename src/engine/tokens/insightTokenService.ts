import { GameState, InsightToken, InsightTokenType, Warrior, Attributes } from "@/types/game";
import { generateId } from "@/utils/idUtils";
import { SeededRNG } from "@/utils/random";

/**
 * InsightTokenService — Manages Tournament Reward Tokens.
 * These are awarded for placing in the top 3 of a tournament.
 */
export const InsightTokenService = {
  /**
   * Awards a token to the stable's pool.
   */
  awardToken(state: GameState, type: InsightTokenType, source: string, rng?: SeededRNG): GameState {
    const newToken: InsightToken = {
      id: generateId(rng),
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
  async assignToken(state: GameState, tokenId: string, warriorId: string, rng?: any): Promise<GameState> {
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
      } else if (token.type === "Attribute") {
        // Permanent +1 to a primary attribute
        const primaries: (keyof Attributes)[] = ["ST", "WT", "SP", "DF"];
        const attrKey = (rng ? (typeof rng.pick === 'function' ? rng.pick(primaries) : (await rng.next())) : primaries[Math.floor(Math.random() * primaries.length)]) as keyof Attributes;
        const currentVal = updatedWarrior.attributes[attrKey] || 10;
        updatedWarrior.attributes = { ...updatedWarrior.attributes, [attrKey]: currentVal + 1 };
        token.detail = `Internalized: +1 ${attrKey}`;
      } else if (token.type === "Style") {
        // Permanent +1 to Attack (ATT) skill
        if (updatedWarrior.baseSkills) {
          updatedWarrior.baseSkills = { ...updatedWarrior.baseSkills, ATT: updatedWarrior.baseSkills.ATT + 1 };
        }
        token.detail = `Mastered Style: +1 ATT`;
      } else if (token.type === "Tactic") {
        // Add a "Tactical Insight" flair
        updatedWarrior.flair = [...(updatedWarrior.flair || []), "Tactical Insight"];
        token.detail = "Unlocked: Tactical Insight (Legacy)";
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
