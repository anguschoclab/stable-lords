/**
 * Clickable entity links — warrior names, stable names, trainer names.
 * Resolves names to IDs by searching roster, graveyard, retired, and rival rosters.
 */
import React from "react";
import { Link } from "@tanstack/react-router";
import { useGameStore } from "@/state/useGameStore";
import { cn } from "@/lib/utils";

// ─── Warrior Link ──────────────────────────────────────────────────────────

interface WarriorLinkProps {
  name: string;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function WarriorLink({ name, id, className, children }: WarriorLinkProps) {
  const { state } = useGame();

  const resolvedId = id ?? resolveWarriorId(name, state);

  if (!resolvedId) {
    return <span className={className}>{children ?? name}</span>;
  }

  return (
    <Link
      to={`/warrior/${resolvedId}`}
      className={cn(
        "hover:text-primary hover:underline underline-offset-2 transition-colors cursor-pointer",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children ?? name}
    </Link>
  );
}

function resolveWarriorId(name: string, state: any): string | undefined {
  // Active roster
  const active = state.roster?.find((w: any) => w.name === name);
  if (active) return active.id;

  // Graveyard
  const dead = state.graveyard?.find((w: any) => w.name === name);
  if (dead) return dead.id;

  // Retired
  const retired = state.retired?.find((w: any) => w.name === name);
  if (retired) return retired.id;

  // Rival rosters
  for (const rival of state.rivals ?? []) {
    const rw = rival.roster?.find((w: any) => w.name === name);
    if (rw) return rw.id;
  }

  return undefined;
}

// ─── Stable Link ───────────────────────────────────────────────────────────

interface StableLinkProps {
  name: string;
  className?: string;
  children?: React.ReactNode;
}

export function StableLink({ name, className, children }: StableLinkProps) {
  const { state } = useGame();

  // Resolve stable name to owner ID
  const stableId = (state.rivals ?? []).find(r => r.owner.stableName === name)?.owner.id;
  const to = stableId ? `/stable/${stableId}` : "/scouting";

  return (
    <Link
      to={to}
      className={cn(
        "hover:text-primary hover:underline underline-offset-2 transition-colors cursor-pointer",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children ?? name}
    </Link>
  );
}

// ─── Trainer Link ──────────────────────────────────────────────────────────

interface TrainerLinkProps {
  name: string;
  className?: string;
  children?: React.ReactNode;
}

export function TrainerLink({ name, className, children }: TrainerLinkProps) {
  return (
    <Link
      to="/trainers"
      className={cn(
        "hover:text-primary hover:underline underline-offset-2 transition-colors cursor-pointer",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children ?? name}
    </Link>
  );
}
