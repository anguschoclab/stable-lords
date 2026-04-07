import type { GameState, RivalStableData } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import { generateRivalStables } from "@/engine/rivals";
import { SeededRNG } from "@/utils/random";

/**
 * WorldManagementService - Orchestrates stable bankruptcy, world-wide retirement, 
 * and the 'Legacy Founder' (retired warrior to owner) system.
 */
export const WorldManagementService = {
  // Store candidates between ticks if needed, or just process immediately
  legacyCandidates: [] as { name: string, stableName: string }[],

  /**
   * Processes the seasonal 'Churn' (Bankruptcy and Expansion).
   * Typically runs on Week 13/26/39/52.
   */
  processSeasonalChurn(state: GameState, seed: number): { updatedRivals: RivalStableData[]; news: string[] } {
    const rng = new SeededRNG(seed);
    const updatedRivals = [...(state.rivals || [])];
    const news: string[] = [];

    // 1. Process Retirement for all rivals
    updatedRivals.forEach((rival, rIdx) => {
      const retiredWarriors: Warrior[] = [];
      rival.roster = rival.roster.filter(w => {
        if (w.status !== "Active") return false;
        
        const age = w.age ?? 20;
        const retireChance = age >= 40 ? 1 : age >= 30 ? (age - 30) * 0.05 : 0;
        
        if (rng.next() < retireChance) {
          retiredWarriors.push({ ...w, status: "Retired", retiredWeek: state.week });
          return false;
        }
        return true;
      });

      // Handle 'Legacy Founders' from retired warriors
      retiredWarriors.forEach(rw => {
        if (rw.fame >= 90 && (rw.career?.wins || 0) >= 50 && rng.next() < 0.25) {
          const newStableName = `${rw.name}'s Academy`;
          news.push(`🏆 LEGENDARY FOUNDER: ${rw.name}, the veteran of ${rival.owner.stableName}, has founded ${newStableName}!`);
          this.legacyCandidates.push({ name: rw.name, stableName: newStableName });
        }
      });
    });

    // 2. Process Bankruptcy (Risk: <100 treasury and no wins in 13 weeks)
    const survivors = updatedRivals.filter(r => {
      if (r.treasury < 100 && r.agentMemory?.burnRate && r.agentMemory.burnRate > 0) {
          // Check recent performance (simplified for now: 10% chance to fail if poor)
          if (rng.next() < 0.2) {
            news.push(`📉 COLLAPSE: ${r.owner.stableName} has shuttered its doors due to financial insolvency.`);
            return false;
          }
      }
      return true;
    });

    // 3. Process Expansion (Target: 45 stables)
    const expansionRNG = new SeededRNG(seed + 100);
    while (survivors.length < 45) {
       // Chance to expand each week or season
       if (expansionRNG.next() < 0.3) {
         const legacy = this.legacyCandidates.shift();
         const [newStable] = generateRivalStables(1, expansionRNG.roll(0, 10000), state.week);
         
         if (legacy) {
           newStable.owner.name = legacy.name;
           newStable.owner.stableName = legacy.stableName;
           newStable.owner.personality = "Aggressive"; // Legends are often aggressive
         }

         survivors.push(newStable);
         if (!legacy) {
           news.push(`🆕 RECRUITMENT: ${newStable.owner.stableName} has been granted an arena license as a new Minor rival!`);
         }
       } else {
         break;
       }
    }

    return { updatedRivals: survivors, news };
  }
};
