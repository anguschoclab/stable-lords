import React, { useState, useEffect, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from "framer-motion";
import { Info, X, ChevronRight, AlertTriangle, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "@tanstack/react-router";

/* ── Coach Logic ────────────────────────────────────────── */

interface Tip {
  id: string;
  title: string;
  message: string;
  priority: number; // Higher is more urgent
  condition: (state: import("@/types/game").GameState) => boolean;
}

const GLOBAL_TIPS: Tip[] = [
  {
    id: "debt-warning",
    title: "Fiscal Warning",
    message: "Your treasury is low! Fighting without enough gold for upkeep will lead to stability penalties. Consider a low-risk bout.",
    priority: 10,
    condition: (s) => s.gold < 100,
  },
  {
    id: "injury-risk",
    title: "Medical Advisory",
    message: "Multiple warriors are carrying injuries. Forcing them to fight now significantly increases the risk of permanent disability.",
    priority: 8,
    condition: (s) => s.roster.filter((w: import("@/types/game").Warrior) => w.injuries.length > 0 && w.status === "Active").length >= 2,
  },
  {
    id: "training-cap",
    title: "Tactical Limit",
    message: "Some warriors have reached their attribute caps (25 per stat). Further training in these areas is wasted effort.",
    priority: 5,
    condition: (s) => s.roster.some((w: import("@/types/game").Warrior) => Object.values(w.attributes).some((v: number) => v >= 25)),
  },
  {
    id: "recruit-debt",
    title: "Recruitment Strategy",
    message: "You have fewer than 3 active warriors. Your rotation is vulnerable. Scout the Orphanage for fresh blood.",
    priority: 9,
    condition: (s) => s.roster.filter((w: import("@/types/game").Warrior) => w.status === "Active").length < 3,
  }
];

export function CoachOverlay() {
  const location = useLocation();
  const { state, coachDismissed, setCoachDismissed } = useGameStore(
    useShallow((s) => ({
      state: s.state,
      coachDismissed: s.state.coachDismissed || [],
      setCoachDismissed: (ids: string[]) => s.setState({ ...s.state, coachDismissed: ids }),
    }))
  );

  const [minimized, setMinimized] = useState(false);

  // Determine active tip
  const activeTip = useMemo(() => {
    const valid = GLOBAL_TIPS.filter(t => !coachDismissed.includes(t.id) && t.condition(state));
    return valid.sort((a, b) => b.priority - a.priority)[0];
  }, [state, coachDismissed]);

  if (!activeTip) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className={cn(
          "fixed bottom-24 right-8 z-50 max-w-sm transition-all duration-300",
          minimized ? "w-12 h-12" : "w-full"
        )}
      >
        {minimized ? (
          <Button
            size="icon"
            onClick={() => setMinimized(false)}
            className="rounded-full bg-arena-gold text-black shadow-lg hover:bg-arena-gold/90 border-2 border-black/20"
            title="Show coach tips"
            aria-label="Show coach tips"
          >
            <Info className="w-5 h-5" />
          </Button>
        ) : (
          <div className="bg-glass-card border-l-4 border-arena-gold p-4 shadow-2xl overflow-hidden relative group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-arena-gold">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Coach Directive</span>
                </div>
                <h4 className="text-sm font-display font-bold text-foreground">{activeTip.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeTip.message}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setMinimized(true)}
                  className="p-1 hover:bg-white/5 rounded transition-colors text-muted-foreground"
                  aria-label="Minimize coach tip"
                  title="Minimize tip"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCoachDismissed([...coachDismissed, activeTip.id])}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive"
                  aria-label="Dismiss coach tip"
                  title="Dismiss tip"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Stable Lords Management OS</span>
              <button 
                onClick={() => setMinimized(true)}
                className="text-[9px] font-bold text-arena-gold uppercase tracking-tighter hover:underline"
              >
                Hide Advice
              </button>
            </div>

            {/* Subtle progress/glow anim */}
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-arena-gold/20">
               <motion.div 
                 initial={{ width: "0%" }}
                 animate={{ width: "100%" }}
                 transition={{ duration: 10, ease: "linear" }}
                 className="h-full bg-arena-gold shadow-[0_0_10px_rgba(var(--arena-gold-rgb),0.5)]"
               />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
