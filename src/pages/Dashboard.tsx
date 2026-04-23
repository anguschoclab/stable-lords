/**
 * Stable Lords — Arena Hub
 * Modular dashboard with draggable widgets.
 */
import React, { useMemo, useState, useCallback } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Button } from "@/components/ui/button";
import { GripVertical, RotateCcw, LayoutDashboard } from "lucide-react";
import { loadUIPrefs, saveUIPrefs } from "@/state/uiPrefs";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { EditableText } from "@/components/ui/EditableText";

// Extracted Widgets
import { SeasonWidget } from "@/components/dashboard/SeasonWidget";
import { StableWidget } from "@/components/dashboard/StableWidget";
import { RankingsWidget } from "@/components/dashboard/RankingsWidget";
import { FinancesWidget } from "@/components/dashboard/FinancesWidget";
import { MetaPulseWidget } from "@/components/dashboard/MetaPulseWidget";
import { RecentBoutsWidget } from "@/components/dashboard/RecentBoutsWidget";
import { TrainingWidget } from "@/components/dashboard/TrainingWidget";
import { RivalsListWidget } from "@/components/dashboard/RivalsListWidget";
import { RivalryWidget } from "@/components/dashboard/RivalryWidget";
import { StableComparisonWidget } from "@/components/dashboard/StableComparisonWidget";
import { StableStrategyWidget } from "@/components/dashboard/StableStrategyWidget";
import { CrowdMoodWidget } from "@/components/widgets/CrowdMoodWidget";
import { MedicalAuditWidget } from "@/components/dashboard/MedicalAuditWidget";
import { IntelligenceHubWidget } from "@/components/dashboard/IntelligenceHubWidget";
import BubbleWatchWidget from "@/components/widgets/BubbleWatchWidget";
import EventLog from "@/components/EventLog";
import { NextBoutWidget } from "@/components/widgets/NextBoutWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";

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
const MemoCrowdMoodWidget = React.memo(CrowdMoodWidget);
const MemoStableComparisonWidget = React.memo(StableComparisonWidget);
const MemoStableStrategyWidget = React.memo(StableStrategyWidget);
const MemoMedicalAuditWidget = React.memo(MedicalAuditWidget);
const MemoIntelligenceHubWidget = React.memo(IntelligenceHubWidget);
const MemoBubbleWatchWidget = React.memo(BubbleWatchWidget);
const MemoEventLog = React.memo(EventLog);
const MemoNextBoutWidget = React.memo(NextBoutWidget);
const MemoWeatherWidget = React.memo(WeatherWidget);

const WIDGET_REGISTRY: WidgetDef[] = [
  { id: "season",   label: "SEASON & SCHEDULE", component: MemoSeasonWidget },
  { id: "stable",   label: "STABLE OVERVIEW",   component: MemoStableWidget },
  { id: "crowd",    label: "CROWD MOOD",         component: MemoCrowdMoodWidget },
  { id: "finances", label: "FINANCES",           component: MemoFinancesWidget },
  { id: "training", label: "TRAINING STATUS",    component: MemoTrainingWidget },
  { id: "rivals",    label: "RIVAL STABLES",      component: MemoRivalsWidget },
  { id: "stableCompare", label: "STABLE COMPARISON", component: MemoStableComparisonWidget, wide: true },
  { id: "strategy", label: "STABLE STRATEGY",    component: MemoStableStrategyWidget },
  { id: "bubbleWatch", label: "TOURNAMENT BUBBLE WATCH", component: MemoBubbleWatchWidget },
  { id: "rivalries", label: "RIVALRIES",          component: MemoRivalryWidget, wide: true },
  { id: "rankings", label: "WARRIOR RANKINGS",   component: MemoRankingsWidget, wide: true },
  { id: "intel",    label: "INTELLIGENCE HUB",   component: MemoIntelligenceHubWidget, wide: true },
  { id: "medical",   label: "MEDICAL AUDIT",     component: MemoMedicalAuditWidget },
  { id: "meta",     label: "META PULSE",         component: MemoMetaPulseWidget },
  { id: "bouts",    label: "RECENT BOUTS",       component: MemoRecentBoutsWidget, wide: true },
  { id: "eventLog", label: "EVENT LOG",          component: MemoEventLog, wide: true },
  { id: "nextBout", label: "NEXT BOUT",          component: MemoNextBoutWidget },
  { id: "weather",  label: "WEATHER",            component: MemoWeatherWidget },
];

