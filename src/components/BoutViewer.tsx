import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import type { MinuteEvent, FightOutcomeBy } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, RotateCcw, Skull, Swords, Zap, Shield, ChevronDown, ChevronUp } from "lucide-react";

interface BoutViewerProps {
  nameA: string;
  nameD: string;
  styleA: string;
  styleD: string;
  log: MinuteEvent[];
  winner: "A" | "D" | null;
  by: FightOutcomeBy;
  announcement?: string;
}

// Classify log lines for visual treatment
function classifyEvent(text: string): "hit" | "miss" | "crit" | "death" | "ko" | "exhaust" | "status" | "riposte" | "initiative" | "phase" {
  if (text.startsWith("—") && text.includes("Phase")) return "phase";
  const t = text.toLowerCase();
  if (t.includes("kill") || t.includes("death") || t.includes("slain") || t.includes("fatal")) return "death";
  if (t.includes("knocked out") || t.includes("ko") || t.includes("unconscious") || t.includes("no longer continue")) return "ko";
  if (t.includes("exhausted") || t.includes("exhaustion") || t.includes("tiring") || t.includes("sluggish")) return "exhaust";
  if (t.includes("devastating") || t.includes("critical") || t.includes("massive") || t.includes("lethal")) return "crit";
  if (t.includes("counter-attack") || t.includes("riposte")) return "riposte";
  if (t.includes("initiative") || t.includes("seizes")) return "initiative";
  if (t.includes("damage") || t.includes("strikes") || t.includes("hits") || t.includes("lands") || t.includes("striking")) return "hit";
  if (t.includes("miss") || t.includes("parr") || t.includes("dodge") || t.includes("turns") || t.includes("no opening") || t.includes("blocks")) return "miss";
  return "status";
}

function getEventIcon(type: ReturnType<typeof classifyEvent>) {
  switch (type) {
    case "hit": return <Swords className="h-3 w-3 text-arena-gold" />;
    case "crit": return <Zap className="h-3.5 w-3.5 text-destructive" />;
    case "death": return <Skull className="h-3.5 w-3.5 text-arena-blood" />;
    case "ko": return <Skull className="h-3 w-3 text-arena-gold" />;
    case "miss": return <Shield className="h-3 w-3 text-arena-steel" />;
    case "riposte": return <Swords className="h-3 w-3 text-arena-fame" />;
    case "initiative": return <Zap className="h-3 w-3 text-primary" />;
    case "exhaust": return <span className="text-[10px]">💨</span>;
    case "phase": return <span className="text-[10px]">⚔️</span>;
    default: return <span className="h-3 w-3 rounded-full bg-muted-foreground/30 block" />;
  }
}

function getEventColor(type: ReturnType<typeof classifyEvent>) {
  switch (type) {
    case "hit": return "border-arena-gold/40 bg-arena-gold/5";
    case "crit": return "border-destructive/40 bg-destructive/5";
    case "death": return "border-arena-blood/60 bg-arena-blood/10";
    case "ko": return "border-arena-gold/50 bg-arena-gold/10";
    case "riposte": return "border-arena-fame/40 bg-arena-fame/5";
    case "initiative": return "border-primary/40 bg-primary/5";
    case "exhaust": return "border-muted/60 bg-muted/20";
    case "miss": return "border-border bg-secondary/30";
    case "phase": return "border-primary/30 bg-primary/10";
    default: return "border-border bg-transparent";
  }
}

function getOutcomeStyles(by: FightOutcomeBy) {
  switch (by) {
    case "Kill": return { bg: "bg-arena-blood/20 border-arena-blood", text: "text-arena-blood", icon: <Skull className="h-5 w-5" /> };
    case "KO": return { bg: "bg-arena-gold/20 border-arena-gold", text: "text-arena-gold", icon: <Zap className="h-5 w-5" /> };
    case "Exhaustion": return { bg: "bg-muted border-muted-foreground/30", text: "text-muted-foreground", icon: <span className="text-lg">💨</span> };
    case "Stoppage": return { bg: "bg-primary/10 border-primary/40", text: "text-primary", icon: <Shield className="h-5 w-5" /> };
    default: return { bg: "bg-secondary border-border", text: "text-muted-foreground", icon: <Swords className="h-5 w-5" /> };
  }
}

