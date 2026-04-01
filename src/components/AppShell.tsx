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
  Eye, Landmark, Settings, Users, Activity, Volume2, VolumeX,
  Coins
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  useKeyboardShortcuts({ onToggleSidebar: toggleSidebar });
  useRivalryAlerts();

  useEffect(() => {
    const isOrphan = selectActiveWarriors(state).length < 3;
    if (isOrphan && location.pathname !== "/welcome" && location.pathname !== "/start") {
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
    <div className="min-h-screen bg-[#050506] flex flex-col overflow-hidden text-foreground selection:bg-primary/30">
      {/* ─── Global Status Header ─── */}
      <header className="h-14 border-b border-white/5 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-between px-6 sticky top-0 flex-shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group active:scale-95 transition-transform">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)] border border-white/10"
            >
              <Swords className="h-5 w-5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">Stable Lords</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">ALPHA_DISTRICT_412</span>
            </div>
          </Link>

          <Separator orientation="vertical" className="h-6 bg-white/5" />

          <div className="hidden lg:flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Arena Week</span>
              <span className="font-mono font-black text-xs text-foreground bg-white/5 px-2 py-0.5 rounded border border-white/5">{state.week}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Treasury</span>
              <span className="font-mono font-black text-xs text-arena-gold flex items-center gap-1">
                {(state.gold ?? 0).toLocaleString()} <Coins className="h-3 w-3 opacity-60" />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Influence</span>
              <span className="font-mono font-black text-xs text-arena-fame flex items-center gap-1">
                {state.fame} <Crown className="h-3 w-3 opacity-60" />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Crowd Mood</span>
              <span className="font-mono font-black text-xs text-arena-pop flex items-center gap-1">
                {moodIcon} <Activity className="h-3 w-3 opacity-60" />
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-white/5 transition-colors"
                onClick={toggleMute}
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
                  "h-9 w-9 rounded-lg transition-all",
                  saveFlash ? "bg-primary/20 text-primary scale-110" : "hover:bg-white/5"
                )}
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
                className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => setResetOpen(true)}
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
                className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={returnToTitle}
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

      <div className="flex-1 flex overflow-hidden relative">
        {/* ─── Persistent Sidebar ─── */}
        <aside 
          className={cn(
            "border-r border-white/5 bg-[#080809] flex flex-col transition-all duration-500 ease-in-out z-40 group",
            sidebarOpen ? "w-64" : "w-16"
          )}
        >
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            {sidebarOpen && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-3 opacity-40">Main Sequence</span>}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar} 
              className={cn("h-8 w-8 hover:bg-white/5", !sidebarOpen && "mx-auto")}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 space-y-8 scrollbar-hide">
            {NAV_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-2">
                {sidebarOpen && <h4 className="px-6 text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">{section.label}</h4>}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = activePath === item.to || (item.to !== "/" && activePath.startsWith(item.to));
                    return (
                      <Tooltip key={item.to} delayDuration={sidebarOpen ? 1000 : 0}>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.to as any}
                            className={cn(
                              "flex items-center gap-3 px-6 py-2.5 text-sm font-semibold transition-all relative group h-10",
                              isActive 
                                ? "text-primary bg-primary/5" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                          >
                            {isActive && <motion.div layoutId="nav-glow" className="absolute inset-y-0 left-0 w-1 bg-primary shadow-[0_0_10px_rgba(255,0,0,0.8)]" />}
                            <item.icon className={cn("h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                            {sidebarOpen && <span className="truncate">{item.label}</span>}
                          </Link>
                        </TooltipTrigger>
                        {!sidebarOpen && (
                          <TooltipContent side="right" className="text-[10px] font-black uppercase tracking-widest font-mono">
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <Button 
              onClick={() => doAdvanceWeek()}
              className={cn(
                "w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-widest shadow-[0_0_20px_rgba(255,0,0,0.3)] border border-white/10",
                !sidebarOpen && "p-0"
              )}
            >
              <RotateCcw className={cn("h-4 w-4", sidebarOpen && "mr-2")} />
              {sidebarOpen && "End Week Sequence"}
            </Button>
          </div>
        </aside>

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

          <EventLog />
          <CoachOverlay />
        </main>
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
                const currentSlot = getActiveSlot();
                if (currentSlot) deleteSlot(currentSlot.id);
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
