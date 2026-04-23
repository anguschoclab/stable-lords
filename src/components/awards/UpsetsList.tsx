import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Zap, Swords } from 'lucide-react';

export interface UpsetEntry {
  winner: string;
  loser: string;
  by?: string | null;
  fameDiff: number;
  week?: number; // Used in Seasonal
  round?: number; // Used in Tournament
}

export default function UpsetsList({ upsets }: { upsets: UpsetEntry[] }) {
  if (!upsets || upsets.length === 0) return null;

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-display font-semibold text-muted-foreground hover:text-foreground transition-colors group w-full">
        <Zap className="h-4 w-4 text-accent" />
        Biggest Upsets ({upsets.length})
        <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180 ml-auto" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-1.5">
          {upsets.map((u, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 px-3 rounded-none bg-secondary/40 border border-border/30"
            >
              <div className="flex items-center gap-2 text-xs">
                <Swords className="h-3 w-3 text-muted-foreground" />
                <span className="font-display font-semibold">{u.winner}</span>
                <span className="text-muted-foreground">def.</span>
                <span className="font-display text-muted-foreground">{u.loser}</span>
                {u.by && (
                  <Badge variant="outline" className="text-[8px]">
                    {u.by}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-accent">Δ{u.fameDiff} fame</span>
                <span className="text-muted-foreground">
                  {u.round !== undefined ? `Rd ${u.round}` : `Wk ${u.week}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
