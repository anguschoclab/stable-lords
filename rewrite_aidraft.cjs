const fs = require('fs');
const code = `
import { generateRecommendations } from "./equipmentOptimizer";
import { type RivalStableData, type Warrior } from "@/types/game";
import { makeWarrior } from "./factories";
import { seededRng } from "@/utils/mathUtils";

export function aiDraftFromPool(
  pool: PoolWarrior[],
  rivals: RivalStableData[],
  week: number
): { updatedPool: PoolWarrior[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const updatedRivals = [...rivals];
  const gazetteItems: string[] = [];

  // AI drafts every 4 weeks
  if (week % 4 !== 0 || !pool || pool.length === 0 || rivals.length === 0) {
    return { updatedPool: pool || [], updatedRivals, gazetteItems };
  }

  const rng = seededRng(week * 73);
  let currentPool = [...pool];

  // Randomize rival draft order
  const draftOrder = [...updatedRivals].map((r, i) => ({ r, i })).sort(() => rng() - 0.5);

  for (const { r, i } of draftOrder) {
    if (currentPool.length === 0) break;

    const activeCount = r.roster.filter(w => w.status === "Active").length;
    // Draft if stable has less than 15 active warriors
    if (activeCount < 15) {
      // Pick the best potential/tier from the pool
      currentPool.sort((a, b) => b.cost - a.cost);
      const picked = currentPool[0];
      currentPool = currentPool.slice(1);

      // Convert PoolWarrior to full Warrior
      const newWarrior = makeWarrior(
        picked.id,
        picked.name,
        picked.style,
        picked.attributes,
        {
          age: picked.age,
          lore: picked.lore,
          favorites: picked.favorites,
          stableId: r.owner.id
        },
        rng
      );

      // Give them a smart equipment loadout based on their style and carrying capacity
      const carryCap = newWarrior.attributes.ST + newWarrior.attributes.SZ;
      const recs = generateRecommendations(newWarrior.style, carryCap);
      const bestRec = recs.sort((a, b) => b.synergy - a.synergy)[0];
      if (bestRec) {
        newWarrior.equipment = bestRec.loadout;
      }

      updatedRivals[i] = {
        ...r,
        roster: [...r.roster, newWarrior]
      };

      gazetteItems.push(\`🤝 \${r.owner.stableName} recruited \${newWarrior.name} (\${newWarrior.style}).\`);
    }
  }

  return {
    updatedPool: currentPool,
    updatedRivals,
    gazetteItems
  };
}
`;

fs.appendFileSync('src/engine/recruitment.ts', code);
console.log('Appended aiDraftFromPool to recruitment.ts successfully.');
