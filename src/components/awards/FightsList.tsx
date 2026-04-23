import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronDown, Swords, Skull } from 'lucide-react';
import type { FightSummary } from '@/types/game';

export default function FightsList({
  fights,
  getRound,
}: {
  fights: FightSummary[];
  getRound?: (fightId: string) => number | undefined;
}) {
  if (!fights || fights.length === 0) return null;

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-display font-semibold text-muted-foreground hover:text-foreground transition-colors group w-full">
        <Swords className="h-4 w-4 text-muted-foreground" />
        All Bouts ({fights.length})
        <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180 ml-auto" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-1">
          {fights.map((f) => {
            const round = getRound ? getRound(f.id) : undefined;
            return (
              <div
                key={f.id}
                className="flex items-center justify-between py-1.5 px-3 rounded-none bg-secondary/30 border border-border/20 text-xs"
              >
                <div className="flex items-center gap-2">
                  {round !== undefined && (
                    <span className="text-[10px] font-mono text-muted-foreground w-8">
                      Rd {round}
                    </span>
                  )}
                  <span
                    className={cn(
                      'font-display',
                      f.winner === 'A' ? 'font-bold text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {f.a}
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span
                    className={cn(
                      'font-display',
                      f.winner === 'D' ? 'font-bold text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {f.d}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {f.by && (
                    <Badge
                      variant={f.by === 'Kill' ? 'destructive' : 'outline'}
                      className="text-[8px]"
                    >
                      {f.by === 'Kill' && <Skull className="h-2.5 w-2.5 mr-0.5" />}
                      {f.by}
                    </Badge>
                  )}
                  {f.flashyTags?.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-[8px] text-arena-gold border-arena-gold/30"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
