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
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import WorldOverview from "@/pages/WorldOverview";
import { renderWithGameState } from "../testUtils";
import { createFreshState } from "@/state/gameStore";
import { FightingStyle } from "@/types/game";
import type { Warrior, GameState } from "@/types/game";
import "../setup";

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


// Utility to create a dummy warrior
function createDummyWarrior(name: string, status: Warrior["status"], wins: number, losses: number, fame: number): Warrior {
  return {
    id: name,
    name,
    status,
    style: FightingStyle.AimedBlow,
    age: 20,
    potential: "Average",
    fame,
    popularity: 0,
    career: { wins, losses, kills: 0, highestRank: 0 },
    stats: {
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
      derivedStats: { hp: 20, endurance: 20, damage: 10, encumbrance: 0 }
    },
    titles: [],
    history: [],
    condition: { hpCurrent: 20, enduranceCurrent: 20, injuries: [], fatigue: 0 }
  };
}

describe("WorldOverview Component", () => {
  let mockState: GameState;

  beforeEach(() => {
    mockState = createFreshState();

    // Setup player stable
    mockState.player = {
      id: "p1",
      name: "Player Owner",
      stableName: "Player Stable",
      fame: 100,
      titles: 0,
      renown: 0,
    };

    mockState.roster = [
      createDummyWarrior("PlayerWarrior1", "Active", 10, 5, 50),
      createDummyWarrior("PlayerWarrior2", "Active", 5, 10, 20),
    ];

    // Setup rival stable
    mockState.rivals = [
      {
        owner: { id: "r1", name: "Rival Owner", stableName: "Rival Stable", fame: 80, renown: 0, titles: 0, personality: "Aggressive" },
        roster: [
          createDummyWarrior("RivalWarrior1", "Active", 20, 0, 90),
        ],
        budget: 100,
        philosophy: "Aggressive",
        history: []
      }
    ];
  });

  it("renders stable rows correctly with aggregated stats", async () => {
    renderWithGameState(<WorldOverview />, mockState);

    // Use findAllByText since stable names might appear multiple times due to tooltips/links
    // In this view, they should be rendered as a Link, and the table rows contain the stats.
    const playerStables = await screen.findAllByText("Player Stable");
    expect(playerStables.length).toBeGreaterThan(0);
    expect(screen.getByText("Player Owner")).toBeInTheDocument();

    // We look for the cell containing '15' which corresponds to wins and losses.
    // The closest('tr') from the first text matching might be the wrong thing depending on if it's the tab.
    // Let's use a distinct text element in the row.
    const pOwner = screen.getByText("Player Owner");
    const playerRow = pOwner.closest("tr")!;
    expect(playerRow).not.toBeNull();
    const playerWlkCell = within(playerRow).getAllByText(/15/);
    expect(playerWlkCell.length).toBeGreaterThan(0);

    // Check Rival Stable row
    const rivalStables = await screen.findAllByText("Rival Stable");
    expect(rivalStables.length).toBeGreaterThan(0);

    const rOwner = screen.getByText("Rival Owner");
    const rivalRow = rOwner.closest("tr")!;
    expect(rivalRow).not.toBeNull();
    const rivalWlkCell = within(rivalRow).getAllByText(/20/);
    expect(rivalWlkCell.length).toBeGreaterThan(0);
  });

  it("renders warrior rows correctly", async () => {
    renderWithGameState(<WorldOverview />, mockState);

    // Since we mocked TabsContent to always render, we can query it directly
    const pw1Elements = await screen.findAllByText("PlayerWarrior1");
    expect(pw1Elements.length).toBeGreaterThan(0);

    const rw1Elements = await screen.findAllByText("RivalWarrior1");
    expect(rw1Elements.length).toBeGreaterThan(0);

    const pw1Row = pw1Elements[0].closest("tr")!;
    const pw1Cells = within(pw1Row).getAllByText(/Player Stable/i);
    expect(pw1Cells.length).toBeGreaterThan(0);
    expect(pw1Row).toHaveTextContent("10"); // wins
    expect(pw1Row).toHaveTextContent("5"); // losses
  });
});
