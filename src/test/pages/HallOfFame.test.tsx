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
import { render, screen, within } from "@testing-library/react";
import HallOfFame from "@/pages/HallOfFame";
import { renderWithGameState } from "../testUtils";
import { createFreshState } from "@/engine/factories";
import { FightingStyle } from "@/types/game";
import type { GameState, FightSummary, NewsletterItem, Warrior } from "@/types/game";
import "../setup";

// Must mock the module before importing it inside components
vi.mock("@/engine/history/arenaHistory", () => {
  return {
    ArenaHistory: {
      all: vi.fn().mockReturnValue([]),
      append: vi.fn(),
      clear: vi.fn(),
      query: vi.fn().mockReturnValue([])
    }
  };
});

import { ArenaHistory } from "@/engine/history/arenaHistory";

// Mock the router components
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));


// Utility to create a dummy warrior
function createDummyWarrior(name: string, status: Warrior["status"], wins: number, losses: number, fame: number): Warrior {
  return {
    id: name,
    name,
    status,
    style: FightingStyle.AimedBlow,
    age: 20,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
    popularity: 0,
    career: { wins, losses, kills: 0 },
    titles: [],
    injuries: [],
    flair: [],
    champion: false,
  } as unknown;
}

describe("HallOfFame Component", () => {
  let mockState: GameState;

  const mockNewsletter: NewsletterItem = {
    week: 52,
    title: "Year 1 Hall of Fame", // Must include "Hall of Fame"
    items: [
      "HALL OF FAME: Gladiator (AB) is inducted!",
      "DEADLIEST BLADE: Reaper earns the blood title.",
      "IRON CHAMPION: The Mountain recorded the best defense."
    ],
  };

  const fight1: FightSummary = {
    id: "f1", week: 10, title: "Reaper vs Victim", a: "Reaper", d: "Victim", winner: "A", by: "Kill", styleA: FightingStyle.LungingAttack, styleD: FightingStyle.AimedBlow, createdAt: new Date().toISOString()
  };
  const fight2: FightSummary = {
    id: "f2", week: 20, title: "Reaper vs Victim2", a: "Reaper", d: "Victim2", winner: "A", by: "KO", styleA: FightingStyle.LungingAttack, styleD: FightingStyle.AimedBlow, createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    mockState = createFreshState("test-seed");
    mockState.week = 53; // ensure it's past week 52 for year calculation
    mockState.newsletter = [mockNewsletter];

    // Add warriors to roster so they can be matched
    mockState.roster = [
      createDummyWarrior("Gladiator", "Active", 30, 5, 150),
      createDummyWarrior("Reaper", "Active", 20, 5, 120),
      createDummyWarrior("The Mountain", "Active", 15, 0, 90),
    ];

    // Setup ArenaHistory mock
    vi.mocked(ArenaHistory.all).mockReturnValue([fight1, fight2]);
  });

  it("renders the inductees correctly", async () => {
    renderWithGameState(<HallOfFame />, mockState);

    // Check that we're showing the correct year section
    expect(await screen.findByText("Year 1 Inductees")).toBeInTheDocument();

    // Check for the warriors
    expect((await screen.findAllByText("Gladiator")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Reaper")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("The Mountain")).length).toBeGreaterThan(0);
  });

  it("identifies and displays the best fight correctly", async () => {
    renderWithGameState(<HallOfFame />, mockState);

    // The Reaper card should show their best fight: "Reaper vs Victim" (kill) instead of "Reaper vs Victim2" (KO)
    // Find all 'Reaper' text instances and look for the one in a header/card context
    const reaperElements = await screen.findAllByText("Reaper");
    const reaperElement = reaperElements.find(el => el.tagName === 'SPAN' || el.tagName === 'H3' || el.closest(".rounded-lg"))!;
    const reaperCard = reaperElement.closest(".rounded-lg")!;
    expect(reaperCard).not.toBeNull();

    // Within the card, look for the 'Greatest Fight' section block
    const greatestFightSection = within(reaperCard as HTMLElement).getByText("CHRONICLE_PEAK").closest("div")?.parentElement;
    expect(greatestFightSection).not.toBeUndefined();

    // Search for the opponent's name within this section
    const opponent = within(greatestFightSection!).getByText("Victim");
    expect(opponent).toBeInTheDocument();

    // fight2 (Victim2) shouldn't be the top
    expect(within(reaperCard as HTMLElement).queryByText(/Victim2/)).not.toBeInTheDocument();
  });

});
