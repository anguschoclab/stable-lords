import { Trophy } from "lucide-react";
import type { TournamentEntry } from "@/types/game";
import { Surface } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

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
          <Surface
            key={s}
            variant={isCurrent ? "gold" : "glass"}
            padding="none"
            className={cn(
              "transition-all duration-500 overflow-hidden relative group",
              !isCurrent && "opacity-40 grayscale hover:grayscale-0 hover:opacity-100"
            )}
          >
             {isCurrent && <div className="absolute top-0 right-0 p-3"><div className="h-2 w-2 rounded-full bg-arena-gold animate-ping" /></div>}
            <div className="p-4 border-b border-white/5 bg-secondary/5 flex items-center gap-3">
               <span className="text-xl group-hover:scale-125 transition-transform duration-500">{seasonIcons[s]}</span>
               <span className="font-display font-black uppercase text-[10px] tracking-[0.2em]">{seasonNames[s]}</span>
            </div>
            <div className="p-5">
              {pastForSeason.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Champion Archives</div>
                  {pastForSeason.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-black/20 border border-white/5">
                      <div className="flex items-center gap-3">
                         <Trophy className="h-4 w-4 text-arena-gold drop-shadow-[0_0_8px_hsla(var(--arena-gold),0.6)]" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Wk {t.week}</span>
                      </div>
                      <span className="font-display font-black text-xs text-arena-gold uppercase tracking-tight">{t.champion ?? "VACANT"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground/20 border border-dashed border-white/5">
                   <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">No Champions Recorded<br/>For This Season</p>
                </div>
              )}
            </div>
          </Surface>
        );
      })}
    </div>
  );
}

