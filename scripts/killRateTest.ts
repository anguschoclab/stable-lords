import { FightingStyle, type Warrior } from "../src/types/game";
import { simulateFight, defaultPlanForWarrior } from "../src/engine/simulate";
import { computeWarriorStats } from "../src/engine/skillCalc";

// Helper to generate a random number between min and max (inclusive)
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random warrior
function generateWarrior(id: string, style: FightingStyle): Warrior {
  // Use typical starting attribute ranges (e.g. 8 to 18)
  const attrs = {
    ST: randInt(8, 18),
    CN: randInt(8, 18),
    SZ: randInt(8, 18),
    WT: randInt(8, 18),
    WL: randInt(8, 18),
    SP: randInt(8, 18),
    DF: randInt(8, 18),
  };
  const stats = computeWarriorStats(attrs, style);

  return {
    id,
    name: `Warrior-${id}`,
    style,
    attributes: attrs,
    baseSkills: stats.baseSkills,
    derivedStats: stats.derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active",
    age: 20,
    equipment: {
      weapon: "shortsword",
      armor: "leather",
      shield: "none",
      helm: "none"
    }
  };
}

const styles = Object.values(FightingStyle);
const numBattles = 10000;

console.log(`Running ${numBattles} battles to calculate kill rate...`);

let totalBattles = 0;
let totalKills = 0;

const styleStats: Record<string, { battles: number; killsFor: number; killsAgainst: number }> = {};
styles.forEach(s => {
  styleStats[s] = { battles: 0, killsFor: 0, killsAgainst: 0 };
});

for (let i = 0; i < numBattles; i++) {
  const styleA = styles[Math.floor(Math.random() * styles.length)];
  const styleD = styles[Math.floor(Math.random() * styles.length)];

  const wA = generateWarrior(`A-${i}`, styleA);
  const wD = generateWarrior(`D-${i}`, styleD);

  const planA = defaultPlanForWarrior(wA);
  const planD = defaultPlanForWarrior(wD);

  const outcome = simulateFight(planA, planD, wA, wD, i);

  totalBattles++;
  styleStats[styleA].battles++;
  styleStats[styleD].battles++;

  if (outcome.by === "Kill") {
    totalKills++;
    if (outcome.winner === "A") {
      styleStats[styleA].killsFor++;
      styleStats[styleD].killsAgainst++;
    } else if (outcome.winner === "D") {
      styleStats[styleD].killsFor++;
      styleStats[styleA].killsAgainst++;
    }
  }
}

console.log("\n--- KILL RATE TEST RESULTS ---");
console.log(`Total Battles: ${totalBattles}`);
console.log(`Total Kills: ${totalKills}`);
console.log(`Overall Kill Rate: ${((totalKills / totalBattles) * 100).toFixed(2)}%`);
console.log("\n--- KILL RATES PER CLASS ---");

const sortedStyles = Object.keys(styleStats).sort((a, b) => {
    const rateA = styleStats[a].killsFor / styleStats[a].battles;
    const rateB = styleStats[b].killsFor / styleStats[b].battles;
    return rateB - rateA;
});

sortedStyles.forEach(style => {
    const stats = styleStats[style];
    const killRate = ((stats.killsFor / stats.battles) * 100).toFixed(2);
    const killedRate = ((stats.killsAgainst / stats.battles) * 100).toFixed(2);
    console.log(`${style.padEnd(20)} | Kills: ${stats.killsFor.toString().padStart(4)} (${killRate.padStart(5)}%) | Died: ${stats.killsAgainst.toString().padStart(4)} (${killedRate.padStart(5)}%) | Battles: ${stats.battles}`);
});
