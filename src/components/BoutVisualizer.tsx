import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { MinuteEvent, FightOutcomeBy, CombatEvent } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import TagBadge from "@/components/TagBadge";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Skull, 
  Swords, 
  Zap, 
  Shield, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Flame,
  Target
} from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { audioManager } from "@/lib/AudioManager";

interface BoutVisualizerProps {
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

// Re-using classification logic with metadata support
function classifyEvent(event: MinuteEvent): "hit" | "miss" | "crit" | "death" | "ko" | "exhaust" | "status" | "riposte" | "initiative" | "phase" {
  if (event.text.startsWith("—") && event.text.includes("Phase")) return "phase";
  
  // Check raw events for metadata first
  const hasCrit = event.events?.some(e => e.metadata?.critical || e.metadata?.lethal);
  if (hasCrit) return "crit";

  const t = event.text.toLowerCase();
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
    case "hit": return <Swords className="h-4 w-4 text-arena-gold" />;
    case "crit": return <Zap className="h-5 w-5 text-destructive" data-testid="event-crit-icon" />;
    case "death": return <Skull className="h-5 w-5 text-arena-blood" />;
    case "ko": return <Activity className="h-4 w-4 text-arena-gold" />;
    case "miss": return <Shield className="h-4 w-4 text-arena-steel" />;
    case "riposte": return <RotateCcw className="h-4 w-4 text-arena-fame" />;
    case "initiative": return <Zap className="h-4 w-4 text-primary" />;
    case "exhaust": return <Flame className="h-4 w-4 text-muted-foreground" />;
    case "phase": return <Activity className="h-4 w-4 text-primary" />;
    default: return <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />;
  }
}


interface BoutHeaderProps {
  nameA: string;
  nameD: string;
  styleA: string;
  styleD: string;
  winner: "A" | "D" | null;
  isComplete: boolean;
  isPlaying: boolean;
  isRivalry?: boolean;
}

function BoutHeader({ nameA, nameD, styleA, styleD, winner, isComplete, isPlaying, isRivalry }: BoutHeaderProps) {
  return (
    <div className="grid grid-cols-3 items-center p-6 bg-gradient-to-b from-secondary/50 to-transparent">
      <div className="flex flex-col items-center gap-1">
        <span className={cn(
          "text-xl font-display font-bold tracking-tight transition-all",
          winner === "A" && isComplete ? "text-arena-gold scale-110" : "text-foreground"
        )}>
          {nameA}
        </span>
        <Badge variant="outline" className="text-[10px] uppercase tracking-widest opacity-70">
          {STYLE_DISPLAY_NAMES[styleA as keyof typeof STYLE_DISPLAY_NAMES] ?? styleA}
        </Badge>
        {winner === "A" && isComplete && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-bold text-arena-gold">👑 VICTOR</motion.div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-border bg-secondary flex items-center justify-center relative overflow-hidden">
           <motion.div
             animate={{ rotate: isPlaying ? [0, 10, -10, 0] : 0 }}
             transition={{ repeat: Infinity, duration: 2 }}
           >
             <Swords className="h-6 w-6 text-arena-gold" />
           </motion.div>
           <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
        </div>
        {isRivalry && <TagBadge tag="VENDETTA" type="injury" className="mt-2 text-[8px]" />}
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className={cn(
          "text-xl font-display font-bold tracking-tight transition-all",
          winner === "D" && isComplete ? "text-arena-gold scale-110" : "text-foreground"
        )}>
          {nameD}
        </span>
        <Badge variant="outline" className="text-[10px] uppercase tracking-widest opacity-70">
          {STYLE_DISPLAY_NAMES[styleD as keyof typeof STYLE_DISPLAY_NAMES] ?? styleD}
        </Badge>
        {winner === "D" && isComplete && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-bold text-arena-gold">👑 VICTOR</motion.div>
        )}
      </div>
    </div>
  );
}


interface ImpactStageProps {
  stageControls: any;
  currentEvent: any;
  visibleCount: number;
  eventType: string;
}

