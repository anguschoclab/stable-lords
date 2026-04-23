import { useMemo } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { ScrollText, ChevronRight, History, Activity, ShieldCheck, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function Chronicle() {
  const state = useWorldState();

  const news = useMemo(
    () => [...(state.newsletter || [])].reverse().slice(0, 50),
    [state.newsletter]
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-black uppercase tracking-tight">
              The_Stable_Chronicle
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Archived_Bout_Reports // Global_Index: {news.length}
            </p>
          </div>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/10 to-transparent mx-8 hidden md:block" />
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60">
            LIVE_DATA_STREAM
          </span>
        </div>
      </div>

      {news.length === 0 ? (
        <Surface
          variant="glass"
          className="py-24 text-center flex flex-col items-center gap-6 border-dashed border-border/40 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 opacity-50" />
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
            <Terminal className="h-16 w-16 text-muted-foreground opacity-20 relative z-10" />
          </div>
          <div className="space-y-2 relative z-10">
            <p className="text-sm font-display font-black uppercase tracking-[0.2em] text-muted-foreground">
              Log_Stream_Null
            </p>
            <p className="text-xs text-muted-foreground/60 italic max-w-sm mx-auto leading-relaxed">
              No historical data recovered. Your legacy begins once the first arena engagement is
              concluded and finalized in the registry.
            </p>
          </div>
        </Surface>
      ) : (
        <div className="relative ml-4 md:ml-8 border-l border-white/5 pl-8 md:pl-12 space-y-12 pb-12">
          <AnimatePresence mode="popLayout">
            {news.map((n, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="relative"
              >
                {/* Timeline Marker */}
                <div className="absolute -left-[41px] md:-left-[57px] top-6 flex items-center justify-center">
                  <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse" />
                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-black border-2 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] flex items-center justify-center relative z-10">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary" />
                  </div>
                  <div className="absolute left-8 h-px w-8 md:w-12 bg-gradient-to-r from-primary to-transparent opacity-40" />
                </div>

                <Surface
                  variant="glass"
                  padding="none"
                  className="border-border/10 hover:border-primary/30 transition-all duration-500 group overflow-hidden shadow-xl"
                >
                  <div className="p-6 md:p-8 border-b border-white/5 bg-neutral-900/40 relative">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                      <ScrollText className="h-20 w-20" />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                      <div className="space-y-1">
                        <h4 className="text-base font-display font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                          {n.title}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">
                            Entry_Registry_Sync
                          </span>
                          <div className="h-1 w-1 rounded-full bg-white/10" />
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">
                            Event_Type: SYSTEM_LOG
                          </span>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono font-black border-primary/20 bg-primary/5 text-primary h-8 px-4 tracking-widest shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]"
                          >
                            WK_{n.week.toString().padStart(2, '0')}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                          Discovered: Phase {n.week}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 bg-black/20">
                    <ul className="space-y-4">
                      {n.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-4 group/item">
                          <div className="mt-1.5 shrink-0 flex flex-col items-center gap-1 group/btn">
                            <ChevronRight className="h-3 w-3 text-primary opacity-40 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                            <div className="w-0.5 h-full bg-white/5 min-h-[12px] group-hover/item:bg-primary/20 transition-colors" />
                          </div>
                          <span className="text-xs md:text-sm font-medium text-foreground/70 group-hover/item:text-foreground leading-relaxed transition-colors tracking-wide">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-8 py-3 bg-neutral-900/40 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[8px] font-black uppercase tracking-widest">
                          Integrity: PASS
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[8px] font-black uppercase tracking-widest">
                          Auth_Lvl: ADMIN
                        </span>
                      </div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                      LOG_FINALIZED
                    </span>
                  </div>
                </Surface>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="absolute left-[-2px] bottom-0 w-1 h-32 bg-gradient-to-t from-transparent via-primary/20 to-transparent" />
        </div>
      )}
    </div>
  );
}
