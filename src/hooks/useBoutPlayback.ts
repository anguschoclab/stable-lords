import { useState, useEffect, useCallback, useRef } from "react";
import { audioManager } from "@/lib/AudioManager";
import { MinuteEvent } from "@/types/game";
import { classifyEvent } from "@/lib/boutUtils";

export function useBoutPlayback(log: MinuteEvent[]) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalEvents = log.length;
  const isComplete = visibleCount >= totalEvents;
  const speedMs = speed === 1 ? 800 : speed === 2 ? 400 : 150;

  const advanceOne = useCallback(() => {
    setVisibleCount((c) => {
      const next = Math.min(c + 1, totalEvents);
      if (next > c) {
        const event = log[c];
        if (event) {
          const type = classifyEvent(event);
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

  return {
    visibleCount,
    setVisibleCount,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    isComplete,
    totalEvents,
    advanceOne,
    reset,
    skipToEnd,
    togglePlay,
  };
}
