import { CheckCircle2 } from 'lucide-react';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { computeWarriorStats } from '@/engine/skillCalc';
import { TRAIT_DATA } from '@/data/orphanPool';
import { potentialRating, potentialGrade } from '@/engine/potential';

interface WarriorCardProps {
  warrior: ReturnType<typeof import('@/data/orphanPool').generateOrphanPool>[number];
  isSelected: boolean;
  canSelect: boolean;
  onClick: () => void;
}

export default function WarriorCard({ warrior, isSelected, canSelect, onClick }: WarriorCardProps) {
  const stats = computeWarriorStats(warrior.attrs, warrior.style);

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-200 group ${
        !canSelect && !isSelected ? 'opacity-50 pointer-events-none' : ''
      }`}
      style={{
        background: isSelected
          ? 'linear-gradient(145deg, rgba(135,34,40,0.12) 0%, rgba(135,34,40,0.06) 100%)'
          : 'linear-gradient(145deg, #150F08 0%, #110C07 100%)',
        border: isSelected ? '1px solid rgba(135,34,40,0.5)' : '1px solid rgba(60,42,22,0.7)',
        borderTopColor: isSelected ? 'rgba(200,80,88,0.4)' : 'rgba(100,70,36,0.35)',
      }}
    >
      {isSelected && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--primary)/0.8) 30%, hsl(var(--primary)) 50%, hsl(var(--primary)/0.8) 70%, transparent)',
          }}
        />
      )}

      <div className="p-4 flex items-start gap-3">
        <div
          className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center"
          style={{
            background: isSelected ? 'hsl(var(--primary))' : 'rgba(20,15,8,0.8)',
            border: isSelected
              ? '1px solid hsl(var(--primary)/0.6)'
              : '1px solid rgba(60,42,22,0.8)',
          }}
        >
          {isSelected && <CheckCircle2 className="h-3 w-3 text-foreground" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-display font-bold text-sm text-foreground">{warrior.name}</span>
            <StatBadge styleName={warrior.style} variant="secondary" showFullName />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-arena-gold/30 bg-arena-gold/5 text-arena-gold cursor-help">
                    {warrior.trait}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-[10px]">
                  {(() => {
                    const data = TRAIT_DATA[warrior.trait];
                    if (!data) return <span>Flavor trait — shapes personality</span>;
                    const mods = data.modifiers;
                    const parts: string[] = [];
                    if (mods.OE) parts.push(`OE ${mods.OE}`);
                    if (mods.AL) parts.push(`AL ${mods.AL}`);
                    if (mods.killDesire) parts.push(`KD ${mods.killDesire}`);
                    if (mods.feintTendency) parts.push(`Feint ${mods.feintTendency}`);
                    if (mods.rangePreference) parts.push(`Prefers ${mods.rangePreference}`);
                    return (
                      <div className="space-y-1">
                        <p className="font-bold border-b border-white/10 pb-1">{warrior.trait}</p>
                        <p className="italic text-muted-foreground">{data.description}</p>
                        <p className="text-accent">{parts.join(', ')}</p>
                      </div>
                    );
                  })()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-[10px] text-muted-foreground/80 font-medium mb-1">{warrior.origin}</p>
          <p className="text-[10px] text-muted-foreground/50 italic leading-relaxed line-clamp-2">
            {warrior.lore}
          </p>
        </div>

        <div className="shrink-0 text-right space-y-1">
          <div className="flex items-center justify-end gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              HP
            </span>
            <span className="text-[11px] font-mono font-black text-foreground/80">
              {stats.derivedStats.hp}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              POT
            </span>
            <span
              className={`text-[11px] font-mono font-black ${
                potentialGrade(potentialRating(warrior.potential)) === 'S'
                  ? 'text-accent'
                  : potentialGrade(potentialRating(warrior.potential)) === 'A'
                    ? 'text-arena-gold'
                    : 'text-foreground/80'
              }`}
            >
              {potentialGrade(potentialRating(warrior.potential))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
