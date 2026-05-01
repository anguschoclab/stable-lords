import React from 'react';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { cn } from '@/lib/utils';
import { type Warrior } from '@/types/warrior.types';
import { ATTRIBUTE_LABELS, ATTRIBUTE_KEYS } from '@/types/game';

interface Props {
  warrior: Warrior;
}

export default function WarriorDossierStats({ warrior }: Props) {
  return (
    <div className="space-y-8">
      <SectionDivider label="Core Attribute Sync" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ATTRIBUTE_KEYS.map((k) => {
          const val = warrior.attributes[k];
          const label = ATTRIBUTE_LABELS[k];
          const pct = (val / 21) * 100;
          return (
            <Surface key={k} variant="glass" className="p-4 border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                  {label}
                </span>
                <span className="text-sm font-display font-black text-foreground">{val}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-none overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-1000',
                    val >= 16 ? 'bg-primary' : val >= 12 ? 'bg-arena-gold' : 'bg-white/20'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Surface>
          );
        })}
      </div>

      <SectionDivider label="Derived Tactical Metrics" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Health Reserve', value: warrior.derivedStats.hp, sub: 'VITAL_SIGNS' },
          { label: 'Max Endurance', value: warrior.derivedStats.endurance, sub: 'SYNC_CAPACITY' },
          { label: 'Base Speed', value: warrior.derivedStats.speed, sub: 'REFLEX_THRESHOLD' },
        ].map((stat) => (
          <Surface key={stat.label} variant="glass" className="p-6 border-white/5">
            <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
              {stat.sub}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-foreground mb-4">
              {stat.label}
            </div>
            <div className="text-3xl font-display font-black text-foreground">{stat.value}</div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
