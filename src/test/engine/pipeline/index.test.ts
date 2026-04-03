import { describe, it, expect, vi } from "vitest";
import { pipe, type PipelineStep } from "@/engine/pipeline/index";
import { type GameState } from "@/types/game";

describe("pipe", () => {
  it("should return the initial state if no steps are provided", () => {
    const initialState = { week: 1, gold: 100 } as GameState;
    const result = pipe(initialState);
    expect(result).toBe(initialState);
  });

  it("should apply a single step to the state", () => {
    const initialState = { week: 1, gold: 100 } as GameState;
    const step1: PipelineStep = (state) => ({ ...state, gold: state.gold + 50 });

    const result = pipe(initialState, step1);
    expect(result).toEqual({ week: 1, gold: 150 });
  });

  it("should apply multiple steps to the state in order", () => {
    const initialState = { week: 1, gold: 100 } as GameState;
    const step1: PipelineStep = (state) => ({ ...state, gold: state.gold + 50 });
    const step2: PipelineStep = (state) => ({ ...state, week: state.week + 1 });
    const step3: PipelineStep = (state) => ({ ...state, gold: state.gold * 2 });

    const result = pipe(initialState, step1, step2, step3);

    // (100 + 50) * 2 = 300
    expect(result).toEqual({ week: 2, gold: 300 });
  });

  it("should pass the output of one step as the input to the next step", () => {
    const initialState = { id: "test", log: [] as string[] } as unknown as GameState;

    const step1: PipelineStep = vi.fn((state) => ({ ...state, log: [...(state as any).log, "step1"] }));
    const step2: PipelineStep = vi.fn((state) => ({ ...state, log: [...(state as any).log, "step2"] }));

    const result = pipe(initialState, step1, step2);

    expect(step1).toHaveBeenCalledWith(initialState);
    expect(step2).toHaveBeenCalledWith(expect.objectContaining({ log: ["step1"] }));

    expect((result as any).log).toEqual(["step1", "step2"]);
  });
});