export default function BoutViewer({ nameA, nameD, styleA, styleD, log, winner, by, announcement }: BoutViewerProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const [expanded, setExpanded] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalEvents = log.length;
  const isComplete = visibleCount >= totalEvents;

  const speedMs = speed === 1 ? 800 : speed === 2 ? 400 : 150;

  const advanceOne = useCallback(() => {
    setVisibleCount((c) => Math.min(c + 1, totalEvents));
  }, [totalEvents]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setVisibleCount(0);
  }, []);

  const skipToEnd = useCallback(() => {
    setIsPlaying(false);
    setVisibleCount(totalEvents);
  }, [totalEvents]);

  const togglePlay = useCallback(() => {
    if (isComplete) {
      // If at end, restart
      setVisibleCount(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete]);

  // Auto-advance timer
  useEffect(() => {
    if (isPlaying && !isComplete) {
      timerRef.current = setTimeout(() => {
        advanceOne();
      }, speedMs);
    }
    if (isComplete && isPlaying) {
      setIsPlaying(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, visibleCount, isComplete, speedMs, advanceOne]);

  // Scroll to latest event
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visibleCount]);

  const outcomeStyle = getOutcomeStyles(by);
  const winnerName = winner === "A" ? nameA : winner === "D" ? nameD : null;
  const loserName = winner === "A" ? nameD : winner === "D" ? nameA : null;

  // Compute progress
  const minutes = log.length > 0 ? log[log.length - 1].minute : 0;
  const currentMinute = visibleCount > 0 ? log[visibleCount - 1]?.minute ?? 0 : 0;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {/* Fighter Header */}
      <div className="relative bg-gradient-to-r from-secondary via-card to-secondary p-4 sm:p-5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-arena-gold/5" />
        <div className="relative">
          {/* Toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <div className="flex items-center justify-between gap-3">
            {/* Fighter A */}
            <div className="text-center flex-1 min-w-0">
              <div className={cn(
                "font-display font-bold text-base sm:text-lg truncate transition-colors",
                winner === "A" ? "text-arena-gold" : winner === "D" ? "text-muted-foreground" : "text-foreground"
              )}>
                {nameA}
              </div>
              <Badge variant="outline" className="text-[10px] mt-1">
                {STYLE_DISPLAY_NAMES[styleA as keyof typeof STYLE_DISPLAY_NAMES] ?? styleA}
              </Badge>
              {winner === "A" && (
                <div className="mt-1.5 text-[10px] font-bold text-arena-gold animate-fade-in">👑 WINNER</div>
              )}
            </div>

            {/* Center VS */}
            <div className="flex flex-col items-center gap-1 shrink-0 px-2">
              <div className="w-10 h-10 rounded-full border-2 border-border bg-secondary flex items-center justify-center">
                <Swords className="h-4 w-4 text-arena-gold" />
              </div>
              {isComplete && by && (
                <Badge
                  variant="outline"
                  className={cn("text-[10px] animate-scale-in", outcomeStyle.text)}
                >
                  {by}
                </Badge>
              )}
            </div>

            {/* Fighter D */}
            <div className="text-center flex-1 min-w-0">
              <div className={cn(
                "font-display font-bold text-base sm:text-lg truncate transition-colors",
                winner === "D" ? "text-arena-gold" : winner === "A" ? "text-muted-foreground" : "text-foreground"
              )}>
                {nameD}
              </div>
              <Badge variant="outline" className="text-[10px] mt-1">
                {STYLE_DISPLAY_NAMES[styleD as keyof typeof STYLE_DISPLAY_NAMES] ?? styleD}
              </Badge>
              {winner === "D" && (
                <div className="mt-1.5 text-[10px] font-bold text-arena-gold animate-fade-in">👑 WINNER</div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono w-10">Min {currentMinute}</span>
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-arena-gold rounded-full transition-all duration-300"
                style={{ width: `${totalEvents > 0 ? (visibleCount / totalEvents) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono w-10 text-right">Min {minutes}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset} title="Reset" aria-label="Reset playback">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={isPlaying ? "secondary" : "default"}
              size="icon"
              className="h-8 w-8"
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause playback" : "Play playback"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={skipToEnd} title="Skip to end" aria-label="Skip to end of playback">
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 3 : 1) as 1 | 2 | 3)}
              className="text-[11px] font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-secondary border border-border transition-colors"
              title="Playback speed"
              aria-label="Toggle playback speed"
            >
              {speed}×
            </button>
            <span className="text-[10px] text-muted-foreground ml-2 font-mono">
              {visibleCount}/{totalEvents}
            </span>
          </div>

          {/* Event Log */}
          <div className="max-h-80 overflow-y-auto px-3 py-2 space-y-1">
            {visibleCount === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Press play to watch the bout unfold…
              </div>
            )}
            {log.slice(0, visibleCount).map((event, i) => {
              const type = classifyEvent(event.text);
              const isLatest = i === visibleCount - 1;
              const isPhaseEvent = type === "phase";
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2 px-2.5 py-1.5 rounded-md border transition-all duration-300",
                    getEventColor(type),
                    isLatest ? "animate-fade-in ring-1 ring-primary/20" : "opacity-80",
                    isPhaseEvent && "flex-col"
                  )}
                >
                  <div className="flex items-start gap-2 w-full">
                    <div className="mt-0.5 shrink-0">{getEventIcon(type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm leading-snug",
                        type === "death" ? "font-semibold text-arena-blood" :
                        type === "crit" ? "font-semibold text-destructive" :
                        type === "ko" ? "font-semibold text-arena-gold" :
                        type === "phase" ? "font-bold text-primary text-xs uppercase tracking-wider" :
                        "text-foreground/85"
                      )}>
                        {event.text}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0 mt-0.5">
                      {event.minute}
                    </span>
                  </div>
                  {/* Phase tactic & protect indicators */}
                  {isPhaseEvent && (event.offTacticA || event.defTacticA || event.protectA || event.offTacticD || event.defTacticD || event.protectD) && (
                    <div className="flex flex-col gap-1 w-full pl-5 pt-1">
                      {(event.offTacticA || event.defTacticA || event.protectA) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-muted-foreground w-12">{nameA}:</span>
                          {event.offTacticA && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-arena-gold/40 text-arena-gold">{event.offTacticA}</Badge>}
                          {event.defTacticA && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-arena-steel/40 text-arena-steel">{event.defTacticA}</Badge>}
                          {event.protectA && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/40 text-primary">🛡 {event.protectA}</Badge>}
                        </div>
                      )}
                      {(event.offTacticD || event.defTacticD || event.protectD) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-muted-foreground w-12">{nameD}:</span>
                          {event.offTacticD && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-arena-gold/40 text-arena-gold">{event.offTacticD}</Badge>}
                          {event.defTacticD && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-arena-steel/40 text-arena-steel">{event.defTacticD}</Badge>}
                          {event.protectD && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/40 text-primary">🛡 {event.protectD}</Badge>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>

          {/* Outcome Banner */}
          {isComplete && winner && (
            <div className={cn(
              "px-4 py-3 border-t flex items-center justify-center gap-3 animate-fade-in",
              outcomeStyle.bg
            )}>
              <span className={outcomeStyle.text}>{outcomeStyle.icon}</span>
              <div className="text-center">
                <div className={cn("font-display font-bold text-sm sm:text-base", outcomeStyle.text)}>
                  {winnerName} defeats {loserName}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  by {by} · {minutes} minutes
                </div>
              </div>
              <span className={outcomeStyle.text}>{outcomeStyle.icon}</span>
            </div>
          )}

          {isComplete && !winner && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-center gap-2 bg-secondary/30 animate-fade-in">
              <Swords className="h-4 w-4 text-muted-foreground" />
              <span className="font-display font-semibold text-sm text-muted-foreground">Draw — {minutes} minutes</span>
            </div>
          )}

          {/* Announcement */}
          {isComplete && announcement && (
            <div className="px-4 py-2.5 border-t border-border bg-arena-gold/5 animate-fade-in">
              <p className="text-sm italic text-foreground/80 text-center">
                🎙️ {announcement}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
