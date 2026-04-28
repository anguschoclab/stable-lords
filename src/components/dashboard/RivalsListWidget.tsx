import { useMemo } from 'react';
import { Skull, Activity, Target, Globe, Users, Star } from 'lucide-react';
import { useWorldState } from '@/state/useGameStore';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { StableCrest } from '@/components/crest/StableCrest';

export function RivalsListWidget() {
  const state = useWorldState();
  const rivals = state.rivals ?? [];

  // Find recent bouts involving rival warriors
  const recentRivalBouts = useMemo(() => {
    const rosterNames = new Set((state.roster || []).map((w) => w.name));
    return (state.arenaHistory || [])
      .filter((f) => {
        const aIsPlayer = rosterNames.has(f.a);
        const dIsPlayer = rosterNames.has(f.d);
        return (aIsPlayer && !dIsPlayer) || (!aIsPlayer && dIsPlayer);
      })
      .slice(-3)
      .reverse();
  }, [state.arenaHistory, state.roster]);

  return (
    <Surface
      variant="glass"
      padding="none"
      className="h-full border-border/10 group overflow-hidden relative flex flex-col"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Skull className="h-12 w-12 text-destructive" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-none bg-destructive/10 border border-destructive/20 shadow-[0_0_15px_rgba(var(--destructive-rgb),0.1)]">
            <Globe className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h3 className="font-display text-sm font-black uppercase tracking-tight">
              RIVAL REGISTRY
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              OPPOSING STABLE INTELLIGENCE
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest"
        >
          {rivals.length} OPERATIONAL_THREATS
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        {rivals.length === 0 ? (
          <div className="p-12 text-center opacity-20 italic">
            <p className="text-[10px] uppercase tracking-[0.2em]">NO THREAT SIGNALS DETECTED</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {rivals.slice(0, 4).map((r) => {
              const activeCount = r.roster?.filter((w) => w.status === 'Active').length ?? 0;
              const tierColors: Record<string, string> = {
                Major: 'bg-arena-gold/10 text-arena-gold border-arena-gold/20',
                Established: 'bg-primary/10 text-primary border-primary/20',
                Legendary: 'bg-destructive/10 text-destructive border-destructive/20',
              };
              const tierClass =
                tierColors[r.tier ?? 'Minor'] ?? 'bg-white/5 text-muted-foreground border-white/10';

              return (
                <div key={r.owner.id} className="p-4 hover:bg-white/2 transition-colors group/item">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {/* Mini Crest - 16px for compact list */}
                      {r.crest ? (
                        <div className="w-4 h-4 flex-shrink-0">
                          <StableCrest
                            crest={r.crest}
                            size="xs"
                            showTooltip={false}
                            showGenerationBadge={false}
                          />
                        </div>
                      ) : (
                        <div className="w-4 h-4 flex items-center justify-center bg-neutral-800 border border-white/10">
                          <span className="text-[6px] text-muted-foreground">?</span>
                        </div>
                      )}
                      <span className="text-xs font-black uppercase tracking-tight text-foreground/80 group-hover/item:text-primary transition-colors">
                        {r.owner.stableName}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-[8px] font-black h-4 px-1.5 uppercase', tierClass)}
                      >
                        {r.tier}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-arena-fame">
                      <span className="text-[10px] font-mono font-black">{r.owner.fame}</span>
                      <Star className="h-2.5 w-2.5 opacity-40" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <div className="flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" /> {activeCount} Assets
                    </div>
                    <span>|</span>
                    <div className="flex items-center gap-1">
                      <Target className="h-2.5 w-2.5" /> {r.owner.personality}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {recentRivalBouts.length > 0 && (
        <div className="p-4 border-t border-white/5 bg-black/20 relative z-10">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3 block">
            TACTICAL ENCOUNTER LOG
          </span>
          <div className="space-y-2">
            {recentRivalBouts.map((f) => {
              const rosterNames = new Set((state.roster || []).map((w) => w.name));
              const playerIsA = rosterNames.has(f.a);
              const won = (playerIsA && f.winner === 'A') || (!playerIsA && f.winner === 'D');
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between group/bout text-[10px]"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        won
                          ? 'bg-arena-pop shadow-[0_0_8px_rgba(var(--arena-pop-rgb),0.5)]'
                          : 'bg-destructive shadow-[0_0_8px_rgba(var(--destructive-rgb),0.5)]'
                      )}
                    />
                    <span className="text-foreground/60 group-hover/bout:text-foreground transition-colors font-medium">
                      {playerIsA ? f.a : f.d} <span className="text-foreground/10 mx-1">VS</span>{' '}
                      {playerIsA ? f.d : f.a}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'font-mono font-black',
                      won ? 'text-arena-pop' : 'text-destructive'
                    )}
                  >
                    {won ? 'W' : 'L'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10 mt-auto">
        <Link
          to="/world"
          className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-destructive transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
        >
          Sync_Global_Intelligence{' '}
          <Activity className="h-3 w-3 group-hover:scale-110 transition-transform" />
        </Link>
      </div>
    </Surface>
  );
}
