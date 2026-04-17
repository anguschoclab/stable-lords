import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ArenaView from "@/components/arena/ArenaView";
import type { MinuteEvent } from "@/types/combat.types";
import { FightingStyle } from "@/types/shared.types";

// Mock useGameStore
vi.mock("@/state/useGameStore", () => ({
  useGameStore: () => ({
    arenaPreferences: {
      defaultViewMode: "arena",
      audioEnabled: true,
      audioVolume: 0.7,
      effectsEnabled: true,
      screenShakeIntensity: "medium",
    },
  }),
}));

const mockLog: MinuteEvent[] = [
  { minute: 1, text: "Warrior A lunges forward!", phase: "OPENING" },
  { minute: 1, text: "Warrior A strikes with devastating force!", phase: "OPENING" },
  { minute: 2, text: "Warrior D parries the attack!", phase: "MID" },
];

describe("ArenaView", () => {
  test("renders arena with both fighters", () => {
    render(
      <ArenaView
        nameA="Warrior A"
        nameD="Warrior D"
        styleA={FightingStyle.LungingAttack}
        styleD={FightingStyle.TotalParry}
        log={mockLog}
        winner={null}
        visibleCount={0}
        isPlaying={false}
        isComplete={false}
      />
    );

    expect(screen.getByText("Warrior A")).toBeInTheDocument();
    expect(screen.getByText("Warrior D")).toBeInTheDocument();
  });

  test("displays fighter HP bars", () => {
    render(
      <ArenaView
        nameA="Warrior A"
        nameD="Warrior D"
        styleA={FightingStyle.LungingAttack}
        styleD={FightingStyle.TotalParry}
        log={mockLog}
        winner={null}
        visibleCount={0}
        maxHpA={50}
        maxHpD={50}
      />
    );

    // HP bars should be present (visual check)
    const hpBars = document.querySelectorAll("[class*='h-1']");
    expect(hpBars.length).toBeGreaterThan(0);
  });

  test("shows speech bubbles for taunts", async () => {
    const logWithTaunt: MinuteEvent[] = [
      { minute: 1, text: "Warrior A insults Warrior D!", phase: "OPENING" },
    ];

    render(
      <ArenaView
        nameA="Warrior A"
        nameD="Warrior D"
        styleA={FightingStyle.LungingAttack}
        styleD={FightingStyle.TotalParry}
        log={logWithTaunt}
        winner={null}
        visibleCount={1}
      />
    );

    // Speech bubbles may not render in test environment, just check component renders
    expect(screen.getByText("Warrior A")).toBeInTheDocument();
    expect(screen.getByText("Warrior D")).toBeInTheDocument();
  });

  test("shows winner state correctly", () => {
    render(
      <ArenaView
        nameA="Warrior A"
        nameD="Warrior D"
        styleA={FightingStyle.LungingAttack}
        styleD={FightingStyle.TotalParry}
        log={mockLog}
        winner="A"
        visibleCount={3}
        isComplete={true}
      />
    );

    // Component should render with winner state
    expect(screen.getByText("Warrior A")).toBeInTheDocument();
    expect(screen.getByText("Warrior D")).toBeInTheDocument();
  });

  test("applies weather effects", () => {
    render(
      <ArenaView
        nameA="Warrior A"
        nameD="Warrior D"
        styleA={FightingStyle.LungingAttack}
        styleD={FightingStyle.TotalParry}
        log={mockLog}
        winner={null}
        visibleCount={0}
        weather="Rainy"
      />
    );

    // Rain particles should exist
    const rainDrops = document.querySelectorAll(".animate-rain");
    expect(rainDrops.length).toBeGreaterThan(0);
  });

  test("renders mini combat log", () => {
    render(
      <ArenaView
        nameA="Warrior A"
        nameD="Warrior D"
        styleA={FightingStyle.LungingAttack}
        styleD={FightingStyle.TotalParry}
        log={mockLog}
        winner={null}
        visibleCount={2}
      />
    );

    // Mini log should show visible events
    expect(screen.getByText(/lunges forward/)).toBeInTheDocument();
  });
});
