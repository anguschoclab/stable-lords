import { FightingStyle, type Warrior } from "@/types/game";
import { simulateFight, defaultPlanForWarrior } from "@/engine/simulate";
import { computeWarriorStats } from "@/engine/skillCalc";

const ALL_STYLES = Object.values(FightingStyle);
const STD_ATTRS = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

function makeTestWarrior(style: FightingStyle, id: string): Warrior {
  const { baseSkills, derivedStats } = computeWarriorStats(STD_ATTRS, style);
  return { id, name: id, style, attributes: STD_ATTRS, baseSkills, derivedStats, fame: 0, popularity: 0, titles: [], injuries: [], flair: [], career: { wins: 0, losses: 0, kills: 0 }, champion: false, status: "Active", age: 20 } as Warrior;
}

const FIGHTS_PER_MATCHUP = 100;

const styleWins: Record<string, number> = {};
const styleFights: Record<string, number> = {};
let totalKills = 0;
let totalFightsAll = 0;

for (const s of ALL_STYLES) { styleWins[s] = 0; styleFights[s] = 0; }

for (const styleA of ALL_STYLES) {
  for (const styleD of ALL_STYLES) {
    const wA = makeTestWarrior(styleA, `A_${styleA}`);
    const wD = makeTestWarrior(styleD, `D_${styleD}`);
    const planA = defaultPlanForWarrior(wA);
    const planD = defaultPlanForWarrior(wD);
    const idxA = ALL_STYLES.indexOf(styleA);
    const idxD = ALL_STYLES.indexOf(styleD);
    for (let i = 0; i < FIGHTS_PER_MATCHUP; i++) {
      const seed = (idxA * 10 + idxD) * 100000 + i * 7919 + 42;
      const outcome = simulateFight(planA, planD, wA, wD, seed);
      styleFights[styleA]++;
      styleFights[styleD]++;
      totalFightsAll++;
      if (outcome.winner === "A") styleWins[styleA]++;
      else if (outcome.winner === "D") styleWins[styleD]++;
      if (outcome.by === "Kill") totalKills++;
    }
  }
}

console.log("\n=== STYLE WIN RATES ===");
for (const s of ALL_STYLES) {
  const rate = styleFights[s] > 0 ? styleWins[s] / styleFights[s] : 0;
  const pct = (rate * 100).toFixed(1);
  const flag = rate > 0.65 ? " ⚠️ TOO HIGH" : rate < 0.35 ? " ⚠️ TOO LOW" : "";
  console.log(`  ${s.padEnd(22)} ${pct.padStart(5)}%${flag}`);
}

const uniqueFights = totalFightsAll / 2;
console.log(`\n=== KILL RATE ===`);
console.log(`  Total kills: ${totalKills} / ${uniqueFights} fights = ${(totalKills / uniqueFights * 100).toFixed(1)}%`);
