import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import type { MinuteEvent, FightOutcomeBy } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/WarriorBadges";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Play, Pause, SkipForward, RotateCcw, Skull, Swords, Zap, Shield, 
  ChevronDown, ChevronUp, History, Timer, Target, Activity, 
  Dna, Boxes, Crosshair, BarChart3, TrendingUp, Trophy
} from "lucide-react";
import { audioManager } from "@/lib/AudioManager";

interface BoutViewerProps {
  nameA: string;
  nameD: string;
  styleA: string;
  styleD: string;
  log: MinuteEvent[];
  winner: "A" | "D" | null;
  by: FightOutcomeBy;
  announcement?: string;
  isRivalry?: boolean;
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
    case "crit": return <Zap className="h-3.5 w-3.5 text-destructive animate-pulse" />;
    case "death": return <Skull className="h-3.5 w-3.5 text-arena-blood" />;
    case "ko": return <Skull className="h-3 w-3 text-arena-gold" />;
    case "miss": return <Shield className="h-3 w-3 text-arena-steel opacity-40" />;
    case "riposte": return <Swords className="h-3 w-3 text-arena-fame" />;
    case "initiative": return <Zap className="h-3 w-3 text-primary" />;
    case "exhaust": return <Activity className="h-3 w-3 text-muted-foreground/40" />;
    case "phase": return <Target className="h-3 w-3 text-primary/60" />;
    default: return <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />;
  }
}

function getEventColor(type: ReturnType<typeof classifyEvent>) {
  switch (type) {
    case "hit": return "border-arena-gold/20 bg-arena-gold/5";
    case "crit": return "border-destructive/30 bg-destructive/10 shadow-[0_0_15px_rgba(var(--destructive-rgb),0.1)]";
    case "death": return "border-arena-blood/40 bg-arena-blood/10";
    case "ko": return "border-arena-gold/30 bg-arena-gold/5";
    case "riposte": return "border-arena-fame/20 bg-arena-fame/5";
    case "initiative": return "border-primary/20 bg-primary/5";
    case "exhaust": return "border-white/5 bg-white/5";
    case "miss": return "border-white/5 bg-transparent opacity-60";
    case "phase": return "border-primary/40 bg-primary/10 py-3 my-2";
    default: return "border-white/5 bg-transparent";
  }
}

function getOutcomeStyles(by: FightOutcomeBy) {
  switch (by) {
    case "Kill": return { bg: "bg-arena-blood/20 border-arena-blood/40", text: "text-arena-blood", icon: <Skull className="h-4 w-4" /> };
    case "KO": return { bg: "bg-arena-gold/20 border-arena-gold/40", text: "text-arena-gold", icon: <Zap className="h-4 w-4" /> };
    case "Exhaustion": return { bg: "bg-neutral-800 border-white/5", text: "text-muted-foreground", icon: <Activity className="h-4 w-4" /> };
    case "Stoppage": return { bg: "bg-primary/10 border-primary/20", text: "text-primary", icon: <Shield className="h-4 w-4" /> };
    default: return { bg: "bg-neutral-900 border-white/5", text: "text-muted-foreground", icon: <Swords className="h-4 w-4" /> };
  }
}

