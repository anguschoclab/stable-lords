// Mock localStorage FIRST
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) { return store[key] || null; },
    setItem: function(key: string, value: string) { store[key] = value.toString(); },
    removeItem: function(key: string) { delete store[key]; },
    clear: function() { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Trainers from "@/pages/Trainers";
import { renderWithGameState } from "../testUtils";
import { createFreshState } from "@/state/gameStore";
import type { GameState, TrainerData } from "@/types/game";
import "../setup";
import { useGameStore } from "@/state/useGameStore";

// Mock the router components
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));


// Mock Radix UI Tabs to always render both contents for easy testing
vi.mock("@/components/ui/tabs", () => {
  return {
    Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default={defaultValue}>{children}</div>,
    TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
    TabsTrigger: ({ value, children }: any) => <button data-testid={`tab-trigger-${value}`}>{children}</button>,
    TabsContent: ({ value, children }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>,
  };
});


describe("Trainers Component", () => {
  let mockState: GameState;

  const dummyTrainer: TrainerData = {
    id: "t1",
    name: "Master Splinter",
    tier: "Master",
    focus: "Aggression",
    fame: 10,
    contractWeeksLeft: 8,
  };

  const poolTrainer: TrainerData = {
    id: "t2",
    name: "Coach Rocky",
    tier: "Seasoned",
    focus: "Defense",
    fame: 5,
    contractWeeksLeft: 12,
  };

  beforeEach(() => {
    mockState = createFreshState();
    mockState.gold = 500;

    // Seed trainers
    mockState.trainers = [dummyTrainer];
    mockState.hiringPool = [poolTrainer];
  });

  it("renders current trainers correctly", async () => {
    renderWithGameState(<Trainers />, mockState);

    const staffElements = await screen.findAllByText("Master Splinter");
    expect(staffElements.length).toBeGreaterThan(0);

    const focusBadge = screen.getByText("Aggression SPECIALIST", { exact: false });
    expect(focusBadge).toBeInTheDocument();
  });

  it("renders hiring pool correctly", async () => {
    renderWithGameState(<Trainers />, mockState);

    const poolElements = await screen.findAllByText("Coach Rocky");
    expect(poolElements.length).toBeGreaterThan(0);

    const focusBadge = screen.getByText("Defense SPECIALIST", { exact: false });
    expect(focusBadge).toBeInTheDocument();
  });

  it("allows firing a trainer", async () => {
    renderWithGameState(<Trainers />, mockState);

    // Find the current trainer card - we need to go up to the card element
    const staffElement = (await screen.findAllByText("Master Splinter"))[0];
    const trainerCard = staffElement.closest(".rounded-lg")!;

    // The fire button now uses aria-label and a custom tooltip
    const fireBtn = within(trainerCard as HTMLElement).getByLabelText(/release trainer/i);
    fireEvent.click(fireBtn);

    // Test the state mutation implicitly by observing UI removal
    expect(screen.queryByText("Master Splinter")).not.toBeInTheDocument();
  });

  it("allows hiring a trainer", async () => {
    renderWithGameState(<Trainers />, mockState);

    // Find the hiring pool trainer container (it has a wrapping relative div containing the absolute button)
    const poolElement = (await screen.findAllByText("Coach Rocky"))[0];
    const poolRow = poolElement.closest(".relative")!;

    // Find and click the Hire button. Note: "Hire" is also the name of the tab trigger, so use within()
    const hireBtn = within(poolRow as HTMLElement).getByRole("button", { name: /hire/i });
    fireEvent.click(hireBtn);

    // Test that the Hire button within the pool row is gone (the trainer was removed from the pool)
    expect(within(poolRow as HTMLElement).queryByRole("button", { name: /hire/i })).not.toBeInTheDocument();
  });

});
