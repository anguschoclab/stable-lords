// Test utilities

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Trainers from "@/pages/Trainers";
import { renderWithGameState } from "../testUtils";
import { createFreshState } from "@/engine/factories";
import type { GameState, Trainer as TrainerData } from "@/types/state.types";
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
    age: 45,
    fame: 10,
    contractWeeksLeft: 8,
  };

  const poolTrainer: TrainerData = {
    id: "t2",
    name: "Coach Rocky",
    tier: "Seasoned",
    focus: "Defense",
    age: 38,
    fame: 5,
    contractWeeksLeft: 12,
  };

  beforeEach(() => {
    mockState = createFreshState("test-seed");
    mockState.treasury = 500;

    // Seed trainers
    mockState.trainers = [dummyTrainer];
    mockState.hiringPool = [poolTrainer];
  });

  it("renders current trainers correctly", async () => {
    renderWithGameState(<Trainers />, mockState);

    const staffElements = await screen.findAllByText("Master Splinter");
    expect(staffElements.length).toBeGreaterThan(0);

    // Matching the focus text in the new UI impact box
    const focusBadge = screen.getAllByText(/Aggression/i)[0];
    expect(focusBadge).toBeInTheDocument();
  });

  it("renders hiring pool correctly", async () => {
    renderWithGameState(<Trainers />, mockState);

    const poolElements = await screen.findAllByText("Coach Rocky");
    expect(poolElements.length).toBeGreaterThan(0);

    const focusBadge = screen.getAllByText(/Defense/i)[0];
    expect(focusBadge).toBeInTheDocument();
  });

  it("allows firing a trainer", async () => {
    renderWithGameState(<Trainers />, mockState);

    // Find the current trainer card
    const trainerCard = (await screen.findAllByTestId("trainer-card")).find(el => el.textContent?.includes("Master Splinter"))!;

    // The fire button now uses aria-label="Release Trainer"
    const fireBtn = within(trainerCard as HTMLElement).getByLabelText(/release trainer/i);
    fireEvent.click(fireBtn);

    // Test the state mutation implicitly by observing UI removal
    expect(screen.queryByText("Master Splinter")).not.toBeInTheDocument();
  });

  it("allows hiring a trainer", async () => {
    renderWithGameState(<Trainers />, mockState);

    // Find the tab content for hire
    const hireTab = screen.getByTestId("tab-content-hire");
    
    // Find the trainer card within that tab
    const rockies = within(hireTab).getAllByText("Coach Rocky");
    const trainerCard = rockies[0].closest("[data-testid='trainer-card']")!;
    expect(trainerCard).not.toBeNull();

    // Find and click the Secure Contract button.
    const hireBtn = within(trainerCard as HTMLElement).getByText(/Secure_Contract/i);
    fireEvent.click(hireBtn);

    // Test that the card is moved (it should be removed from the hire tab)
    expect(within(hireTab).queryByText("Coach Rocky")).not.toBeInTheDocument();
  });

});
