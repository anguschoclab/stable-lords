import React from 'react';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { type Warrior } from '@/types/warrior.types';
import { Sparkles, Heart } from 'lucide-react';

interface Props {
  warrior: Warrior;
}

export default function WarriorDossierSoulBond({ warrior }: Props) {
  if (!warrior.soulBond) return null;

  return (
    <div className="space-y-8">
      <SectionDivider label="Soul Bond Protocol" variant="primary" />
      <Surface
        variant="glass"
        className="p-8 border-primary/20 bg-primary/[0.02] relative overflow-hidden"
      >
        <div className="absolute -right-8 -top-8 opacity-5">
          <Sparkles className="h-32 w-32 text-primary" />
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Heart className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-lg font-display font-black uppercase tracking-tight text-foreground">
            Synchronized with {warrior.soulBond.partnerName}
          </h3>
        </div>

        <p className="text-[12px] text-muted-foreground/80 leading-relaxed italic border-l-2 border-primary/20 pl-6">
          "The threads of fate have bound these souls together. In the arena, they do not just fight
          side-by-side; they share a single pulse, a single purpose. To harm one is to incite the
          wrath of both."
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/[0.02] border border-white/5">
            <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
              Affinity Level
            </div>
            <div className="text-xl font-display font-black text-primary">MAXIMUM_RESONANCE</div>
          </div>
          <div className="p-4 bg-white/[0.02] border border-white/5">
            <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
              Combat Bonus
            </div>
            <div className="text-xl font-display font-black text-foreground">+25% SYNC_RATE</div>
          </div>
        </div>
      </Surface>
    </div>
  );
}
