import { Trophy, Star, History, Award } from 'lucide-react';
import { CareerTimeline } from '@/components/warrior/CareerTimeline';
import { WarriorFightHistory } from '@/components/warrior/WarriorFightHistory';
import { Warrior, type FightSummary } from '@/types/game';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';

interface ChronicleTabProps {
  warrior: Warrior;
  arenaHistory: FightSummary[];
}

export function ChronicleTab({ warrior, arenaHistory }: ChronicleTabProps) {
  return (
    <div className="grid gap-12 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-4 space-y-12">
        <div className="space-y-8">
          <SectionDivider label="Service Timeline" />
          <CareerTimeline warrior={warrior} arenaHistory={arenaHistory} />
        </div>

        <div className="space-y-8">
          <SectionDivider label="Hall of Records" />
          <Surface variant="glass" className="border-white/5">
            <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.01]">
              <ImperialRing size="xs" variant="gold">
                <Trophy className="h-3 w-3 text-arena-gold" />
              </ImperialRing>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                Statistical Milestone
              </span>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                  Peak Valuation
                </span>
                <span className="text-sm font-display font-black text-foreground">
                  {warrior.fame} PT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                  Major Titles
                </span>
                <span className="text-sm font-display font-black text-foreground">
                  {warrior.career.wins > 10 ? 1 : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                  Aggregated Yield
                </span>
                <span className="text-sm font-display font-black text-arena-gold">
                  {(warrior.career.wins * 150).toLocaleString()}G
                </span>
              </div>
            </div>
          </Surface>
        </div>

        {warrior.awards && warrior.awards.length > 0 && (
          <div className="space-y-8">
            <SectionDivider label="Accolades" />
            <Surface variant="glass" className="border-white/5">
              <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.01]">
                <ImperialRing size="xs" variant="blood">
                  <Star className="h-3 w-3 text-primary" />
                </ImperialRing>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  Institutional Honors
                </span>
              </div>
              <div className="p-8 space-y-8">
                {warrior.awards.map((award, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase text-primary tracking-[0.3em]">
                          Cycle {award.year}
                        </span>
                        <div className="text-[11px] font-black uppercase tracking-widest text-foreground">
                          {award.type.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <Award className="h-4 w-4 text-arena-gold opacity-40" />
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic border-l border-white/10 pl-4 py-1">
                      {award.reason}
                    </p>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        )}
      </div>

      <div className="lg:col-span-8 space-y-8">
        <SectionDivider label="Engagement Archive" />
        <Surface variant="glass" className="border-white/5 min-h-[700px] overflow-hidden">
          <div className="bg-white/[0.01] px-10 py-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <History className="h-6 w-6 text-muted-foreground/20" />
              <div className="space-y-1">
                <h2 className="font-display font-black uppercase text-3xl tracking-tight text-foreground">
                  Service Record
                </h2>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                  Chronicle // Historical Database Access
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 md:p-8">
            <WarriorFightHistory warriorName={warrior.name} arenaHistory={arenaHistory} />
          </div>
        </Surface>
      </div>
    </div>
  );
}
