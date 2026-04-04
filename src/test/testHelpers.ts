import { GameState, Warrior, RivalStableData } from "@/types/state.types";
import { makeWarrior, createFreshState } from "@/engine/factories";
import { FightingStyle } from "@/types/shared.types";
import { generateId } from "@/utils/idUtils";

/**
 * Populates a GameState with a realistic number of warriors for testing.
 */
export function populateTestState(state: GameState, warriorCount: number = 300): GameState {
  const newState = { ...state };
  const styles = Object.values(FightingStyle);
  
  // 1. Add to player roster (10 warriors)
  for (let i = 0; i < 10; i++) {
    newState.roster.push(makeWarrior(
      `p_w_${i}`, 
      `Player Warrior ${i}`, 
      styles[i % styles.length],
      { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      { fame: 50 + i * 10 }
    ));
  }

  // 2. Add Rivals (10 rivals, 20 warriors each)
  for (let r = 0; r < 10; r++) {
    const rivalWorkers: Warrior[] = [];
    for (let w = 0; w < 20; w++) {
      rivalWorkers.push(makeWarrior(
        `r_${r}_w_${w}`,
        `Rival ${r} Warrior ${w}`,
        styles[(r + w) % styles.length],
        { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        { fame: Math.floor(Math.random() * 200) }
      ));
    }
    
    newState.rivals.push({
      owner: {
        id: `rival_owner_${r}`,
        name: `Rival Owner ${r}`,
        stableName: `Rival Stable ${r}`,
        fame: 100,
        renown: 50,
        titles: 0,
        personality: "Pragmatic"
      },
      roster: rivalWorkers,
      gold: 1000,
      tier: "Established"
    } as RivalStableData);
  }

  // 3. Add Promoters
  newState.promoters = {
    "p_local": {
      id: "p_local",
      name: "Local Joe",
      age: 45,
      personality: "Flashy",
      tier: "Local",
      capacity: 5,
      biases: [FightingStyle.BashingAttack],
      history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 }
    },
    "p_legendary": {
      id: "p_legendary",
      name: "Don Kingpin",
      age: 65,
      personality: "Greedy",
      tier: "Legendary",
      capacity: 2,
      biases: [FightingStyle.StrikingAttack],
      history: { totalPursePaid: 0, notableBouts: [], legacyFame: 100 }
    }
  };

  return newState;
}
