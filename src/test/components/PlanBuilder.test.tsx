import { render, screen } from "@testing-library/react";
import PlanBuilder from "@/components/PlanBuilder";
import { FightingStyle } from "@/types/shared.types";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";

// Mock DnD to avoid context errors in JSDOM
vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({ 
    draggableProps: {}, 
    innerRef: vi.fn(), 
    droppableProps: {} 
  }, { isDraggingOver: false }),
  Draggable: ({ children }: any) => children({ 
    draggableProps: {}, 
    innerRef: vi.fn(), 
    dragHandleProps: {} 
  }, { isDragging: false }),
}));

describe("PlanBuilder Matchup Rendering", () => {
  const mockPlan = {
    style: FightingStyle.LungingAttack,
    OE: 5,
    AL: 5,
    target: "Any" as any,
    offensiveTactic: "none" as any,
    defensiveTactic: "none" as any,
  };

  it("renders MATCHUP_ADV when player has a style advantage", () => {
    // Lunging Attack (1.15) beats Aimed Blow
    render(
      <PlanBuilder 
        plan={mockPlan} 
        onPlanChange={vi.fn()} 
        rivalStyle={FightingStyle.AimedBlow} 
      />
    );

    expect(screen.getByText("MATCHUP_ADV")).toBeInTheDocument();
    expect(screen.getByText("+15%")).toBeInTheDocument();
  });

  it("renders MATCHUP_PENALTY when player has a style disadvantage", () => {
    // ParryLunge is weak to Lunging Attack (-1 penalty)
    const weakPlan = { ...mockPlan, style: FightingStyle.ParryLunge };
    render(
      <PlanBuilder 
        plan={weakPlan} 
        onPlanChange={vi.fn()} 
        rivalStyle={FightingStyle.LungingAttack} 
      />
    );

    expect(screen.getByText("MATCHUP_PENALTY")).toBeInTheDocument();
    expect(screen.getByText("-1")).toBeInTheDocument();
  });

  it("renders no badge when matchup is neutral", () => {
    render(
      <PlanBuilder 
        plan={mockPlan} 
        onPlanChange={vi.fn()} 
        rivalStyle={FightingStyle.LungingAttack} 
      />
    );

    expect(screen.queryByText("MATCHUP_ADV")).not.toBeInTheDocument();
    expect(screen.queryByText("MATCHUP_PENALTY")).not.toBeInTheDocument();
  });
});
