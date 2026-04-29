import { Link } from '@tanstack/react-router';
import { Shield, UserPlus, Users, AlertCircle } from 'lucide-react';
import { useWorldState } from '@/state/useGameStore';
import { selectActiveWarriors } from '@/state/selectors';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BASE_ROSTER_CAP } from '@/data/constants';

export function StableWidget() {
  const state = useWorldState();
  const activeWarriors = selectActiveWarriors(state);
  const rosterCap = BASE_ROSTER_CAP + (state.rosterBonus || 0);

  // ⚡ Bolt: Use O(N) bounded insertion sort instead of O(N log N) full array sort
  const topWarriors = [];
  for (let i = 0; i < activeWarriors.length; i++) {
    const w = activeWarriors[i];
    if (topWarriors.length < 4) {
      topWarriors.push(w);
      topWarriors.sort((a, b) => b.fame - a.fame);
    } else if (w.fame > topWarriors[3].fame) {
      topWarriors[3] = w;
      topWarriors.sort((a, b) => b.fame - a.fame);
    }
  }

  return (
    <Surface
      variant="glass"
      padding="none"
      className="h-full border-border/10 group overflow-hidden relative flex flex-col"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Shield className="h-12 w-12" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-none bg-primary/10 border border-primary/20">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm font-black uppercase tracking-tight">
              PERSONNEL MANIFEST
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              ACTIVE ROSTER MONITOR
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest"
        >
          {activeWarriors.length} / {rosterCap}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        {topWarriors.length === 0 ? (
          <div className="p-12 text-center opacity-20 italic">
            <p className="text-[10px] uppercase tracking-[0.2em]">ROSTER EMPTY</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {topWarriors.map((w) => {
              const hasInjuries = w.injuries && w.injuries.length > 0;
              return (
                <div
                  key={w.id}
                  className="p-4 flex items-center gap-4 hover:bg-white/2 transition-colors group/item"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-none bg-secondary/20 border border-white/10 flex items-center justify-center overflow-hidden transition-transform group-hover/item:scale-105">
                      <span className="text-xs font-black text-foreground/40">
                        {w.name.charAt(0)}
                      </span>
                      {hasInjuries && (
                        <div className="absolute -top-1 -right-1 bg-destructive p-0.5 rounded-full ring-2 ring-[#050506]">
                          <AlertCircle className="h-2 w-2 text-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to="/warrior/$id"
                        params={{ id: w.id }}
                        className="text-xs font-black uppercase tracking-tight text-foreground/80 group-hover/item:text-primary transition-colors truncate"
                      >
                        {w.name}
                      </Link>
                      <div className="flex items-center gap-2 text-xs font-mono font-black shrink-0">
                        <span className="text-arena-pop">{w.career.wins}W</span>
                        <span className="text-foreground/10">/</span>
                        <span className="text-destructive/60">{w.career.kills}K</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 truncate">
                        {w.style}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            'h-1.5 w-1.5 rounded-full animate-pulse',
                            hasInjuries ? 'bg-destructive' : 'bg-primary'
                          )}
                        />
                        <span
                          className={cn(
                            'text-[8px] font-black uppercase tracking-[0.2em]',
                            hasInjuries ? 'text-destructive' : 'text-primary'
                          )}
                        >
                          {hasInjuries ? 'Compromised' : 'Nominal'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 grid grid-cols-2 gap-3 relative z-10">
        <Link to="/ops/recruit">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-[9px] uppercase tracking-widest font-black gap-2 border border-white/5 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <UserPlus className="h-3.5 w-3.5" /> Recruit
          </Button>
        </Link>
        <Link to="/ops/overview">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-[9px] uppercase tracking-widest font-black gap-2 border border-white/5 hover:bg-white/5 transition-all"
          >
            <Users className="h-3.5 w-3.5" /> View_All
          </Button>
        </Link>
      </div>
    </Surface>
  );
}
