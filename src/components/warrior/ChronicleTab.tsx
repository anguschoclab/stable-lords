import { Trophy, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CareerTimeline } from '@/components/warrior/CareerTimeline';
import { WarriorFightHistory } from '@/components/warrior/WarriorFightHistory';
import { Warrior, type FightSummary } from '@/types/game';
import { Surface } from '@/components/ui/Surface';

interface ChronicleTabProps {
  warrior: Warrior;
  arenaHistory: FightSummary[];
}

export function ChronicleTab({ warrior, arenaHistory }: ChronicleTabProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-4 space-y-6">
        <CareerTimeline warrior={warrior} arenaHistory={arenaHistory} />

        <Surface variant="glass" padding="none">
          <div className="p-4 bg-secondary/5 border-b border-white/5 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-arena-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
              Hall of Records
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
              <span className="text-muted-foreground/60">Highest Fame</span>
              <span className="font-mono text-foreground">{warrior.fame}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
              <span className="text-muted-foreground/60">Tournaments Won</span>
              <span className="font-mono text-foreground">{warrior.career.wins > 10 ? 1 : 0}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
              <span className="text-muted-foreground/60">Total Payout</span>
              <span className="font-mono text-arena-gold">{warrior.career.wins * 150}G</span>
            </div>
          </div>
        </Surface>

        {warrior.awards && warrior.awards.length > 0 && (
          <Surface variant="glass" padding="none">
            <div className="p-4 bg-primary/5 border-b border-white/5 flex items-center gap-2">
              <Star className="h-4 w-4 text-arena-gold" />
              <span className="text-[10px] font-black uppercase tracking-widest text-arena-gold">
                Awards & Accolades
              </span>
            </div>
            <div className="p-5 space-y-4">
              {warrior.awards.map((award, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-arena-gold/60 tracking-[0.2em]">
                      Year {award.year}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-secondary/30 px-2 py-0.5 border border-white/5">
                      {award.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic border-l-2 border-primary/40 pl-3">
                    "{award.reason}"
                  </p>
                </div>
              ))}
            </div>
          </Surface>
        )}
      </div>

      <div className="lg:col-span-8">
        <Surface variant="glass" padding="none" className="min-h-[600px]">
          <div className="bg-secondary/10 px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-display font-black uppercase text-2xl tracking-tighter text-foreground">
              Engagement Archive
            </h2>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
              Chronicle // V1.0
            </div>
          </div>
          <div className="p-8">
            <WarriorFightHistory warriorName={warrior.name} arenaHistory={arenaHistory} />
          </div>
        </Surface>
      </div>
    </div>
  );
}
