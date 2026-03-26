/**
 * Entity Links — Warriors and Stables.
 * Now triggers a side-panel <Sheet> (flyout) with full dossiers.
 */
import React from "react";
import { Link } from "@tanstack/react-router";
import { useGameStore as useGame } from "@/state/useGameStore";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WarriorDossier } from "@/components/WarriorDossier";
import { StableDossier } from "@/components/StableDossier";
import { Button } from "@/components/ui/button";
import { ExternalLink, User, Landmark } from "lucide-react";

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
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={cn(
            "text-primary hover:underline underline-offset-2 transition-colors cursor-pointer text-left font-bold",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children ?? name}
        </button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md border-l-primary/20 bg-card/95 backdrop-blur-md">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Warrior Dossier
            </div>
            <Link to={`/warrior/${resolvedId}` as any}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 h-full">
          <WarriorDossier warriorId={resolvedId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function resolveWarriorId(name: string, state: any): string | undefined {
  if (!state) return undefined;
  const active = state.roster?.find((w: any) => w.name === name);
  if (active) return active.id;
  const dead = state.graveyard?.find((w: any) => w.name === name);
  if (dead) return dead.id;
  const retired = state.retired?.find((w: any) => w.name === name);
  if (retired) return retired.id;
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
  const rival = (state.rivals ?? []).find(r => r.owner.stableName === name);
  const isPlayer = state.player.stableName === name;
  const stableId = isPlayer ? "player" : rival?.owner.id;

  if (!stableId) {
    return <span className={className}>{children ?? name}</span>;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={cn(
            "text-arena-gold hover:underline underline-offset-2 transition-colors cursor-pointer text-left font-bold",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children ?? name}
        </button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md border-l-arena-gold/20 bg-card/95 backdrop-blur-md">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-arena-gold" />
              Stable Records
            </div>
            <Link to={isPlayer ? "/stable" : (`/stable/${stableId}` as any)}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 h-full">
          <StableDossier stableId={stableId} stableName={name} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { WarriorLink as WarriorLinkSheet, StableLink as StableLinkSheet };
