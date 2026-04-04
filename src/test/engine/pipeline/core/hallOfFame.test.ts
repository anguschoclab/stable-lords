import { describe, it, expect } from "vitest";
import { processHallOfFame } from "@/engine/pipeline/core/hallOfFame";
import type { GameState, Warrior } from "@/types/game";

describe("processHallOfFame", () => {
  const mkW = (name: string, f: number, k: number, w: number): Partial<Warrior> => ({
    name, style: "Brawler", fame: f, career: { kills: k, wins: w, losses: 0 }
  });

  const baseState: Partial<GameState> = {
    roster: [mkW("W1", 50, 10, 20) as Warrior],
    graveyard: [mkW("W2", 100, 5, 10) as Warrior],
    retired: [mkW("W3", 10, 20, 5) as Warrior],
    rivals: [{ owner: { stableName: "RivalStable" }, roster: [mkW("W4", 20, 0, 30) as Warrior] } as any],
    player: { stableName: "MyStable", fame: 50 } as any,
    tournaments: [{ completed: true, champion: "W1", week: 50, name: "T1" } as any],
    newsletter: []
  };

  it("returns state unchanged if not week 52", () => {
    const res = processHallOfFame(baseState as GameState, 51);
    expect(res).toBe(baseState);
  });

  it("adds hof entries and updates newsletter at week 52", () => {
    const res = processHallOfFame(baseState as GameState, 52);
    expect(res).not.toBe(baseState);
    const nl = res.newsletter[0];
    expect(nl.title).toBe("Year 1 Hall of Fame Inductions");
    expect(nl.items).toContain("🏛️ HALL OF FAME: W2 (Brawler) inducted as Year 1's greatest warrior with 100 fame!");
    expect(nl.items).toContain("💀 DEADLIEST BLADE: W3 earns the \"Deadliest Blade\" honor with 20 kills in Year 1.");
    expect(nl.items).toContain("⚔️ IRON CHAMPION: W4 recorded the most victories (30) in Year 1.");
    expect(nl.items).toContain("🏆 W1 won the T1 (Week 50).");
    expect(nl.items).toContain("🏟️ STABLE OF THE YEAR: MyStable dominated Year 1 with 50 total fame.");
  });
});
