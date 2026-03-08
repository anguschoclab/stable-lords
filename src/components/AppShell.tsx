import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Swords, LayoutDashboard, Zap, Trophy, HelpCircle, RotateCcw, ScrollText, UserPlus, Skull, GraduationCap, LogOut } from "lucide-react";
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

const navItems = [
  { to: "/", label: "Arena Hub", icon: LayoutDashboard },
  { to: "/run-round", label: "Run Round", icon: Zap },
  { to: "/recruit", label: "Recruit", icon: UserPlus },
  { to: "/trainers", label: "Trainers", icon: GraduationCap },
  { to: "/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/hall-of-fights", label: "Chronicle", icon: ScrollText },
  { to: "/graveyard", label: "Hall of Warriors", icon: Skull },
  { to: "/help", label: "Help", icon: HelpCircle },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { state, doReset, returnToTitle } = useGame();
  const moodIcon = MOOD_ICONS[state.crowdMood as keyof typeof MOOD_ICONS] ?? "😐";
  const [resetOpen, setResetOpen] = useState(false);

  // Fire coach tips based on current route
  useCoachTip(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-arena-gold" />
              <span className="font-display font-bold text-lg tracking-wide">
                Stable Lords
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-mono text-muted-foreground gap-1">
              {moodIcon} Wk {state.week} · {state.season}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={returnToTitle}
              title="Return to Title Screen"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setResetOpen(true)}
              title="Delete Save"
              className="text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="h-4 w-4" />
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
                      // Delete the current slot then return to title
                      const { getActiveSlot, deleteSlot } = require("@/state/saveSlots");
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
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex gap-1 py-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="container text-xs text-muted-foreground">
          Stable Lords v2.0 — Local save only
        </div>
      </footer>
    </div>
  );
}
