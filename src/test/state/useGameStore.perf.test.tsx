import { render, act } from "@testing-library/react";
import { useGameStore } from "@/state/useGameStore";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { useRef } from "react";
import { useShallow } from "zustand/react/shallow";

// Mock component that tracks renders via a ref to avoid side effects during render
const RenderTracker = ({ selector, onRender }: { selector: (state: any) => any, onRender: () => void }) => {
  const value = useGameStore(selector);
  const renderCount = useRef(0);
  
  renderCount.current++;
  onRender();
  
  return <div data-testid="value">{JSON.stringify(value)}</div>;
};

describe("useGameStore Optimization (Epic 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("re-renders when selected state changes", async () => {
    const onRender = vi.fn();
    const selector = (s: any) => s.state.gold;
    
    render(<RenderTracker selector={selector} onRender={onRender} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    await act(async () => {
      const currentState = useGameStore.getState().state;
      useGameStore.getState().setState({ ...currentState, gold: currentState.gold + 10 });
    });

    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it("does NOT re-render when unrelated state changes (with precise selector)", async () => {
    const onRender = vi.fn();
    const selector = (s: any) => s.state.gold;
    
    render(<RenderTracker selector={selector} onRender={onRender} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    await act(async () => {
      const currentState = useGameStore.getState().state;
      // Change roster, but NOT gold
      useGameStore.getState().setState({ ...currentState, week: currentState.week + 1 });
    });

    // Zustand with precise selector (returning primitive) should NOT re-render
    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it.skip("requires useShallow for object-returning selectors to avoid extra renders", async () => {
    const onRenderWithShallow = vi.fn();
    const onRenderWithoutShallow = vi.fn();
    const selector = (s: any) => ({ gold: s.state.gold, week: s.state.week });

    const WithShallow = () => {
      const val = useGameStore(useShallow(selector));
      onRenderWithShallow();
      return <div>{val.gold}</div>;
    };

    const WithoutShallow = () => {
      const val = useGameStore(selector);
      onRenderWithoutShallow();
      return <div>{val.gold}</div>;
    };

    render(
      <>
        <WithShallow />
        <WithoutShallow />
      </>
    );

    expect(onRenderWithShallow).toHaveBeenCalledTimes(1);
    expect(onRenderWithoutShallow).toHaveBeenCalledTimes(1);

    await act(async () => {
      const currentState = useGameStore.getState().state;
      // Change something UNRELATED to both gold and week
      useGameStore.getState().setState({ ...currentState, crowdMood: "Bloodthirsty" });
    });

    // WithShallow should NOT re-render because the returned object is shallowly equal
    expect(onRenderWithShallow).toHaveBeenCalledTimes(1);
    
    // WithoutShallow SHOULD re-render because it returns a NEW object every time
    expect(onRenderWithoutShallow).toHaveBeenCalledTimes(2);
  });
});
