import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Flame } from "lucide-react";
import { WarriorNameTag, StatBadge } from "@/components/ui/WarriorBadges";
import { LethalityBadge } from "./LethalityBadge";
import { StableLink } from "@/components/EntityLink";
import type { MatchPairing } from "@/engine/matchmaking/bracketEngine";

interface MatchCardProps {
  pairing: MatchPairing;
  crowdMood: string;
}

export function MatchCard({ pairing, crowdMood }: MatchCardProps) {
  const { playerWarrior: wA, rivalWarrior: wB, rivalStable, isRivalryBout } = pairing;

  return (
    <Card className="bg-glass-card border border-border/40 hover:border-primary/40 transition-all overflow-hidden group">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border/10">
          <div className="flex items-center gap-3">
            <Swords className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Engagement_Matchup</span>
          </div>
          {isRivalryBout && (
            <Badge className="bg-destructive/10 text-destructive border-none shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse gap-1.5 h-5 px-2 font-black text-[8px] tracking-widest uppercase">
              <Flame className="h-2.5 w-2.5" /> STABLE_VENDETTA
            </Badge>
          )}
        </div>

        <div className="p-4 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <WarriorNameTag id={wA.id} name={wA.name} isChampion={wA.champion} />
              <StatBadge styleName={wA.style} />
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary/60">
              <span className="px-1.5 py-0.5 rounded-sm bg-primary/10">PLAYER_STABLE</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-border/40 to-transparent" />
            <span className="text-[10px] font-black text-muted-foreground/40 tracking-tighter italic font-display uppercase">VS</span>
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-border/40 to-transparent" />
          </div>

          <div className="space-y-2 text-right">
            <div className="flex items-center justify-end gap-3">
               <StatBadge styleName={wB.style} />
               <WarriorNameTag id={wB.id} name={wB.name} isChampion={wB.champion} />
            </div>
            <div className="flex items-center justify-end gap-2 text-[9px] font-black uppercase tracking-widest text-accent/60">
               <StableLink name={rivalStable.owner.stableName} className="hover:text-accent transition-colors" />
            </div>
          </div>
        </div>

        <div className="px-4 py-2 bg-secondary/5 border-t border-border/10 flex items-center justify-between">
            <LethalityBadge wA={wA} wB={wB} crowdMood={crowdMood} />
            <div className="flex items-center gap-4 text-[9px] font-mono font-black text-muted-foreground/40 uppercase tracking-widest">
                <span>{wA.career.wins}w-{wA.career.losses}l</span>
                <span className="w-1.5 h-1.5 rounded-full bg-border/40" />
                <span>{wB.career.wins}w-{wB.career.losses}l</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
