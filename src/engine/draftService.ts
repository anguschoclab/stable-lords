import { FightingStyle, type RivalStableData } from "@/types/game";
import { type PoolWarrior } from "./recruitment";
import { PERSONALITY_STYLE_PREFS } from "@/data/ownerData";
import { SeededRNG } from "@/utils/random";
import { generateId } from "@/utils/idUtils";

/**
 * AI Draft Service
 * Handles rival stables' logic for recruiting new warriors from the pool.
 */
export function aiDraftFromPool(
  pool: PoolWarrior[],
  rivals: RivalStableData[],
  week: number,
  seed?: number
): { updatedPool: PoolWarrior[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const rng = new SeededRNG(seed ?? (week * 7919 + 101));
  
  const updatedRivals = rivals.map(r => ({ 
    ...r, 
    roster: [...r.roster] 
  }));
  const gazetteItems: string[] = [];
  const remainingPool = [...pool];

  // Major Draft (Every 4 weeks)
  const isMajorDraftWeek = week % 4 === 0;

  for (const rival of updatedRivals) {
    const intent = rival.strategy?.intent ?? "CONSOLIDATION";
    const activeCount = rival.roster.filter(w => w.status === "Active").length;
    
    // Limits
    const maxRoster = rival.owner.personality === "Aggressive" ? 10 : 8;
    if (activeCount >= maxRoster) continue;
    
    // Deterministic recruitment chance
    // EXPANSION intent significantly increases recruitment chance
    const intentBonus = intent === "EXPANSION" ? 0.6 : 0;
    const willRecruit = isMajorDraftWeek || (activeCount < 4 && rng.chance(0.3 + intentBonus)) || (rng.chance(0.05 + intentBonus));
    
    if (!willRecruit || remainingPool.length === 0) continue;

    const personality = rival.owner.personality ?? "Pragmatic";
    const prefs = PERSONALITY_STYLE_PREFS[personality] || [];
    const prefsSet = new Set(prefs);

    // Score candidates
    let bestIdx = -1;
    let bestScore = -Infinity;
    
    for (let i = 0; i < remainingPool.length; i++) {
       const w = remainingPool[i];
       let score = 0;
       
       // Quality scoring
       if (w.tier === "Prodigy") score += 100;
       if (w.tier === "Exceptional") score += 50;
       if (w.tier === "Promising") score += 20;
       
       // Style preference
       if (prefsSet.has(w.style)) score += 30;
       
       // Desperation factor
       const weeksAvailable = week - w.addedWeek;
       score += weeksAvailable * 10; 

       if (score > bestScore) {
         bestScore = score;
         bestIdx = i;
       }
    }

    if (bestIdx >= 0 && (bestScore > 30 || isMajorDraftWeek)) {
       const recruit = remainingPool[bestIdx];
       
       // Cost logic: Prodigy = 400, Exceptional = 250, rest = 100
       const cost = recruit.tier === "Prodigy" ? 400 : recruit.tier === "Exceptional" ? 250 : 100;
       
       if (rival.gold >= cost) {
         rival.gold -= cost;
         remainingPool.splice(bestIdx, 1);

         rival.roster.push({
           id: generateId(),
           name: recruit.name,
           style: recruit.style,
           attributes: { ...recruit.attributes },
           potential: { ...recruit.potential },
           baseSkills: { ...recruit.baseSkills },
           derivedStats: { ...recruit.derivedStats },
           fame: 10,
           popularity: 5,
           titles: [],
           injuries: [],
           flair: [],
           career: { wins: 0, losses: 0, kills: 0 },
           champion: false,
           status: "Active",
           age: recruit.age,
           stableId: rival.owner.id,
         });

         gazetteItems.push(`📣 MARKET: ${rival.owner.stableName} signed ${recruit.tier} ${recruit.name} for ${cost}g.`);
       }
    }
  }

  return { updatedPool: remainingPool, updatedRivals, gazetteItems };
}