const DEFAULT_ORDER = [
  "season", "stable", "weather", "crowd", "finances", "training",
  "rivals", "stableCompare", "strategy", "bubbleWatch", "rivalries",
  "rankings", "intel", "medical", "meta", "bouts", "eventLog", "nextBout"
];

// ─── Drag & Drop Hook ─────────────────────────────────────────────────────

function useDraggableWidgets() {
  const prefs = loadUIPrefs() as any;
  const savedOrder = prefs?.dashboardLayout ?? DEFAULT_ORDER;
  
  // Ensure all widgets are present
  const validIds = new Set(DEFAULT_ORDER);
  const savedOrderSet = new Set(savedOrder);
  const order = [
    ...savedOrder.filter((id: string) => validIds.has(id)),
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
  // Destructure top-level properties from useGameStore. No 'state.' prefix.
  const { treasury, fame, player, renameStable, renamePlayer } = useGameStore();

  const {
    widgetOrder, dragIdx, dragOverIdx, isEditing, setIsEditing,
    handleDragStart, handleDragOver, handleDrop, handleDragEnd, resetLayout,
  } = useDraggableWidgets();

  const widgetMap = useMemo(
    () => new Map(WIDGET_REGISTRY.map(w => [w.id, w])),
    []
  );

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <PageHeader 
        title={<EditableText value={player.stableName} onSave={renameStable} className="text-4xl font-black tracking-tighter text-foreground sm:text-6xl font-display uppercase" />}
        subtitle={
          <div className="flex items-center gap-2 text-muted-foreground font-black uppercase text-[10px] tracking-[0.2em] opacity-60">
            <span>By</span>
            <EditableText value={player.name} onSave={renamePlayer} className="text-primary/80" />
            <span>• COMMAND CENTER</span>
          </div>
        }
        icon={LayoutDashboard}
        actions={
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-4 text-sm bg-neutral-900/40 backdrop-blur-md px-4 py-2 rounded-none border border-white/5 shrink-0 shadow-inner">
               <div className="flex items-center gap-2 border-r border-white/5 pr-4">
                  <span className="text-muted-foreground text-[9px] uppercase tracking-widest font-black opacity-60">GOLD</span>
                  <span className="font-mono text-arena-gold font-black">{Math.round(treasury).toLocaleString()}G</span>
               </div>
               <div className="flex items-center gap-2 border-r border-white/5 pr-4">
                  <span className="text-muted-foreground text-[9px] uppercase tracking-widest font-black opacity-60">FAME</span>
                  <span className="font-mono text-arena-fame font-black">{Math.round(fame).toLocaleString()}</span>
               </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isEditing && (
                <Button
                  className="text-[10px] font-black uppercase tracking-widest gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all h-9 px-3 text-xs"
                  onClick={resetLayout}
                >
                  <RotateCcw className="h-3 w-3" /> RESET
                </Button>
              )}
              <Button
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest gap-2 transition-all shadow-lg h-9 px-3 text-xs",
                  isEditing ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]" : "bg-neutral-900/60 border border-white/5"
                )}
                onClick={() => setIsEditing(v => !v)}
              >
                <GripVertical className="h-3 w-3" />
                {isEditing ? "REGISTRY CLOSED" : "MODIFY LAYOUT"}
              </Button>
            </div>
          </div>
        }
      />

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
                isDragOver && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background rounded-none",
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
