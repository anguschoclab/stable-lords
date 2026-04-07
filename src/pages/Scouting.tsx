/**
 * Stable Lords — Scouting Page (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useState, useCallback, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { generateScoutReport, getScoutCost, type ScoutQuality } from "@/engine/scouting";
import { type ScoutReportData, type RivalStableData, type Warrior } from "@/types/game";
import { Search, Eye, ArrowLeftRight, UserRoundSearch, Shield, Users, Target, Hexagon } from "lucide-react";
import { SeededRNG } from "@/utils/random";
import { hashStr } from "@/utils/idUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Modular Components
import { ScoutIntelTab } from "@/components/scouting/ScoutIntelTab";
import { StableComparison } from "@/components/scouting/StableComparison";
import { WarriorComparison } from "@/components/scouting/WarriorComparison";

export default function Scouting() {
  const state = useGameStore();
  const setState = useGameStore((s) => s.setState);
  const [selectedRivalId, setSelectedRivalId] = useState<string | null>(null);
  const [selectedWarriorId, setSelectedWarriorId] = useState<string | null>(null);

  const rivals = useMemo(() => state.rivals ?? [], [state.rivals]);
  const reports = useMemo(() => state.scoutReports ?? [], [state.scoutReports]);

  const activeRival = useMemo(
    () => (state.rivals ?? []).find((r: RivalStableData) => r.owner.id === selectedRivalId),
    [state.rivals, selectedRivalId]
  );

  const activeWarrior = useMemo(
    () => activeRival?.roster.find((w: Warrior) => w.id === selectedWarriorId),
    [activeRival, selectedWarriorId]
  );

  const handleScout = useCallback(
    (quality: ScoutQuality) => {
      if (!activeWarrior) return;
      const cost = getScoutCost(quality);
      if ((state.treasury ?? 0) < cost) {
        toast.error(`Insufficient funds! Scouting requires ${cost}g.`);
        return;
      }

      const rng = new SeededRNG(state.week + hashStr(activeWarrior.name));
      const { report } = generateScoutReport(activeWarrior, quality, state.week, rng);
      
      // Ensure we don't have duplicate reports for the same warrior
      const newReports = [
        ...(state.scoutReports ?? []).filter((r: ScoutReportData) => r.warriorName !== activeWarrior.name),
        report as ScoutReportData,
      ];

      setState((draft: any) => {
        draft.scoutReports = newReports;
        draft.treasury = (state.treasury ?? 0) - cost;
        draft.ledger.push({
          week: state.week,
          label: `Intelligence: ${activeWarrior.name} (${quality})`,
          amount: -cost,
          category: "other",
        });
      });
      toast.success(`Intel established for ${activeWarrior.name}. (-${cost}g)`);
    },
    [state, setState, activeWarrior]
  );

  const handleSelectRival = useCallback((id: string) => {
    setSelectedRivalId(id);
    setSelectedWarriorId(null);
  }, []);

  const handleSelectWarrior = useCallback((id: string) => {
    setSelectedWarriorId(id);
  }, []);

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title="Tactical Reconnaissance"
        subtitle="SURVEILLANCE // THREAT_ANALYSIS // ENEMY_INTEL"
        icon={Search}
        actions={
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.34em] text-muted-foreground opacity-60">
             <span>Active Protocols: {reports.length}</span>
             <div className="h-4 w-px bg-border/40" />
             <span className="text-primary italic animate-pulse">Scanning Data Packets...</span>
          </div>
        }
      />

      <Tabs defaultValue="scout" className="w-full">
        <TabsList className="bg-neutral-900/60 border border-white/5 p-1 mb-6 h-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="scout" className="data-[state=active]:bg-primary data-[state=active]:text-white uppercase tracking-widest text-[10px] font-black py-2 px-6 rounded-none transition-all">
                <Eye className="h-3.5 w-3.5 mr-2" /> SCOUT_INTEL
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[10px] font-black uppercase tracking-widest">Establish target intel</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="compare" className="data-[state=active]:bg-primary data-[state=active]:text-white uppercase tracking-widest text-[10px] font-black py-2 px-6 rounded-none transition-all">
                <ArrowLeftRight className="h-3.5 w-3.5 mr-2" /> STABLE_DYNAMICS
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[10px] font-black uppercase tracking-widest">Compare stable performance</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="warriors" className="data-[state=active]:bg-primary data-[state=active]:text-white uppercase tracking-widest text-[10px] font-black py-2 px-6 rounded-none transition-all">
                <UserRoundSearch className="h-3.5 w-3.5 mr-2" /> WARRIOR_FACE-OFF
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[10px] font-black uppercase tracking-widest">In-depth warrior comparison</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <TabsContent value="scout" className="mt-6">
          <ScoutIntelTab
            rivals={rivals}
            reports={reports}
            selectedRivalId={selectedRivalId}
            onSelectRival={handleSelectRival}
            selectedWarriorId={selectedWarriorId}
            onSelectWarrior={handleSelectWarrior}
            gold={state.treasury ?? 0}
            onScout={handleScout}
          />
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          <StableComparison rivals={rivals} />
        </TabsContent>

        <TabsContent value="warriors" className="mt-6">
          <WarriorComparison rivals={rivals} playerRoster={state.roster} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