export default function BoutViewer({ nameA, nameD, styleA, styleD, log, winner, by, announcement, isRivalry }: BoutViewerProps) {
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
    setVisibleCount((c) => {
      const next = Math.min(c + 1, totalEvents);
      if (next > c) {
        const latestEvent = log[c];
        if (latestEvent) {
          const type = classifyEvent(latestEvent.text);
          if (type === "hit") audioManager.play("hit");
          else if (type === "crit") audioManager.play("crit");
          else if (type === "death") audioManager.play("death");
          else if (type === "riposte") audioManager.play("clash");
        }
      }
      return next;
    });
  }, [totalEvents, log]);

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
      setVisibleCount(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete]);

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

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visibleCount]);

  const outcomeStyle = getOutcomeStyles(by);
  const winnerName = winner === "A" ? nameA : winner === "D" ? nameD : null;
  const loserName = winner === "A" ? nameD : winner === "D" ? nameA : null;
  
  const minutes = log.length > 0 ? log[log.length - 1].minute : 0;
  const currentMinute = visibleCount > 0 ? log[visibleCount - 1]?.minute ?? 0 : 0;

  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden relative shadow-2xl">
      {/* Cinematic Header Overlay */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-arena-gold to-accent opacity-20" />
      
      {/* Fighter Header Component */}
      <div className="relative p-8 border-b border-white/5 bg-neutral-900/40 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="relative">
          {/* Header Controls */}
          <div className="absolute -top-4 -right-4 flex items-center gap-2">
            <Tooltip>
               <TooltipTrigger asChild>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-muted-foreground hover:text-foreground transition-all hover:border-white/30"
                    aria-label={expanded ? "Minimize battle log" : "Reveal battle log"}
                    aria-expanded={expanded}
                  >
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
               </TooltipTrigger>
               <TooltipContent className="bg-neutral-950 border-white/10 text-[10px] font-black uppercase tracking-widest">{expanded ? 'MINIMIZE_LOG' : 'REVEAL_INTEL'}</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center justify-between gap-12">
            {/* Asset Alpha */}
            <div className="text-center flex-1 space-y-4">
               <div className="space-y-1">
                  <h4 className="text-[9px] font-black tracking-[0.4em] text-primary uppercase opacity-40">Asset_Alpha</h4>
                  <h3 className={cn(
                    "font-display font-black uppercase text-2xl tracking-tighter transition-all duration-700",
                    winner === "A" ? "text-primary scale-110 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]" : winner === "D" ? "text-muted-foreground/30 grayscale" : "text-foreground"
                  )}>
                    {nameA}
                  </h3>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-white/5 bg-white/5 text-muted-foreground/60 rounded-none px-3">
                    {STYLE_DISPLAY_NAMES[styleA as keyof typeof STYLE_DISPLAY_NAMES] ?? styleA}
                  </Badge>
                  {winner === "A" && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary tracking-[0.2em] animate-pulse">
                       <Trophy className="h-3 w-3" /> VICTOR_SYNC
                    </div>
                  )}
               </div>
            </div>

            {/* Tactical Interlink */}
            <div className="flex flex-col items-center justify-center gap-4 shrink-0">
               <div className="relative">
                  <div className="absolute inset-0 bg-arena-gold/20 blur-xl rounded-full animate-pulse" />
                  <div className="w-14 h-14 rounded-full border-2 border-white/10 bg-neutral-900 flex items-center justify-center relative z-10 shadow-[inner_0_0_15px_rgba(0,0,0,0.5)]">
                    <Swords className="h-6 w-6 text-arena-gold" />
                  </div>
               </div>
               {isRivalry && (
                 <div className="flex flex-col items-center gap-1">
                    <TagBadge tag="BLOOD FEUD" type="injury" className="animate-pulse shadow-[0_0_10px_rgba(var(--destructive-rgb),0.3)]" />
                    <span className="text-[7px] font-black text-destructive uppercase tracking-widest opacity-40">High_Hostility_Sync</span>
                 </div>
               )}
            </div>

            {/* Asset Beta */}
            <div className="text-center flex-1 space-y-4">
               <div className="space-y-1">
                  <h4 className="text-[9px] font-black tracking-[0.4em] text-accent uppercase opacity-40">Asset_Beta</h4>
                  <h3 className={cn(
                    "font-display font-black uppercase text-2xl tracking-tighter transition-all duration-700",
                    winner === "D" ? "text-accent scale-110 drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)]" : winner === "A" ? "text-muted-foreground/30 grayscale" : "text-foreground"
                  )}>
                    {nameD}
                  </h3>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-white/5 bg-white/5 text-muted-foreground/60 rounded-none px-3">
                    {STYLE_DISPLAY_NAMES[styleD as keyof typeof STYLE_DISPLAY_NAMES] ?? styleD}
                  </Badge>
                  {winner === "D" && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-accent tracking-[0.2em] animate-pulse">
                       <Trophy className="h-3 w-3" /> VICTOR_SYNC
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between font-mono text-[9px] font-black text-muted-foreground/40 tracking-widest uppercase">
               <div className="flex items-center gap-2">
                  <Timer className="h-3 w-3" /> T-MIN 00
               </div>
               <div className="flex items-center gap-2">
                  FINAL_RESOLUTION <Timer className="h-3 w-3" /> 0{minutes}
               </div>
            </div>
            <div className="relative h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
               <div
                 className="absolute inset-0 bg-gradient-to-r from-primary via-arena-gold to-accent opacity-20"
                 style={{ width: `${totalEvents > 0 ? (visibleCount / totalEvents) * 100 : 0}%` }}
               />
               <div
                 className="h-full bg-gradient-to-r from-primary to-arena-gold rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                 style={{ width: `${totalEvents > 0 ? (visibleCount / totalEvents) * 100 : 0}%` }}
               >
                  <div className="absolute right-0 top-0 h-full w-4 bg-white/40 blur-sm animate-pulse" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-700">
          {/* Simulation Controls */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-neutral-900/60 backdrop-blur-xl">
             <div className="flex items-center gap-4">
                <div className="flex items-center px-4 py-2 rounded-xl bg-black border border-white/5 gap-4">
                   <Tooltip>
                      <TooltipTrigger asChild>
                         <button onClick={reset} className="text-muted-foreground/40 hover:text-white transition-colors" aria-label="Reset bout viewer">
                            <RotateCcw className="h-4 w-4" />
                         </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black uppercase tracking-widest">RESET_BUFFER</TooltipContent>
                   </Tooltip>
                   
                   <div className="h-4 w-px bg-white/10" />
                   
                   <button
                     onClick={togglePlay}
                     className={cn(
                       "flex items-center justify-center p-2.5 rounded-full transition-all active:scale-95 group/play",
                       isPlaying ? "bg-white/10 text-white" : "bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]"
                     )}
                     aria-label={isPlaying ? "Pause playback" : "Play bout"}
                   >
                     {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5 fill-current" />}
                   </button>
                   
                   <div className="h-4 w-px bg-white/10" />
                   
                   <Tooltip>
                      <TooltipTrigger asChild>
                         <button onClick={skipToEnd} className="text-muted-foreground/40 hover:text-white transition-colors" aria-label="Skip to end of bout">
                            <SkipForward className="h-4 w-4" />
                         </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black uppercase tracking-widest">SKIP_TO_RESOLVE</TooltipContent>
                   </Tooltip>
                </div>

                <div className="flex items-center bg-black border border-white/5 rounded-xl p-1">
                  {[1, 2, 3].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s as any)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-mono font-black transition-all",
                        speed === s ? "bg-white/10 text-white" : "text-muted-foreground/20 hover:text-muted-foreground/60"
                      )}
                      aria-label={`Set playback speed to ${s}x`}
                      aria-pressed={speed === s}
                    >
                      {s}X
                    </button>
                  ))}
                </div>
             </div>

             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 font-mono text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                   <div className="p-1 px-2 rounded bg-neutral-950 border border-white/5 text-primary">
                      {visibleCount}
                   </div>
                   <span className="opacity-20 text-xs">/</span>
                   <div className="p-1 px-2 rounded bg-neutral-950 border border-white/5">
                      {totalEvents}
                   </div>
                   ENTRIES
                </div>
             </div>
          </div>

          {/* Tactical Monitor Log */}
          <div className="h-[440px] overflow-y-auto px-6 py-8 space-y-2 bg-[url('/grid-pattern.svg')] bg-[length:40px_40px] relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {visibleCount === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 pointer-events-none">
                <History className="h-16 w-16 text-muted-foreground mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Press_Play_To_Initialize_Bout_Data</p>
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
                    "flex flex-col gap-3 p-4 rounded-xl border transition-all duration-500",
                    getEventColor(type),
                    isLatest ? "scale-[1.02] shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)] ring-1 ring-primary/40 -translate-y-1" : "opacity-60 grayscale-[0.4]",
                    isPhaseEvent && "border-primary/40"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 shrink-0">
                       <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                          {getEventIcon(type)}
                       </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                         <span className={cn(
                           "text-[9px] font-mono font-black uppercase tracking-[0.2em] opacity-40",
                           isLatest && "opacity-100 text-primary"
                         )}>
                            Minute_0{event.minute}
                         </span>
                         {isLatest && <div className="h-1 w-1 rounded-full bg-primary animate-ping" />}
                      </div>
                      <p className={cn(
                        "text-[13px] leading-relaxed font-medium tracking-tight",
                        type === "death" ? "font-black text-arena-blood uppercase tracking-wide italic" :
                        type === "crit" ? "font-black text-destructive uppercase tracking-wide italic" :
                        type === "ko" ? "font-black text-arena-gold uppercase tracking-wide italic" :
                        type === "phase" ? "font-black text-primary text-sm uppercase tracking-[0.3em] py-2" :
                        "text-foreground/90"
                      )}>
                        {event.text}
                      </p>
                    </div>
                  </div>

                  {/* Tactical Insight Overlay */}
                  {isPhaseEvent && (event.offTacticA || event.defTacticA || event.protectA || event.offTacticD || event.defTacticD || event.protectD) && (
                    <div className="grid grid-cols-2 gap-4 mt-2 pl-12">
                      {[
                        { name: nameA, off: event.offTacticA, def: event.defTacticA, prot: event.protectA, color: "primary" },
                        { name: nameD, off: event.offTacticD, def: event.defTacticD, prot: event.protectD, color: "accent" }
                      ].map((tactical) => (
                        <div key={tactical.name} className="space-y-3 p-3 rounded-xl bg-black/40 border border-white/5">
                           <div className="flex items-center gap-2">
                              <Boxes className={cn("h-3 w-3", tactical.color === "primary" ? "text-primary" : "text-accent")} />
                              <span className="text-[10px] font-black uppercase text-muted-foreground/60">{tactical.name} PROTOCOL</span>
                           </div>
                           <div className="flex flex-wrap gap-1.5 focus:outline-none">
                              {tactical.off && <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0 border-arena-gold/30 text-arena-gold bg-arena-gold/5">{tactical.off}</Badge>}
                              {tactical.def && <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0 border-primary/30 text-primary bg-primary/5">{tactical.def}</Badge>}
                              {tactical.prot && <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0 border-white/20 text-muted-foreground/60">🛡 {tactical.prot}</Badge>}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={logEndRef} className="h-4" />
          </div>

          {/* Cinematic Resolution Banner */}
          {isComplete && winner && (
            <div className={cn(
              "p-8 border-t flex flex-col items-center gap-6 animate-in slide-in-from-bottom-8 duration-1000 bg-neutral-950/80 backdrop-blur-3xl relative overflow-hidden",
              outcomeStyle.bg
            )}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              
              <div className="flex items-center gap-8 relative z-10 w-full justify-center">
                 <div className={outcomeStyle.text}>{outcomeStyle.icon}</div>
                 <div className="text-center space-y-2">
                    <h2 className={cn("font-display font-black text-3xl uppercase tracking-tighter italic", outcomeStyle.text)}>
                      {winnerName} VICTORY
                    </h2>
                    <div className="flex items-center justify-center gap-3">
                       <span className="h-px w-8 bg-white/10" />
                       <div className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">BY_WAY_OF_{(by ?? "RESOLUTION").toUpperCase()}</div>
                       <span className="h-px w-8 bg-white/10" />
                    </div>
                 </div>
                 <div className={outcomeStyle.text}>{outcomeStyle.icon}</div>
              </div>

              <div className="flex items-center gap-8 relative z-10">
                 <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none mb-1">Resolution Time</span>
                    <span className="font-mono font-black text-white text-lg leading-none">{minutes}:00</span>
                 </div>
                 <div className="h-8 w-px bg-white/5" />
                 <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none mb-1">Engagements</span>
                    <span className="font-mono font-black text-white text-lg leading-none">{totalEvents}</span>
                 </div>
              </div>
            </div>
          )}

          {isComplete && !winner && (
            <div className="p-12 border-t border-white/5 flex flex-col items-center gap-4 bg-neutral-900 animate-in slide-in-from-bottom-8 duration-1000">
               <Crosshair className="h-10 w-10 text-muted-foreground opacity-40 mb-2" />
               <h2 className="font-display font-black text-3xl uppercase tracking-tighter italic text-muted-foreground/60">
                 MUTUAL_DEPLETION_DRAW
               </h2>
               <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.5em]">{minutes} MINUTES // NO RESOLUTION</div>
            </div>
          )}

          {/* Comms Link Overlay */}
          {isComplete && announcement && (
            <div className="px-8 py-6 border-t border-white/5 bg-black relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-px bg-arena-gold/30 animate-pulse" />
               <div className="relative z-10 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-arena-gold/10 border border-arena-gold/20 shrink-0">
                     <Activity className="h-4 w-4 text-arena-gold" />
                  </div>
                  <p className="text-[13px] italic text-muted-foreground/80 leading-relaxed font-serif py-0.5">
                    " {announcement} "
                  </p>
               </div>
            </div>
          )}
        </div>
      )}
    </Surface>
  );
}
