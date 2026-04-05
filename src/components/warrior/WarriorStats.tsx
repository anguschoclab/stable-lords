import React from "react";
import { type Warrior } from "@/types/game";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { growthNarrative } from "./GrowthHelpers";
import { generateWarriorStatements } from "@/data/warriorStatements";
import { StatBattery } from "@/components/ui/StatBattery";

export function AttrBar({ label, value, potential, max = 25 }: { label: string; value: number; potential?: number; max?: number }) {
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
                <TooltipContent side="left" className="w-full max-w-[200px] text-xs">
                  {growth.tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <StatBattery
        label=""
        value={value}
        max={max}
        className="[&>span:first-child]:hidden"
      />
    </div>
  );
}

export function SkillBar({ label, value, max = 20 }: { label: string; value: number; max?: number }) {
  return <StatBattery label={label} value={value} max={max} />;
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
