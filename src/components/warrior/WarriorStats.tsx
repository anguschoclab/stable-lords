import React from "react";
import { type Warrior } from "@/types/game";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { growthNarrative } from "./GrowthHelpers";
import { generateWarriorStatements } from "@/data/warriorStatements";

export function AttrBar({ label, value, potential, max = 25 }: { label: string; value: number; potential?: number; max?: number }) {
  const currentPct = (value / max) * 100;
  const growth = growthNarrative(value, potential);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground w-20">{label}</span>
        <div className="flex items-center gap-2">
          {growth.label && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`text-[10px] italic ${growth.color} cursor-default`}>
                    {growth.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px] text-xs">
                  {growth.tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span className="text-sm font-mono font-semibold w-6 text-right">{value}</span>
        </div>
      </div>
      <div className="relative">
        <Progress value={currentPct} className="h-2 rounded-full overflow-hidden shadow-[0_0_5px_currentColor]" />
      </div>
    </div>
  );
}

export function SkillBar({ label, value, max = 20 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-8 font-mono">{label}</span>
      <div className="flex-1">
        <Progress value={pct} className="h-2 rounded-full overflow-hidden shadow-[0_0_5px_currentColor]" />
      </div>
      <span className="text-sm font-mono font-semibold w-6 text-right">{value}</span>
    </div>
  );
}

export function WarriorStatementsPanel({ warrior }: { warrior: Warrior }) {
  if (!warrior.baseSkills) return null;
  const statements = generateWarriorStatements(
    warrior.attributes.WT, warrior.attributes.SP, warrior.attributes.DF, warrior.baseSkills
  );
  const lines = [
    statements.initiative, statements.riposte, statements.attack,
    statements.parry, statements.defense, statements.endurance,
    statements.coordination, statements.quickness, statements.activity,
  ].filter(Boolean);

  if (lines.length === 0) return <p className="text-xs text-muted-foreground italic">No notable observations.</p>;

  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => (
        <li key={i} className="text-xs text-muted-foreground italic leading-relaxed">• {line}</li>
      ))}
    </ul>
  );
}