function ImpactStage({ stageControls, currentEvent, visibleCount, eventType }: ImpactStageProps) {
  return (
    <motion.div
      animate={stageControls}
      className="h-48 relative flex items-center justify-center px-8 border-y border-border/50 bg-neutral-950/20"
    >
      <AnimatePresence mode="wait">
        {currentEvent ? (
          <motion.div
            key={visibleCount}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ rotate: -20 }}
                animate={{ rotate: 0 }}
                className="p-4 rounded-full bg-secondary/80 border border-arena-gold/30 shadow-[0_0_20px_rgba(255,191,0,0.1)]"
              >
                {getEventIcon(eventType as any)}
              </motion.div>
            </div>
            <p className={cn(
              "text-lg font-medium leading-relaxed max-w-md mx-auto italic",
              eventType === "crit" ? "text-destructive font-bold drop-shadow-sm" : "text-foreground/90"
            )}>
              "{currentEvent.text}"
            </p>
          </motion.div>
        ) : (
           <p className="text-muted-foreground font-display tracking-widest uppercase text-sm opacity-50">Awaiting Signal...</p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


interface PlaybackControlsProps {
  isPlaying: boolean;
  speed: 1 | 2 | 3;
  visibleCount: number;
  totalEvents: number;
  log: any[];
  isComplete: boolean;
  reset: () => void;
  togglePlay: () => void;
  skipToEnd: () => void;
  setSpeed: (speed: 1 | 2 | 3) => void;
  setVisibleCount: (count: number) => void;
}

function PlaybackControls({
  isPlaying,
  speed,
  visibleCount,
  totalEvents,
  log,
  isComplete,
  reset,
  togglePlay,
  skipToEnd,
  setSpeed,
  setVisibleCount
}: PlaybackControlsProps) {
  return (
    <div className="px-6 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 transition-colors" onClick={reset} aria-label="Reset">
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 transition-colors" onClick={skipToEnd} aria-label="Skip">
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end">
             <span className="text-[10px] text-muted-foreground uppercase tracking-tighter font-bold">Temporal Velocity</span>
             <div className="flex gap-1 mt-1">
               {[1, 2, 3].map(s => (
                 <button
                   key={s}
                   onClick={() => setSpeed(s as any)}
                   className={cn(
                     "w-8 h-6 rounded flex items-center justify-center text-[10px] font-mono transition-all border",
                     speed === s ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                   )}
                 >
                   {s}x
                 </button>
               ))}
             </div>
           </div>
           <div className="h-10 w-px bg-border mx-2" />
           <div className="flex flex-col items-center">
             <span className="text-sm font-mono font-bold text-arena-gold">{visibleCount}/{totalEvents}</span>
             <span className="text-[9px] text-muted-foreground font-mono">EVENTS</span>
           </div>
        </div>
      </div>

      {/* Horizontal Timeline scrubber */}
      <div className="relative h-12 bg-secondary/30 rounded-lg border border-border p-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {log.map((event, i) => {
          const type = classifyEvent(event);
          const isActive = i === visibleCount - 1;
          const isSeen = i < visibleCount;

          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.1 }}
              onClick={() => setVisibleCount(i + 1)}
              className={cn(
                "shrink-0 w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-all border",
                isActive ? "bg-primary/20 border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" :
                isSeen ? "bg-secondary/80 border-border opacity-70" : "bg-transparent border-transparent opacity-30"
              )}
            >
              {getEventIcon(type)}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


interface OutcomeBannerProps {
  isComplete: boolean;
  winner: "A" | "D" | null;
  nameA: string;
  nameD: string;
  by: string;
  logLength: number;
  announcement?: string;
}

function OutcomeBanner({ isComplete, winner, nameA, nameD, by, logLength, announcement }: OutcomeBannerProps) {
  return (
    <AnimatePresence>
      {isComplete && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          className={cn(
            "px-6 py-4 border-t flex flex-col items-center gap-2",
            winner === "A" || winner === "D" ? "bg-arena-gold/5" : "bg-secondary/50"
          )}
        >
           <div className="flex items-center gap-3">
             <Swords className="h-5 w-5 text-arena-gold" />
             <h3 className="text-xl font-display font-black tracking-tight uppercase italic">
               {winner ? `${winner === "A" ? nameA : nameD} Claims Victory` : "A Hollow Draw"}
             </h3>
             <Swords className="h-5 w-5 text-arena-gold" />
           </div>
           <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1"><Target className="h-3 w-3" /> BY {by?.toUpperCase() || "TIME"}</span>
              <div className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {logLength} SEQUENCES</span>
           </div>
           {announcement && (
             <p className="mt-2 text-sm text-arena-gold/80 italic text-center max-w-lg">
               🎙️ "{announcement}"
             </p>
           )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function BoutVisualizer({ nameA, nameD, styleA, styleD, log, winner, by, announcement, isRivalry }: BoutVisualizerProps) {




  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const stageControls = useAnimation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalEvents = log.length;
  const isComplete = visibleCount >= totalEvents;
  const speedMs = speed === 1 ? 1000 : speed === 2 ? 500 : 200;

  const currentEvent = useMemo(() => {
    return visibleCount > 0 ? log[visibleCount - 1] : null;
  }, [visibleCount, log]);

  const eventType = useMemo(() => {
    return currentEvent ? classifyEvent(currentEvent) : "status";
  }, [currentEvent]);

  // Screen shake effect for criticals
  useEffect(() => {
    if (eventType === "crit") {
      stageControls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      });
    }
  }, [visibleCount, eventType, stageControls]);

  const advanceOne = useCallback(() => {
    setVisibleCount((c) => {
      const next = Math.min(c + 1, totalEvents);
      if (next > c) {
        const event = log[c];
        const type = classifyEvent(event);
        if (type === "hit") audioManager.play("hit");
        else if (type === "crit") audioManager.play("crit");
        else if (type === "death") audioManager.play("death");
        else if (type === "riposte") audioManager.play("clash");
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
      timerRef.current = setTimeout(advanceOne, speedMs);
    } else if (isComplete) {
      setIsPlaying(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, visibleCount, isComplete, speedMs, advanceOne]);


  return (
    <div className="flex flex-col gap-4 w-full bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-2xl">
      <BoutHeader
        nameA={nameA}
        nameD={nameD}
        styleA={styleA}
        styleD={styleD}
        winner={winner}
        isComplete={isComplete}
        isPlaying={isPlaying}
        isRivalry={isRivalry}
      />

      <ImpactStage
        stageControls={stageControls}
        currentEvent={currentEvent}
        visibleCount={visibleCount}
        eventType={eventType}
      />

      <PlaybackControls
        isPlaying={isPlaying}
        speed={speed}
        visibleCount={visibleCount}
        totalEvents={totalEvents}
        log={log}
        isComplete={isComplete}
        reset={reset}
        togglePlay={togglePlay}
        skipToEnd={skipToEnd}
        setSpeed={setSpeed}
        setVisibleCount={setVisibleCount}
      />

      <OutcomeBanner
        isComplete={isComplete}
        winner={winner}
        nameA={nameA}
        nameD={nameD}
        by={by as string}
        logLength={log.length}
        announcement={announcement}
      />
    </div>
  );
}
