import React from 'react';
import { type WarriorLineage } from '@/types/warrior.types';
import { Surface } from '@/components/ui/Surface';
import { GitBranch, Shield, Crown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LineageTreeProps {
  lineage?: WarriorLineage;
  warriorName: string;
}

/**
 * LineageTree: Visualizes the genetic or mentorship bloodline of a warrior.
 * Uses a high-density, authoritative "Executive Command" aesthetic.
 */
export function LineageTree({ lineage, warriorName }: LineageTreeProps) {
  if (!lineage) {
    return (
      <Surface variant="glass" className="p-8 text-center border-dashed border-white/5 opacity-40">
        <Users className="h-8 w-8 mx-auto mb-4 text-muted-foreground/40" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          No Lineage Data Detected
        </p>
        <p className="text-[9px] italic text-muted-foreground/60 mt-2">
          Commoner status // Identity verified as first-generation combatant.
        </p>
      </Surface>
    );
  }

  const pedigreeLevels = {
    Commoner: 'text-muted-foreground',
    'Second Generation': 'text-emerald-400',
    Legacy: 'text-primary',
    'Noble Blood': 'text-arena-gold',
    'Exiled Legend': 'text-destructive',
  };

  return (
    <div className="relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      <Surface variant="glass" padding="none" className="border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-arena-gold to-primary/40" />

        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 border border-primary/20">
                <GitBranch className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">
                  Genealogical Trace
                </h4>
                <p className="text-[9px] font-mono text-muted-foreground opacity-60 uppercase">
                  Protocol: Inheritance_Verify // Gen: {lineage.generation}
                </p>
              </div>
            </div>
            <div
              className={cn(
                'px-3 py-1 border border-white/5 bg-black/40 text-[9px] font-black uppercase tracking-[0.2em]',
                pedigreeLevels[lineage.pedigree]
              )}
            >
              {lineage.pedigree}
            </div>
          </div>

          {/* Tree Visualization */}
          <div className="flex flex-col items-center gap-12 py-4">
            {/* Ancestor Node */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-all" />
              <div className="relative p-4 border border-white/10 bg-neutral-900/80 w-48 text-center transition-all group-hover:border-primary/40">
                <Shield className="h-4 w-4 mx-auto mb-2 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  Source Ancestor
                </p>
                <p className="text-xs font-display font-black uppercase tracking-tight text-white/80">
                  {lineage.mentorName || 'REDACTED'}
                </p>
                <div className="mt-2 h-0.5 w-12 mx-auto bg-primary/20 group-hover:bg-primary/60 transition-all" />
              </div>

              {/* Connecting Line */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-primary/40 to-arena-gold/40" />
            </div>

            {/* Current Warrior Node */}
            <div className="relative">
              <div className="absolute -inset-6 bg-arena-gold/5 blur-2xl" />
              <div className="relative p-6 border-2 border-arena-gold/30 bg-neutral-900 shadow-[0_0_30px_rgba(255,215,0,0.1)] w-56 text-center">
                <Crown className="h-5 w-5 mx-auto mb-3 text-arena-gold" />
                <p className="text-[9px] font-black text-arena-gold uppercase tracking-[0.3em] mb-1">
                  Current Subject
                </p>
                <p className="text-sm font-display font-black uppercase tracking-tighter text-white">
                  {warriorName}
                </p>
                <div className="mt-3 flex justify-center gap-1">
                  {[...Array(lineage.generation)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 border border-arena-gold/40 bg-arena-gold/10 rotate-45"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Meta */}
          <div className="pt-4 border-t border-white/5 flex justify-between items-center opacity-40">
            <span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground">
              ID: {lineage.parentId?.slice(0, 8)}...
            </span>
            <span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground">
              SYNC_COMPLETE
            </span>
          </div>
        </div>
      </Surface>
    </div>
  );
}
