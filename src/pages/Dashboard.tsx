/**
 * Stable Lords — Arena Hub
 * Modular dashboard with draggable widgets.
 */
import React, { useMemo, useState, useCallback } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Button } from "@/components/ui/button";
import { GripVertical, RotateCcw } from "lucide-react";
import { loadUIPrefs, saveUIPrefs } from "@/state/uiPrefs";
import { cn } from "@/lib/utils";

// Extracted Widgets
import { SeasonWidget } from "@/components/dashboard/SeasonWidget";
import { StableWidget } from "@/components/dashboard/StableWidget";
import { RankingsWidget } from "@/components/dashboard/RankingsWidget";
import { FinancesWidget } from "@/components/dashboard/FinancesWidget";
import { MetaPulseWidget } from "@/components/dashboard/MetaPulseWidget";
import { GazetteWidget } from "@/components/dashboard/GazetteWidget";
import { RecentBoutsWidget } from "@/components/dashboard/RecentBoutsWidget";
import { TrainingWidget } from "@/components/dashboard/TrainingWidget";
import { RivalsListWidget } from "@/components/dashboard/RivalsListWidget";
import { RivalryWidget } from "@/components/dashboard/RivalryWidget";
import { StableComparisonWidget } from "@/components/dashboard/StableComparisonWidget";
import { CrowdMoodWidget } from "@/components/widgets/CrowdMoodWidget";

// ─── Widget Registry ───────────────────────────────────────────────────────

type WidgetDef = {
  id: string;
  label: string;
  wide?: boolean; // spans 2 columns
  component: React.FC;
};

// Memoize all widgets to prevent unnecessary re-renders from context changes
const MemoSeasonWidget = React.memo(SeasonWidget);
const MemoStableWidget = React.memo(StableWidget);
const MemoFinancesWidget = React.memo(FinancesWidget);
const MemoTrainingWidget = React.memo(TrainingWidget);
const MemoRivalsWidget = React.memo(RivalsListWidget);
const MemoRivalryWidget = React.memo(RivalryWidget);
const MemoRankingsWidget = React.memo(RankingsWidget);
const MemoMetaPulseWidget = React.memo(MetaPulseWidget);
const MemoRecentBoutsWidget = React.memo(RecentBoutsWidget);
const MemoGazetteWidget = React.memo(GazetteWidget);
const MemoCrowdMoodWidget = React.memo(CrowdMoodWidget);
const MemoStableComparisonWidget = React.memo(StableComparisonWidget);

const WIDGET_REGISTRY: WidgetDef[] = [
  { id: "season",   label: "Season & Schedule", component: MemoSeasonWidget },
  { id: "stable",   label: "Stable Overview",   component: MemoStableWidget },
  { id: "crowd",    label: "Crowd Mood",         component: MemoCrowdMoodWidget },
  { id: "finances", label: "Finances",           component: MemoFinancesWidget },
  { id: "training", label: "Training Status",    component: MemoTrainingWidget },
  { id: "rivals",    label: "Rival Stables",      component: MemoRivalsWidget },
  { id: "stableCompare", label: "Stable Comparison", component: MemoStableComparisonWidget, wide: true },
  { id: "rivalries", label: "Rivalries",          component: MemoRivalryWidget, wide: true },
  { id: "rankings", label: "Warrior Rankings",   component: MemoRankingsWidget, wide: true },
  { id: "meta",     label: "Meta Pulse",         component: MemoMetaPulseWidget },
  { id: "bouts",    label: "Recent Bouts",       component: MemoRecentBoutsWidget, wide: true },
  { id: "gazette",  label: "Arena Gazette",       component: MemoGazetteWidget, wide: true },
];

const DEFAULT_ORDER = WIDGET_REGISTRY.map(w => w.id);

// ─── Drag & Drop Hook ─────────────────────────────────────────────────────

function useDraggableWidgets() {
  const prefs = loadUIPrefs();
  const savedOrder = prefs.dashboardLayout ?? DEFAULT_ORDER;
  
  // Ensure all widgets are present
  const validIds = new Set(DEFAULT_ORDER);
  const savedOrderSet = new Set(savedOrder);
  const order = [
    ...savedOrder.filter(id => validIds.has(id)),
    ...DEFAULT_ORDER.filter(id => !savedOrderSet.has(id)),
  ];

  const [widgetOrder, setWidgetOrder] = useState(order);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  }, []);

  const handleDrop = useCallback((idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setWidgetOrder(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      // Persist
      const prefs = loadUIPrefs();
      saveUIPrefs({ ...prefs, dashboardLayout: next });
      return next;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }, [dragIdx]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOverIdx(null);
  }, []);

  const resetLayout = useCallback(() => {
    setWidgetOrder(DEFAULT_ORDER);
    const prefs = loadUIPrefs();
    saveUIPrefs({ ...prefs, dashboardLayout: DEFAULT_ORDER });
  }, []);

  return {
    widgetOrder,
    dragIdx,
    dragOverIdx,
    isEditing,
    setIsEditing,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    resetLayout,
  };
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

export default function Dashboard() {
  const { state } = useGameStore();
  const {
    widgetOrder, dragIdx, dragOverIdx, isEditing, setIsEditing,
    handleDragStart, handleDragOver, handleDrop, handleDragEnd, resetLayout,
  } = useDraggableWidgets();

  const widgetMap = useMemo(
    () => new Map(WIDGET_REGISTRY.map(w => [w.id, w])),
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50">
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold tracking-wide flex items-center gap-2 text-foreground">
            Arena Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, <span className="text-foreground font-medium">{state.player.name}</span> of <span className="text-primary font-bold">{state.player.stableName}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm bg-background/50 px-4 py-2 rounded-lg border border-border/40 shrink-0 shadow-inner">
           <div className="flex items-center gap-2 border-r border-border/50 pr-4">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Gold</span>
              <span className="font-mono text-arena-gold font-bold">{Math.round(state.gold).toLocaleString()} G</span>
           </div>
           <div className="flex items-center gap-2 border-r border-border/50 pr-4">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Fame</span>
              <span className="font-mono text-arena-fame font-bold">{Math.round(state.fame).toLocaleString()}</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Pop</span>
              <span className="font-mono text-arena-pop font-bold">{Math.round(state.popularity)}%</span>
           </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditing && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={resetLayout}>
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          )}
          <Button
            variant={isEditing ? "default" : "secondary"}
            size="sm"
            className={cn("text-xs gap-1 transition-colors shadow-sm", isEditing && "bg-primary text-primary-foreground")}
            onClick={() => setIsEditing(v => !v)}
          >
            <GripVertical className="h-3 w-3" />
            {isEditing ? "Done" : "Customize"}
          </Button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid gap-4 md:grid-cols-3 auto-rows-min">
        {widgetOrder.map((id, idx) => {
          const def = widgetMap.get(id);
          if (!def) return null;
          const Widget = def.component;
          const isDragging = dragIdx === idx;
          const isDragOver = dragOverIdx === idx && dragIdx !== idx;

          return (
            <div
              key={id}
              draggable={isEditing}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                "transition-all duration-200",
                def.wide && "md:col-span-2",
                isEditing && "cursor-grab active:cursor-grabbing",
                isDragging && "opacity-40 scale-[0.97]",
                isDragOver && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background rounded-xl",
              )}
            >
              {isEditing && (
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted-foreground">
                  <GripVertical className="h-3 w-3" />
                  <span className="uppercase tracking-wider font-medium">{def.label}</span>
                </div>
              )}
              <Widget />
            </div>
          );
        })}
      </div>
    </div>
  );
}
