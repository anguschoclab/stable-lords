import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Swords, LayoutDashboard, Zap, Trophy, HelpCircle, RotateCcw, ScrollText, UserPlus, Skull, GraduationCap, LogOut, PanelLeftClose, PanelLeft, Save, Download, Dumbbell, Sun, Moon, Search, Globe, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/state/GameContext";
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

const navItems = [
  { to: "/", label: "Hub", icon: LayoutDashboard },
  { to: "/run-round", label: "Run Round", icon: Zap },
  { to: "/recruit", label: "Recruit", icon: UserPlus },
  { to: "/training", label: "Training", icon: Dumbbell },
  { to: "/scouting", label: "Scouting", icon: Search },
  { to: "/trainers", label: "Trainers", icon: GraduationCap },
  { to: "/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/world", label: "World", icon: Globe },
  { to: "/hall-of-fights", label: "Chronicle", icon: ScrollText },
  { to: "/graveyard", label: "Hall of Warriors", icon: Skull },
  { to: "/help", label: "Help", icon: HelpCircle },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { state, doReset, returnToTitle, lastSavedAt } = useGame();
  const { theme, setTheme } = useTheme();
  const moodIcon = MOOD_ICONS[state.crowdMood as keyof typeof MOOD_ICONS] ?? "😐";
  const [resetOpen, setResetOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [saveFlash, setSaveFlash] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  useCoachTip(location.pathname);
  useKeyboardShortcuts({ onToggleSidebar: toggleSidebar });

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
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>

            <nav className="hidden md:flex items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
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
              className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={returnToTitle}
              title="Return to Title Screen"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setResetOpen(true)}
              title="Delete Save"
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

        {/* Mobile nav row */}
        <nav className="md:hidden border-t border-border/50 flex gap-0.5 px-2 py-1.5 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-secondary text-foreground"
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
      <footer className="border-t border-border py-3 flex-shrink-0">
        <div className="px-4 sm:px-6 text-xs text-muted-foreground">
          Stable Lords v2.0 — Local save only
        </div>
      </footer>
    </div>
  );
}
