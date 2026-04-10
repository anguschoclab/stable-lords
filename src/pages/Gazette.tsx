import { useMemo, useState, useCallback } from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { Newspaper, Info, Terminal, Search, BarChart3, Radio, History, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useShallow } from 'zustand/react/shallow';

import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GazetteArticle } from "@/components/gazette/GazetteArticle";
import { TacticalStyleAnalysis, StyleMatchupHeatmap } from "@/components/gazette/MetaAnalytics";
import { GazetteLeaderboard, BestByStyle, RisingStars } from "@/components/gazette/GazetteLeaderboards";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Gazette() {
  const state = useWorldState();
  const { week, season, gazettes } = state;

  const allFights = useMemo(() => ArenaHistory.all(), []);

  const weeklyIssues = useMemo(() => {
    return [...(gazettes || [])].sort((a, b) => b.week - a.week);
  }, [gazettes]);

  const PAGE_SIZE = 3;
  const [shown, setShown] = useState(PAGE_SIZE);
  const visibleIssues = weeklyIssues.slice(0, shown);
  const hasMore = shown < weeklyIssues.length;
  const loadMore = useCallback(() => setShown((s) => s + PAGE_SIZE), []);
  const hasContent = weeklyIssues.length > 0;

  return (
    <div className="space-y-16 max-w-7xl mx-auto pb-32 animate-in fade-in duration-700">
      <PageHeader 
        title="The_Arena_Gazette"
        subtitle="BLOOD // GLORY // GOSSIP // TRANSCRIPTS"
        icon={Newspaper}
        actions={
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help hover:text-primary transition-colors">SEASON_{season} // WEEK_{week}</span>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                  Current Chronology
                </TooltipContent>
              </Tooltip>
              <div className="h-4 w-px bg-white/5" />
              <span>EST. 412 AE</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60">PRESS_LINE_SYNC</span>
            </div>
          </div>
        }
      />

      {/* ─── Analytics Registry ─── */}
      {hasContent && (
        <section className="space-y-10">
           <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-4">
                 <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <BarChart3 className="h-4 w-4 text-primary" />
                 </div>
                 <div>
                    <h3 className="text-base font-display font-black uppercase tracking-tight">Arena_Intel_Matrix</h3>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Tactical_Telemetry // Historical_Aggregates</p>
                 </div>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/5 to-transparent mx-8 hidden md:block" />
              <Badge variant="outline" className="text-[9px] font-mono font-black border-primary/20 bg-primary/5 text-primary tracking-widest px-3 h-7">
                LIVE_FEED
              </Badge>
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
                 <RisingStars allFights={allFights} currentWeek={week} />
              </div>
           </div>
        </section>
      )}

      {/* ─── Narrative Feed ─── */}
      <section className="space-y-12">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-4">
             <div className="p-2 rounded-xl bg-arena-gold/10 border border-arena-gold/20">
                <Radio className="h-4 w-4 text-arena-gold" />
             </div>
             <div>
                <h3 className="text-base font-display font-black uppercase tracking-tight">Information_Oracle</h3>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Editorial_Registry // Stylized_Archival</p>
             </div>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-arena-gold/20 via-border/5 to-transparent mx-8 hidden md:block" />
           <Badge variant="outline" className="text-[9px] font-mono font-black border-arena-gold/20 bg-arena-gold/5 text-arena-gold tracking-widest px-3 h-7">
            ARCHIVE_SYNC
          </Badge>
        </div>

        {!hasContent ? (
          <Surface variant="glass" className="py-32 text-center border-dashed border-border/20 flex flex-col items-center gap-6 group overflow-hidden relative">
            <div className="absolute inset-0 bg-primary/5 opacity-50" />
            <div className="relative">
               <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
               <Terminal className="h-16 w-16 text-muted-foreground opacity-20 relative z-10 group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="space-y-2 relative z-10">
              <p className="text-sm font-display font-black uppercase tracking-[0.2em] text-muted-foreground">The_Presses_Are_Silent</p>
              <p className="text-xs text-muted-foreground/60 italic max-w-sm mx-auto leading-relaxed">
                No arena records have been stylized by our chroniclers yet. Proceed to combat to generate headlines and synchronize the archive.
              </p>
            </div>
          </Surface>
        ) : (
          <div className="space-y-24">
            <AnimatePresence mode="popLayout">
              {visibleIssues.map((issue, idx) => {
                const paragraphs = issue.body.split("\n\n").filter((p: string) => p.trim().length > 0);
                const mappedIssue = {
                  week: issue.week,
                  mainHeadline: issue.headline,
                  mainStory: paragraphs[0] || "",
                  sideStories: paragraphs.slice(1)
                };
                
                return (
                  <motion.div
                    key={issue.week}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <GazetteArticle issue={mappedIssue} season={season} />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {hasMore && (
              <div className="flex flex-col items-center gap-6 pt-12 relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                
                <div className="flex flex-col items-center gap-3">
                   <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-40">Archive_Remainder: {weeklyIssues.length - shown}_EDITIONS</span>
                </div>
                
                <Button 
                  onClick={loadMore}
                  className="group relative px-16 h-14 bg-black border border-white/5 hover:border-primary/40 text-primary transition-all duration-500 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                >
                   <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="relative z-10 flex items-center gap-3">
                      <History className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[11px] font-black uppercase tracking-[0.3em]">Historical_Recall</span>
                      <ChevronDown className="h-4 w-4 opacity-40 group-hover:opacity-100 group-hover:translate-y-1 transition-all" />
                   </div>
                </Button>
                
                <div className="flex items-center gap-2 mt-4 opacity-20">
                   <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Deep_Storage_Synchronization_Ready</span>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
