/**
 * Stable Lords — The Arena Gazette
 * Codex Sanguis design: Roman acta diurna / historical broadsheet aesthetic
 */
import { useMemo, useState, useCallback } from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import {
  Newspaper, Terminal, BarChart3, Radio, History,
  ChevronDown, Sparkles, Scroll,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GazetteArticle } from "@/components/gazette/GazetteArticle";
import { TacticalStyleAnalysis, StyleMatchupHeatmap } from "@/components/gazette/MetaAnalytics";
import { GazetteLeaderboard, BestByStyle, RisingStars } from "@/components/gazette/GazetteLeaderboards";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Gazette Masthead ──────────────────────────────────────────────────────────

function GazetteMasthead({ season, week }: { season: string; week: number }) {
  return (
    <div className="text-center space-y-3 py-10 relative">
      {/* Top ornamental rule — thick and thin */}
      <div className="space-y-0.5 mb-6">
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
      </div>

      {/* Pub info row */}
      <div className="flex items-center justify-center gap-6 text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
        <span>Est. 412 AE</span>
        <span className="w-1 h-1 inline-block rounded-none bg-accent/40" />
        <span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help hover:text-accent/60 transition-colors">
                Season {season} // Week {week}
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-[9px] font-black tracking-widest uppercase">
              Current Chronology
            </TooltipContent>
          </Tooltip>
        </span>
        <span className="w-1 h-1 inline-block rounded-none bg-accent/40" />
        <span>Imperial Press</span>
      </div>

      {/* Main title */}
      <div>
        <h1 className="font-display font-black uppercase text-[clamp(2.2rem,6vw,4.5rem)] tracking-[0.08em] text-[#E7D3AF] [text-shadow:0_3px_16px_rgba(0,0,0,0.9),0_1px_0_rgba(0,0,0,0.95),0_0_40px_rgba(201,151,42,0.1)] leading-none">
          THE ARENA GAZETTE
        </h1>
        <p className="text-[11px] italic mt-2 text-[#E7D3AF]/45">
          BLOOD · GLORY · GOSSIP · TRANSCRIPTS
        </p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center justify-center gap-2 mt-1">
        <div className="w-1.5 h-1.5 rounded-none bg-primary animate-pulse" />
        <span className="text-[9px] font-black uppercase tracking-[0.35em] text-primary/50">
          PRESS LINE SYNCHRONIZED
        </span>
      </div>

      {/* Bottom ornamental rule */}
      <div className="space-y-0.5 mt-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      </div>
    </div>
  );
}

// ─── Gazette Section Header ────────────────────────────────────────────────────────────

function GazetteSectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeStyle = "primary",
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge: string;
  badgeStyle?: "primary" | "gold";
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2.5 border rounded-none",
          badgeStyle === "gold" ? "bg-arena-gold/10 border-arena-gold/20" : "bg-arena-blood/10 border-arena-blood/20"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            badgeStyle === "gold" ? "text-arena-gold" : "text-arena-blood"
          )} />
        </div>
        <div>
          <h3 className="text-base font-display font-black uppercase tracking-tight">
            {title}
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            {subtitle}
          </p>
        </div>
      </div>
      <div className={cn(
        "hidden md:block flex-1 h-px mx-8",
        badgeStyle === "gold" ? "bg-gradient-to-r from-arena-gold/20 via-border/20 to-transparent" : "bg-gradient-to-r from-arena-blood/20 via-border/20 to-transparent"
      )} />
      <Badge
        variant="outline"
        className={cn(
          "hidden md:flex text-[9px] font-mono font-black tracking-widest px-3 h-7 rounded-none",
          badgeStyle === "gold" ? "border-arena-gold/25 bg-arena-gold/5 text-arena-gold" : "border-arena-blood/25 bg-arena-blood/5 text-arena-blood"
        )}
      >
        {badge}
      </Badge>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function GazetteEmptyState() {
  return (
    <Surface variant="glass" className="py-32 flex flex-col items-center gap-6 relative overflow-hidden border-dashed opacity-50">
      <div className="absolute inset-0 opacity-50 bg-radial-at-center from-arena-blood/5 to-transparent" />
      <div className="relative">
        <div className="absolute inset-0 blur-2xl rounded-none bg-arena-blood/10" />
        <Terminal className="h-16 w-16 relative z-10 opacity-15 text-muted-foreground" />
      </div>
      <div className="space-y-2 relative z-10 text-center">
        <p className="text-sm font-display font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          The Presses Are Silent
        </p>
        <p className="text-xs text-muted-foreground/35 italic max-w-sm mx-auto leading-relaxed">
          No arena records have been stylized by our chroniclers yet. Proceed
          to combat to generate headlines and synchronize the archive.
        </p>
      </div>
    </Surface>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

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
    <div
      className="space-y-16 max-w-7xl mx-auto pb-32 animate-in fade-in duration-700"
    >
      {/* ── Masthead ──────────────────────────────────────────────────────────── */}
      <GazetteMasthead season={season} week={week} />

      {/* ── Analytics Registry ────────────────────────────────────────────────── */}
      {hasContent && (
        <section className="space-y-10">
          <GazetteSectionHeader
            icon={BarChart3}
            title="Arena Intelligence Matrix"
            subtitle="Tactical Telemetry // Historical Aggregates"
            badge="LIVE FEED"
            badgeStyle="primary"
          />

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

          {/* Ornamental break before narrative feed */}
          <div className="flex items-center gap-4 py-4">
            <div
              className="flex-1 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(201,151,42,0.25))",
              }}
            />
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
              <Scroll className="h-3 w-3" />
              <span>Narrative Archive</span>
              <Scroll className="h-3 w-3" />
            </div>
            <div
              className="flex-1 h-px"
              style={{
                background:
                  "linear-gradient(90deg, rgba(201,151,42,0.25), transparent)",
              }}
            />
          </div>
        </section>
      )}

      {/* ── Narrative Feed ────────────────────────────────────────────────────── */}
      <section className="space-y-12">
        <GazetteSectionHeader
          icon={Radio}
          title="Information Oracle"
          subtitle="Editorial Registry // Stylized Archival"
          badge="ARCHIVE SYNC"
          badgeStyle="gold"
        />

        {!hasContent ? (
          <GazetteEmptyState />
        ) : (
          <div className="space-y-24">
            <AnimatePresence mode="popLayout">
              {visibleIssues.map((issue, idx) => {
                const paragraphs = issue.body
                  .split("\n\n")
                  .filter((p: string) => p.trim().length > 0);
                const mappedIssue = {
                  week: issue.week,
                  mainHeadline: issue.headline,
                  mainStory: paragraphs[0] || "",
                  sideStories: paragraphs.slice(1),
                };

                return (
                  <motion.div
                    key={issue.week}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: idx * 0.1,
                      duration: 0.8,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <GazetteArticle issue={mappedIssue} season={season} />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {hasMore && (
              <div className="flex flex-col items-center gap-6 pt-12 relative">
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(201,151,42,0.15) 30%, rgba(201,151,42,0.15) 70%, transparent)",
                  }}
                />

                <div className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-40">
                    Archive Remainder: {weeklyIssues.length - shown} Editions
                  </span>
                </div>

                <button
                  onClick={loadMore}
                  className="group relative flex items-center gap-3 px-16 h-14 transition-all duration-500 bg-[#110C07] border border-border/70 rounded-none hover:border-accent/50"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-arena-gold/5 to-arena-gold/0" />
                  <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-arena-gold/80 to-transparent" />
                  <History className="relative z-10 h-4 w-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
                  <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 group-hover:text-accent transition-colors">
                    Historical Recall
                  </span>
                  <ChevronDown className="relative z-10 h-4 w-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-y-1 transition-all" />
                </button>

                <div className="flex items-center gap-2 mt-4 opacity-20">
                  <Sparkles
                    className="h-3 w-3 text-primary"
                    style={{ animation: "livePulse 2s ease-in-out infinite" }}
                  />
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                    Deep Storage Synchronization Ready
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
