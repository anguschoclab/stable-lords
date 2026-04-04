import React from "react";
import { Trophy, Flame, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/WarriorBadges";
import { STYLE_DISPLAY_NAMES, FightingStyle, Warrior } from "@/types/game";

interface ObfuscatedWarrior {
  name: string;
  champion: boolean;
  style: FightingStyle | "UNKNOWN";
  career: { wins: number; losses: number; kills: number };
  fame: number;
  popularity: number;
  flair: string[];
  titles: string[];
  injuries: (string | { name: string })[];
}

interface WarriorHeroHeaderProps {
  warrior: ObfuscatedWarrior;
  record: string;
  streakLabel: string | null;
  streakVal: number;
}

export function WarriorHeroHeader({ warrior, record, streakLabel, streakVal }: WarriorHeroHeaderProps) {
  return (
    <div className="relative rounded-xl border border-border bg-gradient-to-br from-secondary via-card to-secondary p-4 sm:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/5 glow-neon-blue rounded-xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide break-all">{warrior.name}</h1>
            {warrior.champion && (
              <Badge className="bg-arena-gold text-black gap-1">
                <Trophy className="h-3 w-3" /> Champion
              </Badge>
            )}
          </div>
          <p className="text-lg text-muted-foreground font-display">
            {warrior.style === "UNKNOWN" ? "Unknown Style" : STYLE_DISPLAY_NAMES[warrior.style as FightingStyle]}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-mono text-sm text-muted-foreground">{record}</p>
            {streakLabel && (
              <Badge variant={streakVal > 0 ? "default" : "destructive"} className="text-xs gap-1">
                {streakLabel}
              </Badge>
            )}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {warrior.flair.map((f) => <TagBadge key={f} tag={f} type="flair" />)}
            {warrior.titles.map((t) => <TagBadge key={t} tag={t} type="title" />)}
            {warrior.injuries.map((i) => {
              const injName = typeof i === "string" ? i : i.name;
              return <TagBadge key={injName} tag={injName} type="injury" />;
            })}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <Flame className="h-6 w-6 text-arena-fame mx-auto mb-1" />
            <div className="text-2xl font-bold">{warrior.fame}</div>
            <div className="text-xs text-muted-foreground">Fame</div>
          </div>
          <div className="text-center">
            <Star className="h-6 w-6 text-arena-pop mx-auto mb-1" />
            <div className="text-2xl font-bold">{warrior.popularity}</div>
            <div className="text-xs text-muted-foreground">Pop</div>
          </div>
        </div>
      </div>
    </div>
  );
}
