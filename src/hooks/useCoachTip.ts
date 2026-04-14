/**
 * Stable Lords — Onboarding Coach System
 * Non-blocking toast-based contextual tips keyed by page/state.
 * Supports exact routes and pattern-matched dynamic routes.
 */
import { useEffect } from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { toast } from "sonner";
import type { GameState, Warrior } from "@/types/game";

export interface CoachTip {
  id: string;
  /** Static message or dynamic builder from state + route params */
  message: string | ((state: GameState, context?: CoachContext) => string);
  /** Only show if this returns true */
  condition?: (state: GameState, context?: CoachContext) => boolean;
}

interface CoachContext {
  warrior?: Warrior;
}

interface RouteEntry {
  pattern: string | RegExp;
  tips: CoachTip[];
}

const COACH_ROUTES: RouteEntry[] = [
  // ── Arena Hub ───────────────────────────────────────────────────────────
  {
    pattern: "/",
    tips: [
      {
        id: "hub-welcome",
        message: "👋 Welcome to the Arena Hub! This is your command center. Check your roster, track crowd mood, and read the Gazette.",
      },
      {
        id: "hub-run-round",
        message: "⚔️ Ready for action? Head to 'Run Round' to send your warriors into the arena.",
        condition: (s) => s.roster.length >= 2 && s.arenaHistory.length <= 1,
      },
      {
        id: "hub-recruit-more",
        message: "📢 Your stable is thin! Recruit more warriors to keep a healthy rotation and avoid burnout.",
        condition: (s) => s.roster.filter((w) => w.status === "Active").length === 1 && s.arenaHistory.length >= 2,
      },
      {
        id: "hub-tournament-ready",
        message: "🏆 You've fought enough rounds to try a Tournament! Check the Tournaments page to compete for seasonal glory.",
        condition: (s) => s.arenaHistory.length >= 4 && s.tournaments.length === 0,
      },
    ],
  },

  // ── Combat ──────────────────────────────────────────────────────────
  {
    pattern: "/command/combat",
    tips: [
      {
        id: "round-first",
        message: "⚡ Each round pairs your active warriors for bouts. Results affect fame, popularity, and can even be fatal!",
      },
      {
        id: "round-strategy",
        message: "🧠 Tip: Customize your warriors' strategies on their detail page before running rounds. OE/AL settings matter!",
        condition: (s) => s.arenaHistory.length >= 3 && s.roster.every((w) => !w.plan),
      },
    ],
  },

  // ── Personnel ────────────────────────────────────────────────────────────
  {
    pattern: "/ops/personnel",
    tips: [
      {
        id: "recruit-tip",
        message: "🛡️ Allocate 70 attribute points carefully. High WT warriors learn faster. High ST hit harder. Balance is key.",
      },
      {
        id: "recruit-style-diversity",
        message: "🎯 Try recruiting a different fighting style! Style diversity makes your stable harder to counter.",
        condition: (s) => {
          const styles = new Set(s.roster.map((w) => w.style));
          return s.roster.length >= 3 && styles.size <= 2;
        },
      },
    ],
  },

  // ── Personnel (Trainers tab) ──────────────────────────────────────────────────────────
  {
    pattern: "/ops/personnel",
    tips: [
      {
        id: "trainers-first",
        message: "🎓 Trainers provide passive bonuses to your warriors. Hire up to 3 and choose focuses that complement your stable's style.",
      },
      {
        id: "trainers-convert",
        message: "♻️ Retired warriors can become trainers! They get style bonuses for warriors matching their old fighting style.",
        condition: (s) => s.retired.length >= 1 && (s.trainers ?? []).length < 3,
      },
    ],
  },

  // ── Tournaments ────────────────────────────────────────────────────────
  {
    pattern: "/world/tournaments",
    tips: [
      {
        id: "tournament-tip",
        message: "🏆 Tournaments run each season. Win to earn titles and major fame boosts for your stable.",
        condition: (s) => s.roster.filter((w) => w.status === "Active").length >= 2,
      },
    ],
  },

  // ── Chronicle ─────────────────────────────────────────────────────────
  {
    pattern: "/world/chronicle",
    tips: [
      {
        id: "chronicle-tip",
        message: "📜 The Chronicle records every bout. Check Legends for fight-of-the-week awards and Style Stats for meta trends.",
      },
    ],
  },

  // ── Chronicle (Graveyard tab) ─────────────────────────────────────────────────────────
  {
    pattern: "/world/chronicle",
    tips: [
      {
        id: "graveyard-first-death",
        message: "💀 The arena is unforgiving. Fallen warriors are remembered here. Consider retiring veterans before they fall.",
        condition: (s) => s.graveyard.length >= 1,
      },
    ],
  },

  // ── Warrior Detail (dynamic route) ────────────────────────────────────
  {
    pattern: /^\/warrior\/.+/,
    tips: [
      {
        id: "warrior-equipment",
        message: "⚔️ Equip your warrior! Weapon choice affects damage and speed. Heavier armor protects but slows you down.",
        condition: (s, ctx) => !!ctx?.warrior && !ctx.warrior.equipment && !ctx.warrior.gear,
      },
      {
        id: "warrior-strategy",
        message: "📋 Set a fight strategy! Adjust Offensive Effort (OE) and Activity Level (AL) to control aggression. Try phase-based overrides for advanced tactics.",
        condition: (s, ctx) => !!ctx?.warrior && !ctx.warrior.plan,
      },
      {
        id: "warrior-strategy-tune",
        message: "🎛️ Lost a few fights? Try adjusting OE/AL. Lower OE conserves energy for longer bouts. Higher AL keeps pressure on aggressive opponents.",
        condition: (s, ctx) => {
          const w = ctx?.warrior;
          if (!w) return false;
          return w.career.losses >= 2 && w.career.wins === 0 && !!w.plan;
        },
      },
      {
        id: "warrior-retirement",
        message: "🏖️ This veteran has earned their rest. Consider retiring them — retired warriors can become trainers with style bonuses!",
        condition: (s, ctx) => {
          const w = ctx?.warrior;
          if (!w) return false;
          return (w.career.wins + w.career.losses) >= 8 && w.fame >= 5;
        },
      },
      {
        id: "warrior-injured",
        message: "🩹 This warrior is injured! Injuries reduce combat effectiveness. Consider resting them or adjusting their strategy to play defensively.",
        condition: (s, ctx) => (ctx?.warrior?.injuries?.length ?? 0) >= 1,
      },
      {
        id: "warrior-champion",
        message: "👑 Your champion commands respect! They gain extra fame from victories. Protect this warrior — losing a champion hurts stable morale.",
        condition: (s, ctx) => ctx?.warrior?.champion === true,
      },
      {
        id: "warrior-first-visit",
        message: "📊 This is your warrior's detail page. View stats, set equipment and strategy, and track their career from here.",
      },
    ],
  },
];

