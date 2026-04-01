import type { GameState, RivalStableData, Warrior, TrainerData } from "@/types/game";
import { computeWarriorStats } from "../skillCalc";

const FIGHT_PURSE = 150;
const WIN_BONUS = 75;
const FAME_DIVIDEND = 2;
const WARRIOR_UPKEEP = 55;
const BASE_OPS_COST = 20;

// Trainer Economics (Salary)
const SALARY: Record<string, number> = {
  Novice: 10,
  Seasoned: 25,
  Master: 75
};

// Hire Costs
const HIRE_COST: Record<string, number> = {
  Novice: 50,
  Seasoned: 100,
  Master: 200
};

/**
 * Processes weekly economic and development actions for a rival stable.
 * Returns the updated stable data, a flag if they went bankrupt, and gazette items.
 */
export function processAIStable(
  rival: RivalStableData,
  state: GameState
): { updatedRival: RivalStableData; isBankrupt: boolean; gazetteItems: string[]; updatedHiringPool: TrainerData[] } {
  const gazetteItems: string[] = [];
  const activeRoster = rival.roster.filter(w => w.status === "Active");
  let updatedHiringPool = [...(state.hiringPool || [])];
  const currentTrainers = [...(rival.trainers || [])];
  let currentGold = rival.gold;
  
  // 1. Calculate Income (Fights + Fame)
  let weeklyIncome = 0;
  const weekFights = state.arenaHistory.filter(f => f.week === state.week);
  for (const f of weekFights) {
    const isOwnerA = rival.owner.id === f.stableA;
    const isOwnerD = rival.owner.id === f.stableD;
    if (isOwnerA || isOwnerD) {
      weeklyIncome += FIGHT_PURSE;
      if ((isOwnerA && f.winner === "A") || (isOwnerD && f.winner === "D")) {
        weeklyIncome += WIN_BONUS;
      }
    }
  }
  const totalFame = activeRoster.reduce((sum, w) => sum + (w.fame || 0), 0);
  weeklyIncome += totalFame * FAME_DIVIDEND;

  // 2. Staff Management (Hiring/Firing)
  const intent = rival.strategy?.intent ?? "CONSOLIDATION";
  
  // Hiring logic
  if (intent !== "RECOVERY" && currentTrainers.length < 2 && currentGold > 600 && updatedHiringPool.length > 0) {
    // Pick the best trainer they can afford
    const affordable = updatedHiringPool.filter(t => HIRE_COST[t.tier] < (currentGold - 300));
    if (affordable.length > 0) {
      const best = affordable.sort((a, b) => HIRE_COST[b.tier] - HIRE_COST[a.tier])[0];
      const cost = HIRE_COST[best.tier];
      currentGold -= cost;
      currentTrainers.push(best);
      updatedHiringPool = updatedHiringPool.filter(t => t.id !== best.id);
      gazetteItems.push(`👔 STAFF: ${rival.owner.stableName} hired ${best.name} (${best.tier}) to lead their training camp.`);
    }
  }

  // Firing logic
  if (intent === "RECOVERY" || currentGold < 100) {
    if (currentTrainers.length > 0) {
      const fired = currentTrainers.pop()!;
      gazetteItems.push(`📉 DOWNSIZING: ${rival.owner.stableName} has released trainer ${fired.name} due to budget constraints.`);
    }
  }

  // 3. Calculate Expenses (Upkeep + Salaries)
  let weeklyExpenses = BASE_OPS_COST;
  weeklyExpenses += activeRoster.length * WARRIOR_UPKEEP;
  weeklyExpenses += currentTrainers.reduce((sum, t) => sum + (SALARY[t.tier] || 10), 0);

  // 4. Development (Training & Equipment)
  let updatedRoster = [...rival.roster];
  
  if (intent !== "RECOVERY" && currentGold > 200) {
    // Gear Investment (Simulated upgrade)
    if (intent === "EXPANSION" && currentGold > 1200) {
      const warrior = activeRoster[0];
      if (warrior) {
        currentGold -= 300;
        updatedRoster = updatedRoster.map(w => w.id === warrior.id ? applyGearUpgrade(w) : w);
        gazetteItems.push(`⚔️ GEAR: ${rival.owner.stableName} invested in premium arms for ${warrior.name}.`);
      }
    }

    // Weekly Training
    const candidate = activeRoster.find(w => w.status === "Active");
    if (candidate && currentGold >= (weeklyExpenses + 35)) {
      weeklyExpenses += 35;
      updatedRoster = updatedRoster.map(w => w.id === candidate.id ? performAITraining(w) : w);
    }
  }

  // 5. Update Gold & Check Bankruptcy
  const goldDelta = weeklyIncome - weeklyExpenses;
  const newGold = currentGold + goldDelta;
  const isBankrupt = newGold <= 0;
  
  if (isBankrupt) {
    gazetteItems.push(`📉 BANKRUPTCY: ${rival.owner.stableName} has collapsed under its debts.`);
  }

  return {
    updatedRival: {
      ...rival,
      gold: newGold,
      roster: updatedRoster,
      trainers: currentTrainers
    },
    isBankrupt,
    gazetteItems,
    updatedHiringPool
  };
}

function applyGearUpgrade(w: Warrior): Warrior {
  // Simulated gear boost (+1 to 2 random attributes)
  const keys = (Object.keys(w.attributes) as (keyof typeof w.attributes)[]).filter(k => k !== "SZ");
  const newAttrs = { ...w.attributes };
  for (let i = 0; i < 2; i++) {
    const key = keys[Math.floor(Math.random() * keys.length)];
    if (newAttrs[key] < 25) newAttrs[key]++;
  }
  const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, w.style);
  return { ...w, attributes: newAttrs, baseSkills, derivedStats };
}

function performAITraining(w: Warrior): Warrior {
  const keys = (Object.keys(w.attributes) as (keyof typeof w.attributes)[]).filter(k => k !== "SZ");
  const sorted = keys.sort((a, b) => w.attributes[a] - w.attributes[b]);
  const chosen = sorted[0];
  if (w.attributes[chosen] < 25) {
    const newAttrs = { ...w.attributes, [chosen]: w.attributes[chosen] + 1 };
    const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, w.style);
    return { ...w, attributes: newAttrs, baseSkills, derivedStats };
  }
  return w;
}
