import { useMemo, useState, useCallback } from "react";
import { useGameStore } from "@/state/useGameStore";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { Newspaper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useShallow } from 'zustand/react/shallow';

import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { GazetteArticle } from "@/components/gazette/GazetteArticle";
import { TacticalStyleAnalysis, StyleMatchupHeatmap } from "@/components/gazette/MetaAnalytics";
import { GazetteLeaderboard, BestByStyle, RisingStars } from "@/components/gazette/GazetteLeaderboards";

export default function Gazette() {
  const { state } = useGameStore(useShallow((s) => ({
    week: s.state.week,
    season: s.state.season,
    gazettes: s.state.gazettes
  })));

  const allFights = useMemo(() => ArenaHistory.all(), [state.week]);

  const weeklyIssues = useMemo(() => {
    return [...(state.gazettes || [])].sort((a, b) => b.week - a.week);
  }, [state.gazettes]);

  const PAGE_SIZE = 3;
  const [shown, setShown] = useState(PAGE_SIZE);
  const visibleIssues = weeklyIssues.slice(0, shown);
  const hasMore = shown < weeklyIssues.length;
  const loadMore = useCallback(() => setShown((s) => s + PAGE_SIZE), []);
  const hasContent = weeklyIssues.length > 0;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title="The Arena Gazette"
        subtitle="BLOOD // GLORY // GOSSIP // TRANSCRIPTS"
        icon={Newspaper}
        actions={
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
            <span>WEEK {state.week}</span>
            <div className="h-4 w-px bg-border/40" />
            <span>EST. 412 AE</span>
          </div>
        }
      />

      {/* ─── Analytics Registry ─── */}
      {hasContent && (
        <section className="space-y-8">
           <div className="flex items-center gap-3 px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">ARENA_INTEL</span>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
           </div>
           
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <TacticalStyleAnalysis allFights={allFights} />
              <StyleMatchupHeatmap allFights={allFights} />
           </div>

           <GazetteLeaderboard allFights={allFights} />
           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                 <BestByStyle allFights={allFights} />
              </div>
              <div className="lg:col-span-4">
                 <RisingStars allFights={allFights} currentWeek={state.week} />
              </div>
           </div>
        </section>
      )}

      {/* ─── Narrative Feed ─── */}
      <section className="space-y-12">
        <div className="flex items-center gap-3 px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">EDITORIAL_ARCHIVE</span>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
        </div>

        {!hasContent ? (
          <Surface variant="glass" className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-4">
            <Newspaper className="h-12 w-12 text-muted-foreground opacity-20" />
            <div className="space-y-1">
              <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">The Presses are Silent</p>
              <p className="text-xs text-muted-foreground/60 italic">No arena records have been stylized by our chroniclers yet. Proceed to combat to generate headlines.</p>
            </div>
          </Surface>
        ) : (
          <div className="space-y-20">
            <AnimatePresence mode="popLayout">
              {visibleIssues.map((issue) => (
                <GazetteArticle key={issue.week} issue={issue} state={state} />
              ))}
            </AnimatePresence>

            {hasMore && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={loadMore}
                  className="group relative px-12 py-4 overflow-hidden"
                >
                  <Surface 
                    variant="neon" 
                    padding="none" 
                    className="absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.3em] text-primary-foreground">
                    Load Older Editions ({weeklyIssues.length - shown} REMAINING)
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
