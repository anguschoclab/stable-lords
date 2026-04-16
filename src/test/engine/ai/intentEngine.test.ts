import { describe, it, expect } from "vitest";
import { pickWeeklyIntent, verifyIntentSkepticism, updateAIStrategy } from "@/engine/ai/intentEngine";
import type { GameState, RivalStableData } from "@/types/state.types";

describe("pickWeeklyIntent", () => {
  const createMockRival = (overrides: Partial<RivalStableData> = {}): RivalStableData => ({
    id: "rival-1",
    owner: {
      id: "owner-1",
      name: "Test Owner",
      stableName: "Test Stable",
      personality: "Pragmatic",
      favoredStyles: [],
      fame: 500,
      renown: 50,
      titles: 0,
    },
    roster: [],
    treasury: 1000,
    fame: 500,
    strategy: undefined,
    ...overrides,
  } as RivalStableData);

  const createMockState = (overrides: Partial<GameState> = {}): GameState => ({
    week: 1,
    season: "Spring",
    year: 1,
    weather: "Clear",
    treasury: 1000,
    fame: 500,
    popularity: 500,
    roster: [],
    rivals: [],
    arenaHistory: [],
    ...overrides,
  } as unknown as GameState);

  it("returns RECOVERY when treasury is low", () => {
    const rival = createMockRival({ treasury: 100 });
    const state = createMockState();
    const intent = pickWeeklyIntent(rival, state);
    expect(intent).toBe("RECOVERY");
  });

  it("returns CONSOLIDATION as default", () => {
    const rival = createMockRival();
    const state = createMockState();
    const intent = pickWeeklyIntent(rival, state);
    expect(intent).toBe("CONSOLIDATION");
  });
});

describe("verifyIntentSkepticism", () => {
  const createMockRival = (overrides: Partial<RivalStableData> = {}): RivalStableData => ({
    id: "rival-1",
    owner: {
      id: "owner-1",
      name: "Test Owner",
      stableName: "Test Stable",
      personality: "Pragmatic",
      favoredStyles: [],
      fame: 500,
      renown: 50,
      titles: 0,
    },
    roster: [],
    treasury: 1000,
    fame: 500,
    strategy: undefined,
    ...overrides,
  } as RivalStableData);

  const createMockState = (overrides: Partial<GameState> = {}): GameState => ({
    week: 1,
    season: "Spring",
    year: 1,
    weather: "Clear",
    treasury: 1000,
    fame: 500,
    popularity: 500,
    roster: [],
    rivals: [],
    arenaHistory: [],
    ...overrides,
  } as unknown as GameState);

  it("returns true when no strategy exists", () => {
    const rival = createMockRival({ strategy: undefined });
    const state = createMockState();
    const result = verifyIntentSkepticism(rival, state);
    expect(result).toBe(true);
  });

  it("returns true when treasury is critically low and intent is not RECOVERY", () => {
    const rival = createMockRival({
      treasury: 100,
      strategy: { intent: "EXPANSION", planWeeksRemaining: 3 },
    });
    const state = createMockState();
    const result = verifyIntentSkepticism(rival, state);
    expect(result).toBe(true);
  });

  it("returns false when strategy is valid", () => {
    const rival = createMockRival({
      treasury: 500,
      strategy: { intent: "CONSOLIDATION", planWeeksRemaining: 3 },
    });
    const state = createMockState();
    const result = verifyIntentSkepticism(rival, state);
    expect(result).toBe(false);
  });
});

describe("updateAIStrategy", () => {
  const createMockRival = (overrides: Partial<RivalStableData> = {}): RivalStableData => ({
    id: "rival-1",
    owner: {
      id: "owner-1",
      name: "Test Owner",
      stableName: "Test Stable",
      personality: "Pragmatic",
      favoredStyles: [],
      fame: 500,
      renown: 50,
      titles: 0,
    },
    roster: [],
    treasury: 1000,
    fame: 500,
    strategy: undefined,
    ...overrides,
  } as RivalStableData);

  const createMockState = (overrides: Partial<GameState> = {}): GameState => ({
    week: 1,
    season: "Spring",
    year: 1,
    weather: "Clear",
    treasury: 1000,
    fame: 500,
    popularity: 500,
    roster: [],
    rivals: [],
    arenaHistory: [],
    ...overrides,
  } as unknown as GameState);

  it("creates new strategy when none exists", () => {
    const rival = createMockRival({ strategy: undefined });
    const state = createMockState();
    const newStrategy = updateAIStrategy(rival, state);
    expect(newStrategy.intent).toBeDefined();
    expect(newStrategy.planWeeksRemaining).toBeGreaterThan(0);
  });

  it("decrements planWeeksRemaining when strategy is valid", () => {
    const rival = createMockRival({
      strategy: { intent: "CONSOLIDATION", planWeeksRemaining: 3 },
    });
    const state = createMockState();
    const newStrategy = updateAIStrategy(rival, state);
    expect(newStrategy.planWeeksRemaining).toBe(2);
  });

  it("creates new strategy when planWeeksRemaining is 0", () => {
    const rival = createMockRival({
      strategy: { intent: "CONSOLIDATION", planWeeksRemaining: 0 },
    });
    const state = createMockState();
    const newStrategy = updateAIStrategy(rival, state);
    expect(newStrategy.planWeeksRemaining).toBeGreaterThan(0);
  });

  it("creates new strategy when plan is disproved by skepticism", () => {
    const rival = createMockRival({
      treasury: 100,
      strategy: { intent: "EXPANSION", planWeeksRemaining: 3 },
    });
    const state = createMockState();
    const newStrategy = updateAIStrategy(rival, state);
    expect(newStrategy.intent).toBe("RECOVERY");
  });
});
