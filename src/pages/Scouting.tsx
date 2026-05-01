import { useState, useCallback, useMemo } from 'react';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { generateScoutReport, getScoutCost, type ScoutQuality } from '@/engine/scouting';
import { type ScoutReportData, type RivalStableData, type Warrior } from '@/types/game';
import { Search, Eye, ArrowLeftRight, UserRoundSearch, Shield, Target, Radio } from 'lucide-react';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { hashStr } from '@/utils/random';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from 'sonner';

// Modular Components
import { ScoutIntelTab } from '@/components/scouting/ScoutIntelTab';
import { StableComparison } from '@/components/scouting/StableComparison';
import { WarriorComparison } from '@/components/scouting/WarriorComparison';
import { ReputationQuadrant } from '@/components/charts/ReputationQuadrant';
import { PageFrame } from '@/components/ui/PageFrame';
import { ImperialRing } from '@/components/ui/ImperialRing';

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
        ...(scoutReports ?? []).filter(
          (r: ScoutReportData) => r.warriorName !== activeWarrior.name
        ),
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
          category: 'other',
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
    <PageFrame size="xl">
      <PageHeader
        title="Tactical Reconnaissance"
        subtitle="WORLD · INTELLIGENCE · THREAT ANALYSIS"
        actions={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Active Protocols
              </span>
              <span className="text-sm font-display font-black text-foreground">
                {scoutReports?.length || 0} Synchronized
              </span>
            </div>
            <div className="flex items-center gap-4 border-l border-white/5 pl-6">
              <ImperialRing size="xs" variant="blood" className="animate-pulse">
                <Radio className="h-3 w-3 text-primary" />
              </ImperialRing>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                Scanning Data Packets...
              </span>
            </div>
          </div>
        }
      />

      <Tabs defaultValue="scout" className="w-full space-y-12">
        <TabsList className="w-full h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none">
          <TabsTrigger
            value="scout"
            className="flex-1 h-full font-black uppercase text-[10px] tracking-[0.3em] rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Scout Intel
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            className="flex-1 h-full font-black uppercase text-[10px] tracking-[0.3em] rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Stable Dynamics
          </TabsTrigger>
          <TabsTrigger
            value="warriors"
            className="flex-1 h-full font-black uppercase text-[10px] tracking-[0.3em] rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Warrior Face-Off
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scout" className="mt-0 focus-visible:outline-none">
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

        <TabsContent value="compare" className="mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <StableComparison rivals={rivals} />
            </div>
            <div className="space-y-8">
              <SectionDivider label="Reputation Quadrant" />
              <ReputationQuadrant />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="warriors" className="mt-0 focus-visible:outline-none">
          <WarriorComparison rivals={rivals ?? []} playerRoster={roster} />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}
