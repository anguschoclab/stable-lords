import { Swords, Flame } from "lucide-react";
import { WarriorNameTag, StatBadge } from "@/components/ui/WarriorBadges";
import { LethalityBadge } from "./LethalityBadge";
import { StableLink } from "@/components/EntityLink";
import { Badge } from "@/components/ui/badge";
import { StableCrest } from "@/components/crest/StableCrest";
import type { BoutPairing as MatchPairing } from "@/engine/boutProcessor";
import { Surface } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  pairing: MatchPairing;
  crowdMood: string;
}

export function MatchCard({ pairing, crowdMood }: MatchCardProps) {
  const { a: wA, d: wB, rivalStable, isRivalry: isRivalryBout } = pairing;

  return (
    <Surface variant="glass" padding="none" className="border-white/5 hover:border-primary/40 transition-all overflow-hidden group">
        <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-white/5">
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

        <div className="p-5 grid grid-cols-[1fr_auto_1fr] items-center gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <WarriorNameTag id={wA.id} name={wA.name} isChampion={wA.champion} />
              <StatBadge styleName={wA.style} />
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary/60">
              <span className="px-2 py-0.5 bg-primary/10 border border-primary/20">PLAYER_STABLE</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <span className="text-[10px] font-black text-muted-foreground/40 tracking-[0.3em] italic font-display uppercase">VS</span>
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          </div>

          <div className="space-y-3 text-right">
            <div className="flex items-center justify-end gap-3">
               <StatBadge styleName={wB.style} />
               <WarriorNameTag id={wB.id} name={wB.name} isChampion={wB.champion} />
            </div>
            <div className="flex items-center justify-end gap-2 text-[9px] font-black uppercase tracking-widest text-accent/60">
               <StableLink name={rivalStable || "Rival Stable"} className="hover:text-accent transition-colors underline-offset-4 decoration-accent/30" />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between">
            <LethalityBadge wA={wA} wB={wB} crowdMood={crowdMood} />
            <div className="flex items-center gap-4 text-[9px] font-mono font-black text-muted-foreground/30 uppercase tracking-widest">
                <span>{wA.career.wins}W-{wA.career.losses}L</span>
                <span className="w-1.5 h-1.5 bg-white/10" />
                <span>{wB.career.wins}W-{wB.career.losses}L</span>
            </div>
        </div>
    </Surface>
  );
}
