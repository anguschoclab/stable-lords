import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, History, ChevronUp, ChevronDown } from "lucide-react";
import type { MinuteEvent } from "@/types/combat.types";
import { classifyEvent } from "@/lib/boutUtils";

interface MiniCombatLogProps {
  events: MinuteEvent[];
  visibleCount: number;
  isPlaying: boolean;
  className?: string;
  onClose?: () => void;
}

export default function MiniCombatLog({ 
  events, 
  visibleCount, 
  isPlaying, 
  className,
  onClose 
}: MiniCombatLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = React.useState(true);

  useEffect(() => {
    if (isExpanded) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [visibleCount, isExpanded]);

  const visibleEvents = events.slice(0, visibleCount);
  const recentEvents = visibleEvents.slice(-5); // Show last 5 events

  const getEventIcon = (type: ReturnType<typeof classifyEvent>) => {
    switch (type) {
      case "hit": return "⚔️";
      case "crit": return "⚡";
      case "death": return "💀";
      case "ko": return "😵";
      case "miss": return "🛡️";
      case "riposte": return "↩️";
      case "initiative": return "⚡";
      case "exhaust": return "😮‍💨";
      case "phase": return "◆";
      case "spatial": return "↔";
      default: return "•";
    }
  };

  return (
    <div
      className={cn(
        "absolute bottom-4 left-4 z-30",
        "transition-all duration-300",
        className
      )}
    >
      {/* Header */}
      <div 
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2",
          "bg-neutral-950/95 border border-white/10 backdrop-blur-md",
          "rounded-none cursor-pointer hover:border-white/20 transition-colors"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-arena-gold" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Combat Log
          </span>
          {isPlaying && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 hover:bg-white/10 rounded-none transition-colors ml-1"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Log Content */}
      {isExpanded && (
        <div
          className={cn(
            "w-64 max-h-48 overflow-y-auto",
            "bg-neutral-950/90 border border-white/10 border-t-0",
            "backdrop-blur-md scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          )}
        >
          {visibleCount === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Playback initializing...
              </p>
            </div>
          ) : (
            <div className="py-2 space-y-1">
              {recentEvents.map((event, idx) => {
                const type = classifyEvent(event);
                const isLatest = idx === recentEvents.length - 1;
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      "px-3 py-1.5 flex items-start gap-2",
                      "transition-all duration-300",
                      isLatest && "bg-white/5"
                    )}
                  >
                    <span className="text-[10px] shrink-0 mt-0.5">
                      {getEventIcon(type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[10px] leading-tight",
                        isLatest ? "text-foreground font-medium" : "text-muted-foreground/60",
                        type === "death" && "text-arena-blood font-black",
                        type === "crit" && "text-destructive font-black"
                      )}>
                        {event.text.length > 60 
                          ? event.text.substring(0, 60) + "..."
                          : event.text
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={logEndRef} className="h-1" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
