import { describe, it, expect, beforeEach } from "vitest";
import { loadGameState, saveGameState, createFreshState } from "@/state/gameStore";

describe("gameStore - Security", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should prevent prototype pollution during loadGameState", () => {
    const maliciousPayload = '{"meta": {"gameName": "Stable Lords", "version": "2.0.0"}, "__proto__": {"polluted": true}, "gold": 9999}';
    localStorage.setItem("stablelords.save.v2", maliciousPayload);

    const state = loadGameState();

    // The malicious property should not be on the Object prototype
    expect(({} as any).polluted).toBeUndefined();
    // The key should have been stripped from the parsed object itself as well
    expect((state as any).__proto__.polluted).toBeUndefined();
    expect(state.gold).toBe(9999);
  });
});
