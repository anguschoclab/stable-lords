import React, { useMemo } from "react";
import { Search, Eye, Target, Activity } from "lucide-react";
import type { RivalStableData, ScoutReportData, ScoutQuality } from "@/types/game";
import { RivalStableList } from "./RivalStableList";
import { RivalWarriorList } from "./RivalWarriorList";
import { ScoutReportDetails } from "./ScoutReportDetails";
import { Surface } from "@/components/ui/Surface";

interface ScoutIntelTabProps {
  rivals: RivalStableData[];
  reports: ScoutReportData[];
  selectedRivalId: string | null;
  onSelectRival: (id: string) => void;
  selectedWarriorId: string | null;
  onSelectWarrior: (id: string) => void;
  treasury: number;
  onScout: (quality: ScoutQuality) => void;
}

export function ScoutIntelTab({
  rivals,
  reports,
  selectedRivalId,
  onSelectRival,
  selectedWarriorId,
  onSelectWarrior,
  treasury,
  onScout
}: ScoutIntelTabProps) {
  const activeRival = useMemo(
    () => rivals.find((r) => r.owner.id === selectedRivalId),
    [rivals, selectedRivalId]
  );

  const activeWarrior = useMemo(
    () => activeRival?.roster.find((w) => w.id === selectedWarriorId),
    [activeRival, selectedWarriorId]
  );

  const existingReport = useMemo(
    () => activeWarrior ? reports.find((r) => r.warriorName === activeWarrior.name) : null,
    [reports, activeWarrior]
  );

  if (rivals.length === 0) {
    return (
      <Surface variant="glass" className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-4">
        <Search className="h-12 w-12 text-muted-foreground opacity-20" />
        <div className="space-y-1">
          <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">No Rivals Signatures Detected</p>
          <p className="text-xs text-muted-foreground/60 italic">Scan the arena or progress the season to establish rival signatures.</p>
        </div>
      </Surface>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3 mt-4">
      <RivalStableList
        rivals={rivals}
        selectedRivalId={selectedRivalId}
        onSelectRival={onSelectRival}
      />

      <RivalWarriorList
        warriors={activeRival?.roster.filter((w) => w.status === "Active") ?? []}
        selectedWarriorId={selectedWarriorId}
        onSelectWarrior={onSelectWarrior}
        reports={reports}
        stableName={activeRival?.owner.stableName}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
           <div className="p-1 px-2 rounded-none bg-primary/10 border border-primary/20">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Target Analysis</span>
           </div>
           <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
        </div>
        
        {activeWarrior ? (
          <ScoutReportDetails
            report={existingReport ?? null}
            warriorName={activeWarrior.name}
            treasury={treasury}
            onScout={onScout}
          />
        ) : (
          <Surface variant="glass" className="py-20 text-center border-dashed border-border/30 flex flex-col items-center gap-4">
            <Target className="h-12 w-12 text-muted-foreground opacity-20" />
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Target Warrior Selection Required</p>
              <p className="text-[9px] text-muted-foreground/20 italic uppercase tracking-tighter">Establish lock-on to proceed with deep scan</p>
            </div>
          </Surface>
        )}
      </div>
    </div>
  );
}
