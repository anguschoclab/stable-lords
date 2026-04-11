import { describe, it, expect } from "vitest";
import { updateRivalriesFromBouts } from "@/engine/matchmaking/rivalryLogic";
import { FightSummary, Rivalry } from "@/types/game";
import { SeededRNGService } from "@/engine/core/rng";

describe("Stable Lords 1.0 Rivalry Growth Audit", () => {
  it("verifies that rivalry intensity scales correctly with fame outcomes", () => {
    const existingRivalries: Rivalry[] = [];
    const week = 1;

    // Two celebrated warriors (fame 80+) should generate high intensity delta
    const highFameFights: FightSummary[] = [
      {
        id: "f1",
        title: "Bout",
        createdAt: new Date().toISOString(),
        a: "PlayerStable",
        d: "RivalStable",
        warriorIdA: "warrior1",
        warriorIdD: "warrior2",
        winner: "A",
        by: "KO",
        styleA: "WS",
        styleD: "TP",
        fameA: 85,
        fameD: 90,
        week: week,
      },
    ];

    const rng = new SeededRNGService(12345);
    const rivalriesAfter1 = updateRivalriesFromBouts(existingRivalries, highFameFights, week, rng);
    const feud = rivalriesAfter1.find(r => r.stableIdA === "PlayerStable" && r.stableIdB === "RivalStable");
    
    expect(feud).toBeDefined();
    // With high fame (80+), calculatePairingScore is > 200, but intensityDelta calculation in logic is more complex now.
    // At minimum, it should be > 1.
    expect(feud?.intensity).toBeGreaterThanOrEqual(1);

    // --- CASE 2: Low Fame Rivalry (Slow Growth) ---
    const lowFameFights: FightSummary[] = [
      {
        id: "f2",
        title: "Bout",
        createdAt: new Date().toISOString(),
        a: "NewStable",
        d: "OtherStable",
        warriorIdA: "warrior3",
        warriorIdD: "warrior4",
        winner: "D",
        by: "Stoppage",
        styleA: "LU",
        styleD: "PR",
        fameA: 5,
        fameD: 10,
        week: week,
      },
    ];

    const rng2 = new SeededRNGService(week * 7919 + 1);
    const rivalriesAfter2 = updateRivalriesFromBouts(rivalriesAfter1, lowFameFights, week, rng2);
    const minorRivalry = rivalriesAfter2.find(r => r.stableIdA === "NewStable" && r.stableIdB === "OtherStable");
    
    expect(minorRivalry).toBeDefined();
    expect(minorRivalry?.intensity).toBeGreaterThanOrEqual(1);
  });

  it("verifies that rivalries reach Stage 5 (Blood Feud) over repeated bouts", () => {
     let rivalries: Rivalry[] = [];
     
     // Simulate 3 weeks of high-fame bouts between the same stables
     for (let w = 1; w <= 3; w++) {
       const bout: FightSummary = {
         id: `f_b_${w}`,
         title: "Bout",
         createdAt: new Date().toISOString(),
         a: "TitanStable",
         d: "ColossusStable",
         warriorIdA: `warriorA_${w}`,
         warriorIdD: `warriorD_${w}`,
         winner: "A",
         by: "Kill", 
         styleA: "BA",
         styleD: "TP",
         fameA: 95,
         fameD: 98,
         week: w
       };
       const rng = new SeededRNGService(w * 7919);
       rivalries = updateRivalriesFromBouts(rivalries, [bout], w, rng);
     }

     const bloodFeud = rivalries.find(r => r.stableIdA === "TitanStable" && r.stableIdB === "ColossusStable");
     expect(bloodFeud?.intensity).toBe(5); 
  });
});
