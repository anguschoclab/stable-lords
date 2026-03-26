import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Swords, LayoutDashboard, Zap, Trophy, HelpCircle, RotateCcw, ScrollText, UserPlus, Skull, GraduationCap, LogOut, PanelLeftClose, PanelLeft, Save, Download, Dumbbell, Sun, Moon, Search, Globe, Newspaper, Crown, Shield, BarChart3, Target, Award, BookOpen, Eye, Landmark, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/state/useGameStore";
import { Badge } from "@/components/ui/badge";
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

import { useCoachTip } from "@/hooks/useCoachTip";
import { getActiveSlot, deleteSlot, exportActiveSlot } from "@/state/saveSlots";
import EventLog from "@/components/EventLog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRivalryAlerts } from "@/hooks/useRivalryAlerts";

const pillars = [
  { id: "hub", label: "Hub", to: "/", icon: LayoutDashboard },
  { id: "stable", label: "Stable", to: "/stable", icon: Shield },
  { id: "world", label: "World", to: "/world", icon: Globe },
  { id: "legacy", label: "Legacy", to: "/legacy", icon: Skull },
];

const subNavItems: Record<string, { to: string; label: string; icon: any }[]> = {
  hub: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/run-round", label: "Run Round", icon: Zap },
  ],
  stable: [
    { to: "/stable", label: "Roster", icon: Users },
    { to: "/stable/training", label: "Training", icon: Dumbbell },
    { to: "/stable/recruit", label: "Recruit", icon: UserPlus },
    { to: "/stable/equipment", label: "Gear", icon: Shield },
    { to: "/stable/planner", label: "Planner", icon: BarChart3 },
    { to: "/stable/trainers", label: "Trainers", icon: GraduationCap },
    { to: "/stable/finance", label: "Finance", icon: BookOpen },
  ],
  world: [
    { to: "/world", label: "Overview", icon: Globe },
    { to: "/world/tournaments", label: "Tournaments", icon: Trophy },
    { to: "/world/scouting", label: "Scouting", icon: Search },
    { to: "/world/gazette", label: "Gazette", icon: Newspaper },
    { to: "/world/history", label: "Chronicle", icon: ScrollText },
  ],
  legacy: [
    { to: "/legacy", label: "Graveyard", icon: Skull },
    { to: "/legacy/hall-of-fame", label: "Hall of Fame", icon: Crown },
    { to: "/legacy/analytics", label: "Kill Stats", icon: Target },
    { to: "/legacy/awards", label: "Awards", icon: Award },
  ],
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { state, doReset, returnToTitle, lastSavedAt, doAdvanceWeek } = useGameStore();
  const { theme, setTheme } = useTheme();
  const moodIcon = MOOD_ICONS[state.crowdMood as keyof typeof MOOD_ICONS] ?? "😐";
  const [resetOpen, setResetOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [saveFlash, setSaveFlash] = useState(false);

  // Determine active pillar based on path
  const activePillar = pillars.find(p =>
    p.to === "/" ? location.pathname === "/" || location.pathname === "/run-round" : location.pathname.startsWith(p.to)
  )?.id || "hub";

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  useCoachTip(location.pathname);
  useKeyboardShortcuts({ onToggleSidebar: toggleSidebar });
  useRivalryAlerts();

  // FTUE / Orphanage Redirection logic
  useEffect(() => {
    const isOrphan = state.roster.filter(w => w.status === "Active").length < 3;
    if (isOrphan && location.pathname !== "/welcome") {
      if (typeof window !== "undefined") {
        // Use a soft redirect if possible, but window.location works for forcing state
        window.location.href = "/welcome";
      }
    }
  }, [state.roster, location.pathname]);

  // Flash the save indicator briefly when a save occurs
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── Top Nav Bar ─── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center justify-between px-4">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-1">
            <Link to="/" className="flex items-center gap-2 mr-4">
              <Swords className="h-5 w-5 text-arena-gold" />
              <span className="font-display font-bold text-base tracking-wide hidden sm:inline">
                Stable Lords
              </span>
            </Link>

            {/* Toggle sidebar on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-muted-foreground"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>

            <nav className="hidden md:flex items-center gap-1">
              {!state.isFTUE && pillars.map((pillar) => {
                const Icon = pillar.icon;
                const active = activePillar === pillar.id;
                return (
                  <Link
                    key={pillar.id}
                    to={pillar.to}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {pillar.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Auto-save indicator */}
            {lastSavedAt && (
              <div
                className={cn(
                  "hidden sm:flex items-center gap-1 text-[10px] font-mono transition-colors duration-500",
                  saveFlash ? "text-arena-pop" : "text-muted-foreground/50"
                )}
                title={`Last saved: ${new Date(lastSavedAt).toLocaleString()}`}
              >
                <Save className={cn("h-3 w-3 transition-transform duration-300", saveFlash && "scale-110")} />
                <span>{formatSaveTime(lastSavedAt)}</span>
              </div>
            )}
            <Badge variant="outline" className="text-[11px] font-mono text-muted-foreground gap-1 hidden sm:flex">
              {moodIcon} Wk {state.week} · {state.season}
            </Badge>
            <Badge variant="outline" className="text-[11px] font-mono text-muted-foreground gap-1 sm:hidden">
              {moodIcon} W{state.week}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={exportActiveSlot}
              title="Export Save"
              aria-label="Export Save"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
              aria-label="Toggle theme"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={returnToTitle}
              title="Return to Title Screen"
              aria-label="Return to Title Screen"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setResetOpen(true)}
              title="Delete Save"
              aria-label="Delete Save"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">Delete This Save?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{state.player.stableName}" and all its warriors, fight history, and tournament progress. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const slotId = getActiveSlot();
                      if (slotId) deleteSlot(slotId);
                      doReset();
                      setResetOpen(false);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Save
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* ─── Sticky Sub-Nav ─── */}
        {!state.isFTUE && subNavItems[activePillar] && (
          <div className="border-t border-border/40 bg-muted/30 px-4 py-1 flex items-center gap-4 overflow-x-auto no-scrollbar">
            {subNavItems[activePillar].map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                    active
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Mobile nav row */}
        <nav className="md:hidden border-t border-border/50 flex gap-0.5 px-2 py-1.5 overflow-x-auto">
          {!state.isFTUE && pillars.map((item) => {
            const Icon = item.icon;
            const active = activePillar === item.id;
            return (
              <Link
                key={item.id}
                to={item.to}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary/40"
                )}
              >
                <Icon className="h-3 w-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ─── Body: Sidebar + Main ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Event Log Sidebar */}
        {/* Mobile overlay sidebar */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={cn(
            "border-r border-border bg-background flex-shrink-0 transition-all duration-200 overflow-hidden z-40",
            "md:relative md:z-auto",
            sidebarOpen
              ? "fixed inset-y-0 left-0 w-72 md:static md:w-64 lg:w-72"
              : "w-0"
          )}
        >
          <div className="h-full md:h-[calc(100vh-3rem)] md:sticky md:top-12">
            <EventLog />
          </div>
        </aside>

        {/* Sidebar toggle (desktop) */}
        <div className="hidden md:flex flex-col">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 m-1 text-muted-foreground hover:text-foreground"
            onClick={toggleSidebar}
            title={sidebarOpen ? "Hide event log" : "Show event log"}
            aria-label={sidebarOpen ? "Hide event log" : "Show event log"}
          >
            {sidebarOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeft className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-3 flex-shrink-0 bg-muted/20">
        <div className="px-4 sm:px-6 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Stable Lords v2.0 // SIMULATION_ACTIVE
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              PROMPT_ENGINE: READY
            </span>
          </div>
        </div>
      </footer>

      {/* ─── Persistent Continue Button ─── */}
      {!state.isFTUE && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className={cn(
               "h-14 px-8 rounded-full shadow-2xl font-display font-black text-lg tracking-tighter uppercase transition-all hover:scale-105 active:scale-95 group",
               state.phase === "planning" ? "bg-arena-gold text-black hover:bg-arena-gold/90" : "bg-primary text-primary-foreground"
            )}
            onClick={() => {
              if (state.phase === "planning") {
                doAdvanceWeek();
              } else {
                // Resolution phase navigation
                window.location.href = "/run-round";
              }
            }}
          >
            {state.phase === "planning" ? (
              <>
                Advance Week
                <Zap className="ml-2 h-5 w-5 fill-current group-hover:animate-pulse" />
              </>
            ) : (
              <>
                Go to Bouts
                <Swords className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
