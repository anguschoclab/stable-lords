import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { FormSparkline } from '@/components/charts/FormSparkline';
import { StatBadge } from '@/components/ui/WarriorBadges';
import type { Warrior } from '@/types/warrior.types';

interface WarriorDossierHeaderProps {
  warrior: Warrior;
  record: string;
  rankings?: {
    overallRank: number;
    compositeScore: number;
  };
}

export function WarriorDossierHeader({ warrior, record, rankings }: WarriorDossierHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-2xl font-display font-black tracking-tight uppercase">
          {warrior.name}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase opacity-60 tracking-widest">
            {record}
          </span>
          <FormSparkline warriorId={warrior.id} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatBadge styleName={warrior.style} />
        {rankings && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-black uppercase tracking-tighter border-primary/20',
                rankings.overallRank <= 64
                  ? 'text-arena-gold bg-arena-gold/5'
                  : 'text-primary bg-primary/5'
              )}
            >
              RANK #{rankings.overallRank}
            </Badge>
            <Badge
              variant="secondary"
              className="text-[10px] font-black uppercase tracking-tighter bg-neutral-900 border border-white/5 opacity-80"
            >
              {Math.round(rankings.compositeScore)} PTS
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
