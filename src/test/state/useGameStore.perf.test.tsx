import { render, act } from "@testing-library/react";
import { useGameStore } from "@/state/useGameStore";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { useShallow } from "zustand/react/shallow";

// Mock component that tracks renders via ref
const RenderTracker = ({ selector, renderCountRef }: { selector: (state: any) => any, renderCountRef: React.MutableRefObject<number> }) => {
  const value = useGameStore(selector);
  renderCountRef.current++;
  return <div data-testid="value">{JSON.stringify(value)}</div>;
};

describe("useGameStore Optimization (Epic 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("re-renders when selected state changes", async () => {
    const renderCountRef = { current: 0 };
    const selector = (s: any) => s.treasury;

    render(<RenderTracker selector={selector} renderCountRef={renderCountRef} />);
    expect(renderCountRef.current).toBe(1);

    await act(async () => {
      useGameStore.getState().setState((draft: any) => {
        draft.treasury += 10;
      });
    });

    expect(renderCountRef.current).toBe(2);
  });

  it("does NOT re-render when unrelated state changes (with precise selector)", async () => {
    const renderCountRef = { current: 0 };
    const selector = (s: any) => s.treasury;

    render(<RenderTracker selector={selector} renderCountRef={renderCountRef} />);
    expect(renderCountRef.current).toBe(1);

    await act(async () => {
      useGameStore.getState().setState((draft: any) => {
        draft.week += 1;
      });
    });

    // Zustand with precise selector (returning primitive) should NOT re-render
    expect(renderCountRef.current).toBe(1);
  });

  it("requires useShallow for object-returning selectors to avoid extra renders", async () => {
    const renderCountWithShallow = { current: 0 };
    const selector = (s: any) => ({ treasury: s.treasury, week: s.week });

    const WithShallow = () => {
      const val = useGameStore(useShallow(selector));
      renderCountWithShallow.current++;
      return <div>{val.treasury}</div>;
    };

    render(<WithShallow />);

    expect(renderCountWithShallow.current).toBe(1);

    await act(async () => {
      useGameStore.getState().setState((draft: any) => {
        draft.crowdMood = "Bloodthirsty";
      });
    });

    // WithShallow should NOT re-render because the returned object is shallowly equal
    expect(renderCountWithShallow.current).toBe(1);

    await act(async () => {
      useGameStore.getState().setState((draft: any) => {
        draft.treasury += 10;
      });
    });

    // WithShallow SHOULD re-render when selected values change
    expect(renderCountWithShallow.current).toBe(2);
  });
});
