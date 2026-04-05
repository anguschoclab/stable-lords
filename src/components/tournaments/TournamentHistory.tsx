import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { TournamentEntry } from "@/types/game";

interface TournamentHistoryProps {
  pastTournaments: TournamentEntry[];
  seasonIcons: Record<string, string>;
  seasonNames: Record<string, string>;
  currentSeason: string;
}

export function TournamentHistory({ pastTournaments, seasonIcons, seasonNames, currentSeason }: TournamentHistoryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {["Spring", "Summer", "Fall", "Winter"].map((s) => {
        const pastForSeason = pastTournaments.filter((t) => t.season === s);
        const isCurrent = s === currentSeason;
        
        return (
          <Card
            key={s}
            className={cn(
              "transition-all duration-500 overflow-hidden relative group",
              isCurrent 
                ? "border-primary/50 shadow-[0_0_30px_-5px_hsla(var(--primary),0.3)] bg-primary/5" 
                : "opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:border-border/60 bg-glass-card shadow-sm"
            )}
          >
             {isCurrent && <div className="absolute top-0 right-0 p-3"><div className="h-2 w-2 rounded-full bg-primary animate-ping" /></div>}
            <CardHeader className="pb-3 border-b border-border/10 bg-secondary/5">
              <CardTitle className="font-display font-black uppercase text-base flex items-center gap-3 tracking-tighter">
                <span className="text-xl group-hover:scale-125 transition-transform duration-500">{seasonIcons[s]}</span>
                {seasonNames[s]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {pastForSeason.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Champion_Archives</div>
                  {pastForSeason.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-secondary/10 border border-border/10">
                      <div className="flex items-center gap-3">
                         <Trophy className="h-3.5 w-3.5 text-arena-gold drop-shadow-[0_0_8px_hsla(var(--arena-gold),0.6)]" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wk {t.week}</span>
                      </div>
                      <span className="font-display font-black text-xs text-arena-gold uppercase tracking-tight">{t.champion ?? "VACANT"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground/30 border border-dashed border-border/20 rounded-2xl">
                   <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">No_Champions_Recorded<br/>For_This_Season</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function cn(...inputs: import("clsx").ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}
