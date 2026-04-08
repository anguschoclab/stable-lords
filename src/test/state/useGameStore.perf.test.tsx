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
    const selector = (s: any) => s.treasury;
    
    render(<RenderTracker selector={selector} onRender={onRender} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    await act(async () => {
      useGameStore.getState().setState((draft: any) => {
        draft.treasury += 10;
      });
    });

    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it("does NOT re-render when unrelated state changes (with precise selector)", async () => {
    const onRender = vi.fn();
    const selector = (s: any) => s.treasury;
    
    render(<RenderTracker selector={selector} onRender={onRender} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    await act(async () => {
      useGameStore.getState().setState((draft: any) => {
        draft.week += 1;
      });
    });

    // Zustand with precise selector (returning primitive) should NOT re-render
    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it.skip("requires useShallow for object-returning selectors to avoid extra renders", async () => {
    const onRenderWithShallow = vi.fn();
    const onRenderWithoutShallow = vi.fn();
    const selector = (s: any) => ({ treasury: s.treasury, week: s.week });

    const WithShallow = () => {
      const val = useGameStore(useShallow(selector));
      onRenderWithShallow();
      return <div>{val.treasury}</div>;
    };

    const WithoutShallow = () => {
      const val = useGameStore(selector);
      onRenderWithoutShallow();
      return <div>{val.treasury}</div>;
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
      useGameStore.getState().setState((draft: any) => {
        draft.crowdMood = "Bloodthirsty";
      });
    });

    // WithShallow should NOT re-render because the returned object is shallowly equal
    expect(onRenderWithShallow).toHaveBeenCalledTimes(1);
    
    // WithoutShallow SHOULD re-render because it returns a NEW object every time
    expect(onRenderWithoutShallow).toHaveBeenCalledTimes(2);
  });
});
