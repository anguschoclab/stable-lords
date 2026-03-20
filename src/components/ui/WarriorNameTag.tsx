import React from "react";
import { Trophy, Crown, Heart, Skull } from "lucide-react";
import { WarriorLink } from "@/components/EntityLink";

interface WarriorNameTagProps {
  id?: string;
  name: string;
  isChampion?: boolean;
  injuryCount?: number;
  useCrown?: boolean;
  isDead?: boolean;
}

export function WarriorNameTag({
  id,
  name,
  isChampion,
  injuryCount = 0,
  useCrown = false,
  isDead = false,
}: WarriorNameTagProps) {
  const ChampionIcon = useCrown ? Crown : Trophy;

  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-display font-semibold text-sm truncate ${isDead ? "text-muted-foreground line-through" : ""}`}>
        {id ? (
          <WarriorLink name={name} id={id}>
            {name}
          </WarriorLink>
        ) : (
          name
        )}
      </span>
      {isDead && <Skull className="h-3 w-3 text-muted-foreground shrink-0" />}
      {isChampion && <ChampionIcon className="h-3 w-3 text-arena-gold shrink-0" />}
      {injuryCount > 0 && <Heart className="h-3 w-3 text-destructive shrink-0" />}
    </div>
  );
}
