import { describe, it, expect, vi } from "vitest";
import { applyAging } from "@/engine/pipeline/aging";
import { type GameState } from "@/types/game";
import * as agingModule from "@/engine/aging";

vi.mock("@/engine/aging", () => ({
  processAging: vi.fn(),
}));

describe("applyAging", () => {
  it("should call processAging and return its result", () => {
    const mockState = { week: 10 } as GameState;
    const mockProcessedState = { week: 10, processed: true } as unknown as GameState;

    vi.spyOn(agingModule, "processAging").mockReturnValue(mockProcessedState);

    const result = applyAging(mockState);

    expect(agingModule.processAging).toHaveBeenCalledWith(mockState);
    expect(result).toBe(mockProcessedState);
  });
});
