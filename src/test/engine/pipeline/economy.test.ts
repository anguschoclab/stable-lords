import { describe, it, expect, vi } from "vitest";
import { applyEconomy } from "@/engine/pipeline/economy";
import { type GameState } from "@/types/game";
import * as economyModule from "@/engine/economy";

vi.mock("@/engine/economy", () => ({
  processEconomy: vi.fn(),
}));

describe("applyEconomy", () => {
  it("should call processEconomy and return its result", () => {
    const mockState = { gold: 100 } as GameState;
    const mockProcessedState = { gold: 200 } as unknown as GameState;

    vi.spyOn(economyModule, "processEconomy").mockReturnValue(mockProcessedState);

    const result = applyEconomy(mockState);

    expect(economyModule.processEconomy).toHaveBeenCalledWith(mockState);
    expect(result).toBe(mockProcessedState);
  });
});
