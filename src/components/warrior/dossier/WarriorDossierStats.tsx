import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StatBattery } from '@/components/ui/StatBattery';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '@/types/game';
import type { Warrior } from '@/types/warrior.types';

interface WarriorDossierStatsProps {
  warrior: Warrior;
  condition: number;
}

export function WarriorDossierStats({ warrior, condition }: WarriorDossierStatsProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-secondary/20 border-none">
        <CardContent className="p-3 space-y-3">
          <div className="space-y-1">
            <StatBattery
              label="CND"
              value={condition}
              max={100}
              labelValue={`${condition}%`}
              colorClass={
                condition > 70
                  ? '[&>div]:bg-arena-fame'
                  : condition > 30
                    ? '[&>div]:bg-arena-gold'
                    : '[&>div]:bg-destructive'
              }
              className="[&>span]:text-[10px] [&>span]:uppercase [&>span]:font-bold [&>span]:text-muted-foreground [&>.flex-1>div]:h-1.5"
            />
          </div>
          <div className="space-y-1">
            <StatBattery
              label="FAME"
              value={warrior.fame}
              max={100}
              labelValue={warrior.fame}
              colorClass="[&>div]:bg-arena-fame"
              className="[&>span]:text-[10px] [&>span]:uppercase [&>span]:font-bold [&>span]:text-muted-foreground [&>.flex-1>div]:h-1.5"
            />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        {ATTRIBUTE_KEYS.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between p-2 rounded-none bg-secondary/10 border border-border/50"
          >
            <span className="text-[10px] uppercase text-muted-foreground font-medium">
              {ATTRIBUTE_LABELS[key]}
            </span>
            <span className="text-sm font-mono font-bold">{warrior.attributes[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
