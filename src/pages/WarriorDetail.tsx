/**
 * Stable Lords — Warrior Detail
 * Deep dive into a single warrior's stats, history, and equipment.
 */
import { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { obfuscateWarrior } from '@/lib/obfuscation';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { type FightPlan, type GameState } from '@/types/game';
import type { Warrior } from '@/types/state.types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Armchair, Target, ScrollText, User } from 'lucide-react';
import { defaultPlanForWarrior } from '@/engine/simulate';
import { computeStreaks } from '@/engine/gazetteNarrative';
import { DEFAULT_LOADOUT, type EquipmentLoadout } from '@/data/equipment';
import { toast } from 'sonner';
import SubNav, { type SubNavTab } from '@/components/SubNav';

// Modularized Warrior Components
import { WarriorHeroHeader } from '@/components/warrior/WarriorHeroHeader';
import { BiometricsTab } from '@/components/warrior/BiometricsTab';
import { MissionControlTab } from '@/components/warrior/MissionControlTab';
import { ChronicleTab } from '@/components/warrior/ChronicleTab';

const TABS: SubNavTab[] = [
  { id: 'biometrics', label: 'BIOMETRICS', icon: <User className="h-4 w-4" /> },
  { id: 'mission', label: 'MISSION CONTROL', icon: <Target className="h-4 w-4" /> },
  { id: 'chronicle', label: 'CHRONICLE', icon: <ScrollText className="h-4 w-4" /> },
];

export default function WarriorDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();

  // Use the unified store hook
  const store = useGameStore();
  const {
    roster,
    graveyard,
    retired,
    rivals,
    arenaHistory,
    insightTokens,
    setState,
    renameWarrior,
    retireWarrior,
  } = store;

  const [activeTab, setActiveTab] = useState('biometrics');

  // Find warrior across all possible states
  const warrior = useMemo(() => {
    let w =
      roster.find((w) => w.id === id) ||
      graveyard.find((w) => w.id === id) ||
      retired.find((w) => w.id === id);
    if (w) return w;
    for (const rs of rivals || []) {
      w = rs.roster.find((w) => w.id === id);
      if (w) return w;
    }
    return undefined;
  }, [id, roster, graveyard, retired, rivals]);

  const isPlayerOwned = useMemo(() => {
    if (!warrior) return false;
    return !!(
      roster.find((w) => w.id === id) ||
      graveyard.find((w) => w.id === id) ||
      retired.find((w) => w.id === id)
    );
  }, [warrior, id, roster, graveyard, retired]);

  const displayWarrior = useMemo(() => {
    if (!warrior) return null;
    return obfuscateWarrior(warrior, insightTokens, isPlayerOwned);
  }, [warrior, insightTokens, isPlayerOwned]);

  const handlePlanChange = useCallback(
    (newPlan: FightPlan) => {
      if (!warrior) return;
      setState((draft: any) => {
        const index = draft.roster.findIndex((w: Warrior) => w.id === warrior.id);
        if (index !== -1) {
          draft.roster[index].plan = newPlan;
        }
      });
    },
    [warrior, setState]
  );

  const handleRetire = useCallback(() => {
    if (!warrior) return;
    retireWarrior(warrior.id);
    toast.success(`${warrior.name} has been retired with honor.`);
    navigate({ to: '/' });
  }, [warrior, retireWarrior, navigate]);

  const handleEquipmentChange = useCallback(
    (newLoadout: EquipmentLoadout) => {
      if (!warrior) return;
      setState((draft: any) => {
        const index = draft.roster.findIndex((w: Warrior) => w.id === warrior.id);
        if (index !== -1) {
          draft.roster[index].equipment = newLoadout;
        }
      });
    },
    [warrior, setState]
  );

  if (!warrior || !displayWarrior) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Warrior not found.</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const currentPlan = warrior.plan ?? defaultPlanForWarrior(warrior);
  const currentLoadout = warrior.equipment ?? DEFAULT_LOADOUT;
  const record = `${displayWarrior.career.wins}W - ${displayWarrior.career.losses}L - ${displayWarrior.career.kills}K`;

  const streakMap = computeStreaks(arenaHistory);
  const streakVal = streakMap.get(displayWarrior.name) ?? 0;
  const streakLabel =
    streakVal > 0
      ? `${streakVal}W streak`
      : streakVal < 0
        ? `${Math.abs(streakVal)}L streak`
        : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        {isPlayerOwned && warrior.status === 'Active' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetire}
            className="gap-1.5 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Armchair className="h-3.5 w-3.5" /> Retire
          </Button>
        )}
      </div>

      <WarriorHeroHeader
        warrior={displayWarrior}
        record={record}
        streakLabel={streakLabel}
        streakVal={streakVal}
        id={id}
        isPlayerOwned={isPlayerOwned}
        insightTokens={insightTokens}
      />
      <SubNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'biometrics' && (
        <BiometricsTab warrior={warrior} displayWarrior={displayWarrior as any} />
      )}

      {activeTab === 'mission' && (
        <MissionControlTab
          warrior={warrior}
          displayWarrior={displayWarrior as any}
          currentPlan={currentPlan}
          currentLoadout={currentLoadout}
          onPlanChange={handlePlanChange}
          onEquipmentChange={handleEquipmentChange}
        />
      )}

      {activeTab === 'chronicle' && <ChronicleTab warrior={warrior} arenaHistory={arenaHistory} />}
    </div>
  );
}
