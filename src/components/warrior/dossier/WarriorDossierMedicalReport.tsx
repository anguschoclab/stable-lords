import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Warrior, InjuryData } from '@/types/warrior.types';

interface WarriorDossierMedicalReportProps {
  warrior: Warrior;
}

export function WarriorDossierMedicalReport({ warrior }: WarriorDossierMedicalReportProps) {
  if (!warrior.injuries || warrior.injuries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
        <Activity className="h-3 w-3 text-destructive" /> Medical Report
      </h3>
      <div className="grid gap-2">
        {warrior.injuries.map((inj: InjuryData, i: number) => {
          const name = typeof inj === 'string' ? inj : inj.name;
          const severity = typeof inj === 'string' ? 'Minor' : inj.severity;
          return (
            <Badge
              key={i}
              variant="outline"
              className={cn(
                'justify-start py-1.5 px-3 border-destructive/20 text-[10px] gap-3 font-bold uppercase tracking-wider',
                severity === 'Minor'
                  ? 'text-arena-gold bg-arena-gold/5 border-arena-gold/20'
                  : 'text-destructive bg-destructive/5'
              )}
            >
              <Skull className="h-3 w-3 shrink-0" />
              <div className="flex flex-col">
                <span>{name}</span>
                {typeof inj !== 'string' && (
                  <span className="text-[8px] opacity-60 font-mono italic">
                    {inj.location || 'General'}
                  </span>
                )}
              </div>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
