import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { 
  Swords, LayoutDashboard, Zap, Trophy, HelpCircle, 
  RotateCcw, ScrollText, UserPlus, Skull, GraduationCap, 
  LogOut, PanelLeftClose, PanelLeft, Save, Download, 
  Dumbbell, Sun, Moon, Search, Globe, Newspaper, 
  Crown, Shield, BarChart3, Target, Award, BookOpen, 
  Eye, Landmark, Settings, Users, Activity, Volume2, VolumeX
} from "lucide-react";
import { audioManager } from "@/lib/AudioManager";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/state/useGameStore";
import { selectActiveWarriors } from "@/state/selectors";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MOOD_ICONS } from "@/engine/crowdMood";
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
import { motion, AnimatePresence } from "framer-motion";

import { useCoachTip } from "@/hooks/useCoachTip";
import { getActiveSlot, deleteSlot, exportActiveSlot } from "@/state/saveSlots";
import EventLog from "@/components/EventLog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRivalryAlerts } from "@/hooks/useRivalryAlerts";

const NAV_SECTIONS = [
  {
    id: "hub",
    label: "Management",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/run-round", label: "Arena Combat", icon: Swords },
    ]
  },
  {
    id: "stable",
    label: "My Stable",
    items: [
      { to: "/stable", label: "Roster", icon: Users },
      { to: "/stable/training", label: "Training", icon: Dumbbell },
      { to: "/stable/recruit", label: "Recruitment", icon: UserPlus },
      { to: "/stable/equipment", label: "Armory", icon: Shield },
      { to: "/stable/planner", label: "Tactics", icon: BarChart3 },
    ]
  },
  {
    id: "world",
    label: "The World",
    items: [
      { to: "/world", label: "Power Rankings", icon: Globe },
      { to: "/world/tournaments", label: "Tournaments", icon: Trophy },
      { to: "/world/scouting", label: "Scouting", icon: Search },
      { to: "/world/gazette", label: "Daily Gazette", icon: Newspaper },
    ]
  },
  {
    id: "legacy",
    label: "Archive",
    items: [
      { to: "/legacy", label: "Graveyard", icon: Skull },
      { to: "/legacy/hall-of-fame", label: "Hall of Fame", icon: Crown },
      { to: "/legacy/analytics", label: "Kill Stats", icon: Target },
    ]
  }
];

import { useShallow } from 'zustand/react/shallow';

