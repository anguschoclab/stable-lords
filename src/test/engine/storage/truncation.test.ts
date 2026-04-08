import { describe, it, expect } from "vitest";
import { truncateState } from "@/engine/storage/truncation";
import { type GameState, type FightSummary } from "@/types/game";

describe("truncateState", () => {
  const createMockState = (overrides?: Partial<GameState>): GameState => {
    return {
      ...overrides,
    } as GameState;
  };

  it("handles empty state and undefined arrays gracefully", () => {
    const state = createMockState();
    const truncated = truncateState(state);

    expect(truncated.arenaHistory).toEqual([]);
    expect(truncated.newsletter).toEqual([]);
    expect(truncated.ledger).toEqual([]);
    expect(truncated.matchHistory).toEqual([]);
    expect(truncated.moodHistory).toEqual([]);
  });

  it("truncates arrays to their respective limits", () => {
    const makeArray = (size: number) => Array.from({ length: size }, (_, i) => ({ id: i }));

    const state = createMockState({
      arenaHistory: makeArray(505) as unknown,
      newsletter: makeArray(105) as unknown,
      ledger: makeArray(505) as unknown,
      matchHistory: makeArray(505) as unknown,
      moodHistory: makeArray(55) as unknown,
      graveyard: makeArray(205) as unknown,
      retired: makeArray(205) as unknown,
      tournaments: makeArray(105) as unknown,
      scoutReports: makeArray(105) as unknown,
      hallOfFame: makeArray(105) as unknown,
      rivalries: makeArray(105) as unknown,
      ownerGrudges: makeArray(105) as unknown,
      seasonalGrowth: makeArray(505) as unknown,
      insightTokens: makeArray(505) as unknown,
      playerChallenges: makeArray(105) as unknown,
      playerAvoids: makeArray(105) as unknown,
      trainingAssignments: makeArray(205) as unknown,
      gazettes: makeArray(55) as unknown,
      coachDismissed: makeArray(105) as unknown,
      restStates: makeArray(505) as unknown,
      hiringPool: makeArray(25) as unknown,
      recruitPool: makeArray(55) as unknown,
      trainers: makeArray(55) as unknown,
      rivals: makeArray(55) as unknown,
    });

    const truncated = truncateState(state);

    expect(truncated.arenaHistory.length).toBe(500);
    expect(truncated.newsletter.length).toBe(100);
    expect(truncated.ledger.length).toBe(500);
    expect(truncated.matchHistory.length).toBe(500);
    expect(truncated.moodHistory.length).toBe(50);
    expect(truncated.graveyard.length).toBe(200);
    expect(truncated.retired.length).toBe(200);
    expect(truncated.tournaments.length).toBe(100);
    expect(truncated.scoutReports.length).toBe(100);
    expect(truncated.hallOfFame.length).toBe(100);
    expect(truncated.rivalries.length).toBe(100);
    expect(truncated.ownerGrudges.length).toBe(100);
    expect(truncated.seasonalGrowth.length).toBe(500);
    expect(truncated.insightTokens.length).toBe(500);
    expect(truncated.playerChallenges.length).toBe(100);
    expect(truncated.playerAvoids.length).toBe(100);
    expect(truncated.trainingAssignments.length).toBe(200);
    expect(truncated.gazettes.length).toBe(50);
    expect(truncated.coachDismissed.length).toBe(100);
    expect(truncated.restStates.length).toBe(500);
    expect(truncated.hiringPool.length).toBe(20);
    expect(truncated.recruitPool.length).toBe(50);
    expect(truncated.trainers.length).toBe(50);
    expect(truncated.rivals.length).toBe(50);
  });

  it("removes transcripts from arenaHistory for flights older than the last 20", () => {
    // We create 30 fights.
    // Fights index 0-9 are older (will lose transcript).
    // Fights index 10-29 are the most recent 20 (will keep transcript).
    const arenaHistory = Array.from({ length: 30 }, (_, i) => ({
      id: `fight-${i}`,
      transcript: [`line 1 of fight ${i}`, `line 2 of fight ${i}`]
    })) as unknown as FightSummary[];

    const state = createMockState({ arenaHistory });
    const truncated = truncateState(state);

    expect(truncated.arenaHistory.length).toBe(30);

    // Check first 10 (older fights)
    for (let i = 0; i < 10; i++) {
      expect(truncated.arenaHistory[i].transcript).toBeUndefined();
      expect(truncated.arenaHistory[i].id).toBe(`fight-${i}`);
    }

    // Check last 20 (recent fights)
    for (let i = 10; i < 30; i++) {
      expect(truncated.arenaHistory[i].transcript).toBeDefined();
      expect(truncated.arenaHistory[i].transcript?.length).toBe(2);
      expect(truncated.arenaHistory[i].id).toBe(`fight-${i}`);
    }
  });

  it("slices keeping the most recent items (tail of the array)", () => {
    const makeArray = (size: number) => Array.from({ length: size }, (_, i) => ({ id: i }));
    // 105 items, ids 0 to 104
    const state = createMockState({ newsletter: makeArray(105) as unknown });
    const truncated = truncateState(state);

    expect(truncated.newsletter.length).toBe(100);
    // It should keep the *last* 100 items, so ids 5 to 104
    expect(truncated.newsletter[0]).toMatchObject({ id: 5 });
    expect(truncated.newsletter[99]).toMatchObject({ id: 104 });
  });
});
