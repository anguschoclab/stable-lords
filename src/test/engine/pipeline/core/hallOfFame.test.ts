import { describe, it, expect } from "vitest";
import { processHallOfFame } from "@/engine/pipeline/core/hallOfFame";
import type { GameState, Warrior } from "@/types/game";
import { FightingStyle } from "@/types/shared.types";

describe("processHallOfFame", () => {
  const mkW = (id: string, name: string, wins: number, kills: number, fame: number): Warrior => ({
    id,
    name,
    style: FightingStyle.StrikingAttack,
    fame,
    career: { wins, kills, losses: 0 },
    yearlySnapshots: {
      1: { wins: 0, kills: 0, losses: 0, fame: 0 } // Snapshots for Year 1
    },
    status: "Active",
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    awards: []
  } as any);

  const baseState: Partial<GameState> = {
    week: 1,
    year: 2, // Rolled over to Year 2
    player: { id: "p1", stableName: "PlayerStable", fame: 0 } as any,
    fame: 0,
    roster: [mkW("w1", "Winner", 10, 0, 10)],
    rivals: [
      { 
        owner: { id: "r1", stableName: "RivalStable" }, 
        roster: [mkW("w2", "Killer", 5, 5, 20)],
        fame: 0
      } as any
    ],
    awards: [],
    newsletter: []
  };

  it("returns state unchanged if not week 1 of a new year", () => {
    const state = { ...baseState, week: 2 } as GameState;
    const res = processHallOfFame(state, 2);
    expect(res).toBe(state);
  });

  it("returns state unchanged if it is the very first week of the game (Year 1)", () => {
    const state = { ...baseState, year: 1 } as GameState;
    const res = processHallOfFame(state, 1);
    expect(res).toBe(state);
  });

  it("correctly calculates and applies annual awards at Year 2 start", () => {
    const res = processHallOfFame(baseState as GameState, 1);
    
    expect(res.awards.length).toBeGreaterThan(0);
    
    const woty = res.awards.find(a => a.type === "WARRIOR_OF_YEAR");
    expect(woty?.warriorName).toBe("Winner");
    expect(woty?.value).toBe(10);

    const koty = res.awards.find(a => a.type === "KILLER_OF_YEAR");
    expect(koty?.warriorName).toBe("Killer");
    expect(koty?.value).toBe(5);

    const soty = res.awards.find(a => a.type === "STABLE_OF_YEAR");
    expect(soty?.stableName).toBe("PlayerStable"); // Winner has 10 wins, Killer has 5.

    // Check newsletter
    const nl = res.newsletter.find(n => n.title === "Year 1 Global Accolades");
    expect(nl).toBeDefined();
    expect(nl?.items[0]).toContain("WARRIOR OF THE YEAR: Winner");
    
    // Verify Fame rewards (+50 for major awards)
    const winner = res.roster.find(w => w.id === "w1");
    expect(winner?.fame).toBe(60); // 10 original + 50 WOTY
    
    // Stable fame update
    expect(res.fame).toBe(50); // Player stable got 50 from WOTY
  });
});
