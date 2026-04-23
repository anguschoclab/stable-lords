import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AwardEntry {
  name: string;
  style: string;
  stableName?: string;
  wins: number;
  losses: number;
  kills: number;
  fameGained?: number;
  isPlayer: boolean;
}

export default function AwardCard({
  entry,
  title,
  icon,
  accentClass,
}: {
  entry: AwardEntry | null;
  title: string;
  icon: React.ReactNode;
  accentClass: string;
}) {
  if (!entry) return null;
  const winRate =
    entry.wins + entry.losses > 0
      ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
      : 0;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-border/60',
        entry.isPlayer && 'ring-1 ring-primary/30'
      )}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-1', accentClass)} />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <p className="font-display font-bold text-sm">{entry.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {entry.style} {entry.stableName && `· ${entry.stableName}`}
                {entry.isPlayer && <span className="text-primary ml-1">(You)</span>}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono shrink-0">
            {title}
          </Badge>
        </div>
        <div
          className={`grid ${entry.fameGained !== undefined ? 'grid-cols-4' : 'grid-cols-3'} gap-2 text-center`}
        >
          <div>
            <p className="text-base font-bold font-display">{entry.wins}</p>
            <p className="text-[9px] text-muted-foreground">Wins</p>
          </div>
          <div>
            <p className="text-base font-bold font-display text-destructive">{entry.kills}</p>
            <p className="text-[9px] text-muted-foreground">Kills</p>
          </div>
          {entry.fameGained !== undefined && (
            <div>
              <p className="text-base font-bold font-display text-arena-fame">
                {entry.fameGained > 0 ? `+${entry.fameGained}` : entry.fameGained}
              </p>
              <p className="text-[9px] text-muted-foreground">Fame</p>
            </div>
          )}
          <div>
            <p className="text-base font-bold font-display">{winRate}%</p>
            <p className="text-[9px] text-muted-foreground">Win%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
