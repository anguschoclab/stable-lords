import React from "react";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Warrior } from "@/types/game";

interface LethalityBadgeProps {
  wA: Warrior;
  wB: Warrior;
  crowdMood: string;
}

export function getLethalityScore(wA: Warrior, wB: Warrior, crowdMood: string) {
  let score = 0;
  // Lower HP = higher risk
  const hpA = wA.derivedStats?.hp ?? 0;
  const hpB = wB.derivedStats?.hp ?? 0;
  
  if (hpA < 15 || hpB < 15) score += 2;
  else if (hpA < 25 || hpB < 25) score += 1;

  const powerStyles = ["Bashing Attack", "Striking Attack", "Slashing Attack", "Lunging Attack"];
  if (powerStyles.includes(wA.style)) score += 1;
  if (powerStyles.includes(wB.style)) score += 1;

  if (crowdMood === "Bloodthirsty") score += 2;
  else if (crowdMood === "Restless") score += 1;

  return score;
}

export function LethalityBadge({ wA, wB, crowdMood }: LethalityBadgeProps) {
  const score = getLethalityScore(wA, wB, crowdMood);

  if (score >= 4) {
    return (
      <Badge variant="outline" className="border-destructive/50 text-destructive bg-destructive/5 gap-1.5 font-black uppercase text-[9px] tracking-widest px-2.5">
        <Shield className="h-3 w-3" /> High Lethality Risk
      </Badge>
    );
  }
  if (score >= 2) {
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/5 gap-1.5 font-black uppercase text-[9px] tracking-widest px-2.5">
        <Shield className="h-3 w-3" /> Moderate Danger
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-border/40 text-muted-foreground/60 gap-1.5 font-black uppercase text-[9px] tracking-widest px-2.5">
      <Shield className="h-3 w-3" /> Standard Bout
    </Badge>
  );
}
