/**
 * Stable Lords — Scouting Page (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import { useState, useCallback, useMemo } from "react";
import { useGameStore, type GameStore } from "@/state/useGameStore";
import { generateScoutReport, getScoutCost, type ScoutQuality } from "@/engine/scouting";
import { type ScoutReportData, type RivalStableData, type Warrior } from "@/types/game";
import { Search, Eye, ArrowLeftRight, UserRoundSearch } from "lucide-react";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { hashStr } from "@/utils/random";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";

// Modular Components
import { ScoutIntelTab } from "@/components/scouting/ScoutIntelTab";
import { StableComparison } from "@/components/scouting/StableComparison";
import { WarriorComparison } from "@/components/scouting/WarriorComparison";
import { ReputationQuadrant } from "@/components/charts/ReputationQuadrant";

export default function Scouting() {
  const { treasury, week, rivals, scoutReports, roster, setState } = useGameStore();
  const [selectedRivalId, setSelectedRivalId] = useState<string | null>(null);
  const [selectedWarriorId, setSelectedWarriorId] = useState<string | null>(null);

  const activeRival = useMemo(
    () => (rivals ?? []).find((r: RivalStableData) => r.owner.id === selectedRivalId),
    [rivals, selectedRivalId]
  );

  const activeWarrior = useMemo(
    () => activeRival?.roster.find((w: Warrior) => w.id === selectedWarriorId),
    [activeRival, selectedWarriorId]
  );

  const handleScout = useCallback(
    (quality: ScoutQuality) => {
      if (!activeWarrior) return;
      const cost = getScoutCost(quality);
      if ((treasury ?? 0) < cost) {
        toast.error(`Insufficient funds! Scouting requires ${cost}g.`);
        return;
      }

      const rng = new SeededRNGService(week + hashStr(activeWarrior.name));
      const { report } = generateScoutReport(activeWarrior, quality, week, rng);
      
      // Ensure we don't have duplicate reports for the same warrior
      const newReports = [
        ...(scoutReports ?? []).filter((r: ScoutReportData) => r.warriorName !== activeWarrior.name),
        report as ScoutReportData,
      ];

      setState((draft: GameStore) => {
        draft.scoutReports = newReports;
        draft.treasury = (treasury ?? 0) - cost;
        draft.ledger.push({
          id: String(hashStr(`${week}-${activeWarrior.name}-${quality}`)),
          week: week,
          label: `Intelligence: ${activeWarrior.name} (${quality})`,
          amount: -cost,
          category: "other",
        });
      });
      toast.success(`Intel established for ${activeWarrior.name}. (-${cost}g)`);
    },
    [treasury, week, scoutReports, setState, activeWarrior]
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
        subtitle="WORLD · INTELLIGENCE · THREAT ANALYSIS"
        icon={Search}
        actions={
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.34em] text-muted-foreground opacity-60">
             <span>Active Protocols: {scoutReports?.length || 0}</span>
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
                <Eye className="h-3.5 w-3.5 mr-2" /> SCOUT INTEL
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[10px] font-black uppercase tracking-widest">Establish target intel</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="compare" className="data-[state=active]:bg-primary data-[state=active]:text-white uppercase tracking-widest text-[10px] font-black py-2 px-6 rounded-none transition-all">
                <ArrowLeftRight className="h-3.5 w-3.5 mr-2" /> STABLE DYNAMICS
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[10px] font-black uppercase tracking-widest">Compare stable performance</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="warriors" className="data-[state=active]:bg-primary data-[state=active]:text-white uppercase tracking-widest text-[10px] font-black py-2 px-6 rounded-none transition-all">
                <UserRoundSearch className="h-3.5 w-3.5 mr-2" /> WARRIOR FACE-OFF
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[10px] font-black uppercase tracking-widest">In-depth warrior comparison</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <TabsContent value="scout" className="mt-6">
          <ScoutIntelTab
            rivals={rivals ?? []}
            reports={scoutReports ?? []}
            selectedRivalId={selectedRivalId}
            onSelectRival={handleSelectRival}
            selectedWarriorId={selectedWarriorId}
            onSelectWarrior={handleSelectWarrior}
            treasury={treasury ?? 0}
            onScout={handleScout}
          />
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StableComparison rivals={rivals} />
            </div>
            <ReputationQuadrant />
          </div>
        </TabsContent>

        <TabsContent value="warriors" className="mt-6">
          <WarriorComparison rivals={rivals ?? []} playerRoster={roster} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
