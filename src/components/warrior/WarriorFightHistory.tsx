import { useMemo, useState } from 'react';
import { Swords } from 'lucide-react';
import { type FightSummary } from '@/types/game';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { getAllFightsForWarrior } from '@/engine/core/historyUtils';
import BoutViewer from '@/components/BoutViewer';
import { cn } from '@/lib/utils';

export function WarriorFightHistory({
  warriorName,
  arenaHistory,
}: {
  warriorName: string;
  arenaHistory: FightSummary[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fights = getAllFightsForWarrior(arenaHistory, warriorName);

  const h2h = useMemo(() => {
    const map = new Map<
      string,
      { wins: number; losses: number; draws: number; kills: number; deaths: number }
    >();
    for (const f of fights) {
      const isA = f.a === warriorName;
      const opponent = isA ? f.d : f.a;
      let rec = map.get(opponent);
      if (!rec) {
        rec = { wins: 0, losses: 0, draws: 0, kills: 0, deaths: 0 };
        map.set(opponent, rec);
      }
      const won = (isA && f.winner === 'A') || (!isA && f.winner === 'D');
      const lost = (isA && f.winner === 'D') || (!isA && f.winner === 'A');
      if (won) {
        rec.wins++;
        if (f.by === 'Kill') rec.kills++;
      } else if (lost) {
        rec.losses++;
        if (f.by === 'Kill') rec.deaths++;
      } else {
        rec.draws++;
      }
    }
    return map;
  }, [fights, warriorName]);

  if (fights.length === 0) {
    return (
      <Surface variant="glass" className="py-8 text-center text-muted-foreground rounded-none">
        No recorded bouts yet.
      </Surface>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <Swords className="h-5 w-5 text-arena-gold" /> Fight History
      </h3>
      {fights
        .slice(-10)
        .reverse()
        .map((f) => {
          const isA = f.a === warriorName;
          const opponent = isA ? f.d : f.a;
          const won = (isA && f.winner === 'A') || (!isA && f.winner === 'D');
          const isExpanded = expandedId === f.id;
          const hasTranscript = f.transcript && f.transcript.length > 0;
          const record = h2h.get(opponent);

          return (
            <Surface
              key={f.id}
              variant="glass"
              className="p-0 border-white/5 rounded-none overflow-hidden"
            >
              <button
                className={cn(
                  'w-full flex items-center justify-between py-2.5 px-3 transition-colors text-left',
                  isExpanded ? 'bg-primary/5' : 'hover:bg-white/[0.02]'
                )}
                onClick={() => setExpandedId(isExpanded ? null : f.id)}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} bout details between ${f.a} and ${f.d}`}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={won ? 'default' : f.winner ? 'destructive' : 'secondary'}
                    className="text-xs w-8 justify-center rounded-none"
                  >
                    {won ? 'W' : f.winner ? 'L' : 'D'}
                  </Badge>
                  <span className="text-sm">
                    vs <span className="font-medium">{opponent}</span>
                  </span>
                  {record && record.wins + record.losses + record.draws >= 2 && (
                    <span className="text-[10px] font-mono text-muted-foreground bg-black/20 px-1.5 py-0.5">
                      H2H: {record.wins}-{record.losses}
                      {record.draws > 0 ? `-${record.draws}` : ''}
                      {record.kills > 0 && (
                        <span className="text-destructive ml-1">☠{record.kills}</span>
                      )}
                    </span>
                  )}
                  {record && record.losses >= 3 && (
                    <Badge variant="destructive" className="text-[10px] gap-1 rounded-none">
                      NEMESIS
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {f.by && (
                    <Badge variant="outline" className="text-xs rounded-none border-white/10">
                      {f.by}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">Wk {f.week}</span>
                  {hasTranscript && <span className="text-[10px] text-primary">▶</span>}
                </div>
              </button>

              {isExpanded && hasTranscript && (
                <div className="p-4 border-t border-white/5 animate-fade-in">
                  <BoutViewer
                    nameA={f.a}
                    nameD={f.d}
                    styleA={f.styleA}
                    styleD={f.styleD}
                    log={(f.transcript || []).map((text, i) => ({ minute: i + 1, text }))}
                    winner={f.winner}
                    by={f.by}
                    isRivalry={f.isRivalry}
                  />
                </div>
              )}
            </Surface>
          );
        })}
    </div>
  );
}
