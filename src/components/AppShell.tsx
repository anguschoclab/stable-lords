import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Swords, RotateCcw, LogOut, Save,
  Activity, Volume2, VolumeX,
  Coins, Crown, Cloud, ChevronRight
} from "lucide-react";
import { audioManager } from "@/lib/AudioManager";
import { Button } from "@/components/ui/button";
import { useGameStore, type GameStore } from "@/state/useGameStore";
import { Separator } from "@/components/ui/separator";
import { MOOD_ICONS } from "@/engine/crowdMood";
import type { Warrior } from "@/types/state.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

import { useRivalryAlerts } from "@/hooks/useRivalryAlerts";
import { LeftNav } from "@/components/navigation/LeftNav";

import { useShallow } from 'zustand/react/shallow';

import { DeathModal } from "@/components/modals/DeathModal";
import { CoachOverlay } from "@/components/ui/CoachOverlay";
import EventLog from "@/components/EventLog";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const {
    week, day, isTournamentWeek, treasury, fame, crowdMood, weather, roster,
    doReset, returnToTitle, lastSavedAt,
    isSimulating, isInitialized, eventLogOpen, initialize
  } = useGameStore(
    useShallow((s: GameStore) => ({
      week: s.week,
      day: s.day,
      isTournamentWeek: s.isTournamentWeek,
      treasury: s.treasury,
      fame: s.fame,
      crowdMood: s.crowdMood,
      weather: s.weather,
      roster: s.roster,
      doReset: s.doReset,
      returnToTitle: s.returnToTitle,
      lastSavedAt: s.lastSavedAt,
      isSimulating: s.isSimulating,
      isInitialized: s.isInitialized,
      eventLogOpen: s.eventLogOpen,
      initialize: s.initialize
    }))
  );
  const navigate = useNavigate();
  const activePath = location.pathname;
  const moodIcon = MOOD_ICONS[crowdMood as keyof typeof MOOD_ICONS] ?? "😐";
  const [resetOpen, setResetOpen] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted());

  const toggleMute = () => {
    const next = !isMuted;
    audioManager.setMuted(next);
    setIsMuted(next);
  };
  useRivalryAlerts();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Only check for "Orphan" status if we are in the main game loops
    const exemptPaths = ["/welcome", "/ops/", "/admin", "/help"];
    if (exemptPaths.some(p => activePath.startsWith(p))) return;

    const activeWarriors = roster.filter((w: Warrior) => w.status === "Active");
    if (activeWarriors.length < 3) {
      console.warn("Personnel deficit detected. Redirecting to recruitment protocol.");
      navigate({ to: "/welcome" });
    }
  }, [roster, activePath, navigate]);

  useEffect(() => {
    if (!lastSavedAt) return;
    setSaveFlash(true);
    const t = setTimeout(() => setSaveFlash(false), 1500);
    return () => clearTimeout(t);
  }, [lastSavedAt]);

  const formatSaveTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  // const activePath = location.pathname;

  return (
    <div className="min-h-screen bg-[#050506] flex flex-col overflow-hidden text-foreground selection:bg-primary/30">
      {/* ─── Global Status Header ─── */}
      <header className="h-14 border-b border-white/5 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-between px-6 sticky top-0 flex-shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group active:scale-95 transition-transform">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="w-8 h-8 rounded-none bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)] border border-white/10"
            >
              <Swords className="h-5 w-5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">Stable Lords</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">ALPHA DISTRICT 412</span>
            </div>
          </Link>

          <Separator orientation="vertical" className="h-6 bg-white/5" />

          <div className="hidden lg:flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Arena Time</span>
              <span className="font-mono font-black text-xs text-foreground bg-white/5 px-2 py-0.5 rounded border border-white/5">
                W{week}{isTournamentWeek ? ` • D${day + 1}` : ""}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Treasury</span>
              <span className="font-mono font-black text-xs text-arena-gold flex items-center gap-1">
                {(treasury ?? 0).toLocaleString()} <Coins className="h-3 w-3 opacity-60" />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Influence</span>
              <span className="font-mono font-black text-xs text-arena-fame flex items-center gap-1">
                {fame} <Crown className="h-3 w-3 opacity-60" />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Crowd Mood</span>
              <span className="font-mono font-black text-xs text-arena-pop flex items-center gap-1">
                {moodIcon} <Activity className="h-3 w-3 opacity-60" />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Weather</span>
              <span className="font-mono font-black text-xs text-sky-400 flex items-center gap-1">
                <Cloud className="h-3 w-3 opacity-60" /> {weather || "Clear"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/command/combat"
            className={cn(
              "flex items-center gap-2 h-9 px-4 font-black text-[11px] uppercase tracking-widest transition-all duration-150",
              isSimulating
                ? "bg-white/5 text-muted-foreground/40 pointer-events-none"
                : "bg-primary text-white shadow-[0_0_16px_rgba(255,0,0,0.35)] hover:bg-primary/90 hover:shadow-[0_0_24px_rgba(255,0,0,0.5)] active:scale-95"
            )}
          >
            {isTournamentWeek ? `Day ${day + 1}` : `Week ${week}`}
            <ChevronRight className="h-3.5 w-3.5" />
            {isTournamentWeek ? "Fight" : "Advance"}
          </Link>
          <Separator orientation="vertical" className="h-6 bg-white/5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none hover:bg-white/5 transition-colors"
                onClick={toggleMute}
                title={isMuted ? "Unmute audio" : "Mute audio"}
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                aria-pressed={!isMuted}
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4 text-primary" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10">
              Toggle Acoustic Signal ({isMuted ? "Muted" : "Active"})
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-none transition-all",
                  saveFlash ? "bg-primary/20 text-primary scale-110" : "hover:bg-white/5"
                )}
                title="Save status"
                aria-label="Save status"
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10">
              {lastSavedAt ? `Auto-Saved: ${formatSaveTime(lastSavedAt)}` : "Registry Idle"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => setResetOpen(true)}
                title="Reset game"
                aria-label="Reset game"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10">
              Terminal Reset (Delete Save)
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 bg-white/5 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30"
                onClick={returnToTitle}
                disabled={isSimulating}
                title="Exit to title"
                aria-label="Exit to title"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10">
              Exit to Command Center
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* ─── Left Navigation Rail ─── */}
        <LeftNav />

        {/* ─── Main Content Area ─── */}
        <main className="flex-1 flex flex-col relative bg-[#050506] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          
          <div className="flex-1 relative overflow-y-auto overflow-x-hidden p-6 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                className="relative z-10"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          <CoachOverlay />

          <AnimatePresence>
            {!isInitialized && (

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-[#050506] flex items-center justify-center flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-none border-2 border-primary/20 border-t-primary animate-spin" />
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 animate-pulse">
                  Restoring_Temporal_Sync...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ─── Event Log Right Rail ─── */}
        <AnimatePresence>
          {eventLogOpen && (
            <motion.aside
              key="event-log"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-shrink-0 border-l border-white/10 bg-[#0d0f14] overflow-hidden flex flex-col"
            >
              <EventLog />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <DeathModal />

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="bg-neutral-900 border-destructive/20 scale-105">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-black text-2xl uppercase tracking-tighter text-destructive">Terminal Purge Protocol</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium selection:bg-destructive/20">
              You are about to initiate the Purge Protocol. This sequence will permanently erase the current combat history, stable roster, and financial records. 
              <br/><br/>
              <span className="text-destructive font-black uppercase tracking-widest text-[10px]">Data loss is irreversible. Proceed?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="bg-secondary/40 border-white/5 hover:bg-white/10 hover:text-foreground">Abort Protocol</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black uppercase text-[11px] tracking-widest shadow-[0_0_20px_rgba(255,0,0,0.3)]"
                onClick={() => {
                  doReset();
                  setResetOpen(false);
                }}
              >
                Confirm Purge
              </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