function matchRoute(pathname: string): RouteEntry | undefined {
  return COACH_ROUTES.find((entry) => {
    if (typeof entry.pattern === "string") return entry.pattern === pathname;
    return entry.pattern.test(pathname);
  });
}

/**
 * Hook: shows a coach toast tip for the current route.
 * Tips dismissed permanently via game state.
 */
export function useCoachTip(pathname: string) {
  const state = useWorldState();
  const { setState } = useGameStore();
  const ftueComplete = state.ftueComplete;

  useEffect(() => {
    if (!ftueComplete) return;

    const entry = matchRoute(pathname);
    if (!entry) return;

    // Use current store state for tip selection to avoid stale closure issues
    // Note: while we access from 'state' here, tip.id is what we need for the timer
    const dismissed = state.coachDismissed ?? [];
    
    // Build context for dynamic routes
    const context: CoachContext = {};
    const warriorMatch = pathname.match(/^\/warrior\/(.+)/);
    if (warriorMatch) {
      context.warrior = state.roster.find((w: any) => w.id === warriorMatch[1]);
    }

    const tip = entry.tips.find(
      (t) => !dismissed.includes(t.id) && (!t.condition || t.condition(state, context))
    );

    if (!tip) return;

    const message = typeof tip.message === "function" ? tip.message(state, context) : tip.message;

    const timer = setTimeout(() => {
      toast(message, {
        duration: 8000,
        action: {
          label: "Got it",
          onClick: () => {
            setState((prev) => ({
              ...prev,
              coachDismissed: [...(prev.coachDismissed ?? []), tip.id],
            }));
          },
        },
      });
      // Mark dismissed after showing using functional update to avoid stale state data
      setState((prev) => ({
        ...prev,
        coachDismissed: Array.from(new Set([...(prev.coachDismissed ?? []), tip.id])),
      }));
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, ftueComplete]);
}
