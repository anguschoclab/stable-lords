import { generateWeeklyGazette } from "./src/engine/gazetteNarrative";
import type { FightSummary, CrowdMoodType, Warrior } from "./src/types/game";
import { performance } from "perf_hooks";

const createFight = (id: string, week: number, a: string, d: string, winner: "A" | "D" | null): FightSummary => ({
  id,
  week,
  phase: "resolution",
  title: `Fight ${id}`,
  a,
  d,
  winner,
  by: "KO",
  styleA: "AIMED BLOW",
  styleD: "BASHING ATTACK",
  createdAt: new Date().toISOString(),
});

const allFights: FightSummary[] = [];
const warriors = Array.from({ length: 1000 }, (_, i) => `Warrior ${i}`);

// Generate 10,000 historical fights
for (let i = 0; i < 10000; i++) {
  const week = Math.floor(i / 10);
  const aIdx = Math.floor(Math.random() * warriors.length);
  let dIdx = Math.floor(Math.random() * warriors.length);
  while (dIdx === aIdx) dIdx = Math.floor(Math.random() * warriors.length);

  allFights.push(createFight(`hist-${i}`, week, warriors[aIdx], warriors[dIdx], Math.random() > 0.5 ? "A" : "D"));
}

// Ensure some "Rising Stars" (3 wins, 0 losses)
const stars = ["Star 1", "Star 2", "Star 3"];
for (const star of stars) {
    allFights.push(createFight(`star-${star}-1`, 1, star, "Opponent 1", "A"));
    allFights.push(createFight(`star-${star}-2`, 2, star, "Opponent 2", "A"));
}

const currentWeekFights: FightSummary[] = [];
for (const star of stars) {
    currentWeekFights.push(createFight(`star-${star}-3`, 100, star, "Opponent 3", "A"));
}
// Add some more random fights for this week
for (let i = 0; i < 17; i++) {
    const aIdx = Math.floor(Math.random() * warriors.length);
    let dIdx = Math.floor(Math.random() * warriors.length);
    while (dIdx === aIdx) dIdx = Math.floor(Math.random() * warriors.length);
    currentWeekFights.push(createFight(`curr-${i}`, 100, warriors[aIdx], warriors[dIdx], "A"));
}

const graveyard: Warrior[] = [];
const fullHistory = allFights.concat(currentWeekFights);

// Warm up
for (let i = 0; i < 10; i++) {
    generateWeeklyGazette(currentWeekFights, "Festive", 100, graveyard, fullHistory);
}

console.log("Starting benchmark...");
const iterations = 100;
const start = performance.now();
for (let i = 0; i < iterations; i++) {
    generateWeeklyGazette(currentWeekFights, "Festive", 100, graveyard, fullHistory);
}
const end = performance.now();
const totalTime = end - start;
console.log(`Total time for ${iterations} iterations: ${totalTime.toFixed(2)}ms`);
console.log(`Average execution time: ${(totalTime / iterations).toFixed(4)}ms`);

// Verify it actually works
const result = generateWeeklyGazette(currentWeekFights, "Festive", 100, graveyard, fullHistory);
console.log(`Tags: ${result.tags.join(", ")}`);
if (result.tags.includes("Rising Star")) {
    console.log("Rising Star tag found successfully.");
} else {
    console.log("Rising Star tag NOT found.");
}