import { DeathModal } from "@/components/modals/DeathModal";
import { CoachOverlay } from "@/components/ui/CoachOverlay";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { state, doReset, returnToTitle, lastSavedAt, doAdvanceWeek } = useGameStore(
    useShallow((s) => ({
      state: s.state,
      doReset: s.doReset,
      returnToTitle: s.returnToTitle,
      lastSavedAt: s.lastSavedAt,
      doAdvanceWeek: s.doAdvanceWeek,
    }))
  );
  const { theme, setTheme } = useTheme();
  const moodIcon = MOOD_ICONS[state.crowdMood as keyof typeof MOOD_ICONS] ?? "😐";
  const [resetOpen, setResetOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [saveFlash, setSaveFlash] = useState(false);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted());

  const toggleMute = () => {
    const next = !isMuted;
    audioManager.setMuted(next);
    setIsMuted(next);
  };

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  // useCoachTip removed in favor of CoachOverlay
  useKeyboardShortcuts({ onToggleSidebar: toggleSidebar });
  useRivalryAlerts();

  useEffect(() => {
    const isOrphan = selectActiveWarriors(state).length < 3;
    if (isOrphan && location.pathname !== "/welcome") {
      if (typeof window !== "undefined") {
        window.location.href = "/welcome";
      }
    }
  }, [state.roster, location.pathname]);

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

  const activePath = location.pathname;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden text-foreground">
      {/* ─── Global Status Header ─── */}
      <header className="h-14 border-b border-border/60 bg-glass backdrop-blur-md z-50 flex items-center justify-between px-6 sticky top-0 flex-shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Swords className="h-5 w-5 text-background" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm tracking-tight leading-none uppercase group-hover:text-primary transition-colors">
                {state.player.stableName}
              </span>
              <span className="text-[10px] text-muted-foreground font-bold tracking-widest leading-none mt-1 uppercase">
                Est. Year {new Date(state.meta.createdAt).getFullYear()}
              </span>
            </div>
          </Link>

          <Separator orientation="vertical" className="h-6 bg-border/40" />

          <div className="hidden lg:flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Chronicle</span>
              <span className="text-xs font-mono font-bold">W{state.week} · {state.season}</span>
            </div>
            <div className="flex flex-col px-3 border-l border-border/20">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Treasury</span>
              <motion.span 
                key={state.gold}
                initial={{ scale: 1.2, color: "#facc15" }}
                animate={{ scale: 1, color: "var(--arena-gold)" }}
                className="text-xs font-mono font-bold"
              >
                ${state.gold}
              </motion.span>
            </div>
            <div className="flex flex-col px-3 border-l border-border/20">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Mood</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{moodIcon}</span>
                <span className="text-[10px] font-bold uppercase text-accent tracking-tighter">{state.crowdMood}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastSavedAt && (
             <div className={cn(
               "flex items-center gap-1.5 text-[10px] font-bold font-mono px-2 py-1 rounded bg-secondary/40 transition-colors",
               saveFlash ? "text-primary bg-primary/10 border border-primary/20" : "text-muted-foreground/60"
             )}>
               <Save className="h-3 w-3" />
               <span>{formatSaveTime(lastSavedAt)}</span>
             </div>
          )}
          
          <Separator orientation="vertical" className="h-6 bg-border/40 hidden sm:block" />

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setResetOpen(true)}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={returnToTitle}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* ─── Persistent Left Sidebar ─── */}
        <motion.aside 
          initial={false}
          animate={{ 
            width: sidebarOpen ? 256 : (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 80 : 0),
            marginLeft: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 0 : -256)
          }}
          className="border-r border-border/60 bg-secondary/10 flex flex-col z-40 relative overflow-hidden h-full"
        >
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 no-scrollbar">
            {NAV_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-2">
                <h3 className={cn(
                  "text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-3 mb-3",
                  !sidebarOpen && "lg:text-center lg:px-0"
                )}>
                  {sidebarOpen ? section.label : section.label[0]}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = activePath === item.to || (item.to !== "/" && activePath.startsWith(item.to));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                      >
                        <motion.div
                          whileHover={{ x: 4, backgroundColor: active ? "var(--primary)" : "rgba(255,255,255,0.05)" }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all group relative",
                            active 
                              ? "bg-primary text-background shadow-lg shadow-primary/20" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", active && "text-background")} />
                          <AnimatePresence>
                            {sidebarOpen && (
                              <motion.span 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="whitespace-nowrap uppercase tracking-wider"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {active && !sidebarOpen && (
                            <div className="absolute right-0 top-1 bottom-1 w-1 bg-background rounded-l-full" />
                          )}
                          {!sidebarOpen && (
                            <div className="lg:absolute lg:left-full lg:ml-4 lg:px-2 lg:py-1 lg:bg-popover lg:text-popover-foreground lg:text-[10px] lg:rounded lg:opacity-0 lg:group-hover:opacity-100 lg:transition-opacity lg:z-50 lg:pointer-events-none lg:shadow-xl lg:border lg:border-border lg:font-black lg:uppercase lg:tracking-widest whitespace-nowrap">
                              {item.label}
                            </div>
                          )}
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border/40">
             <Button 
               variant="ghost" 
               className="w-full justify-start gap-3 h-10 hover:bg-secondary/40 px-3"
               onClick={toggleSidebar}
             >
               <PanelLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
               <span className={cn("text-xs font-bold whitespace-nowrap", !sidebarOpen && "lg:hidden font-display uppercase tracking-widest text-[9px]")}>Collapse</span>
             </Button>
          </div>
        </motion.aside>

        {/* ─── Main Content Canvas ─── */}
        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
          <main className="flex-1 overflow-y-auto no-scrollbar relative">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            <div className="max-w-7xl mx-auto px-6 py-8 min-h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <footer className="h-10 border-t border-border/40 bg-background/50 backdrop-blur-sm px-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 flex-shrink-0">
            <div className="flex items-center gap-4">
              <span>SYSTEM_STABLE_V2.0</span>
              <Separator orientation="vertical" className="h-3 bg-border/20" />
              <span>S{state.season.toUpperCase()[0]}W{state.week}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 animate-pulse">
                <Activity className="h-3 w-3" /> HEARTBEAT_OK
              </span>
            </div>
          </footer>
        </div>

        {/* Global Event Log Sidebar */}
        <aside className={cn(
          "hidden xl:block border-l border-border/60 bg-secondary/5 transition-all duration-300 overflow-hidden",
          sidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 pointer-events-none"
        )}>
           <div className="h-full px-4 py-6 min-w-[20rem]">
              <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <ScrollText className="h-3.5 w-3.5" /> Event Chronicle
              </div>
              <div className="h-[calc(100%-2.5rem)]">
                 <EventLog />
              </div>
           </div>
        </aside>
      </div>

      {!state.isFTUE && (
        <div className="fixed bottom-8 right-8 z-[60]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              className={cn(
                 "h-16 px-10 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] font-display font-black text-xl tracking-tighter uppercase transition-all active:shadow-inner border-2 group relative overflow-hidden",
                 state.phase === "planning" 
                   ? "bg-arena-gold text-black border-arena-gold/50 hover:bg-arena-gold/90 shadow-arena-gold/20" 
                   : "bg-primary text-background border-primary/50 hover:bg-primary/90 shadow-primary/20"
              )}
              onClick={() => {
                if (state.phase === "planning") {
                  doAdvanceWeek();
                } else {
                  window.location.href = "/run-round";
                }
              }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {state.phase === "planning" ? (
                <>
                  Advance Cycle
                  <Zap className="ml-3 h-5 w-5 fill-current transition-transform group-hover:scale-125 group-hover:rotate-12" />
                </>
              ) : (
                <>
                  Resolve Bouts
                  <Swords className="ml-3 h-5 w-5 transition-transform group-hover:scale-125 group-hover:-rotate-12" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      )}

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <AlertDialogContent className="bg-glass-card border-neon">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-2xl tracking-tighter uppercase">Terminate Operation?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently delete the stable <span className="text-foreground font-bold font-display">"{state.player.stableName}"</span> and all associated chronicle data. This erasure is non-recoverable.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Retain Mission</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const slotId = getActiveSlot();
                  if (slotId) deleteSlot(slotId);
                  doReset();
                  setResetOpen(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold uppercase tracking-widest text-[10px]"
              >
                Confirm Termination
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </motion.div>
      </AlertDialog>
      <DeathModal />
      <CoachOverlay />
    </div>
  );
}
