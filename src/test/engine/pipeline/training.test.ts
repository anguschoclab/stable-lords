import { describe, it, expect, vi } from "vitest";
import { applyTraining } from "@/engine/pipeline/training";
import { type GameState } from "@/types/game";
import * as trainingModule from "@/engine/training";

vi.mock("@/engine/training", () => ({
  processTraining: vi.fn(),
}));

describe("applyTraining", () => {
  it("should call processTraining and return its result", () => {
    const mockState = { roster: [] } as unknown as GameState;
    const mockProcessedState = { roster: [], processed: true } as unknown as GameState;

    vi.spyOn(trainingModule, "processTraining").mockReturnValue(mockProcessedState);

    const result = applyTraining(mockState);

    expect(trainingModule.processTraining).toHaveBeenCalledWith(mockState);
    expect(result).toBe(mockProcessedState);
  });
});
