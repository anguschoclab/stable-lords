/**
 * Stable Lords — Recruit Page
 * Now costs gold to recruit warriors.
 */
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/state/GameContext";
import { FightingStyle, type Attributes } from "@/types/game";
import { makeWarrior } from "@/state/gameStore";
import WarriorBuilder from "@/components/WarriorBuilder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Coins } from "lucide-react";
import { toast } from "sonner";

const RECRUIT_COST = 150;

export default function Recruit() {
  const { state, setState } = useGame();
  const navigate = useNavigate();
  const canAfford = (state.gold ?? 0) >= RECRUIT_COST;

  const handleCreate = useCallback(
    (data: { name: string; style: FightingStyle; attributes: Attributes }) => {
      if (!canAfford) {
        toast.error(`Not enough gold! Need ${RECRUIT_COST}g to recruit.`);
        return;
      }
      const id = `w_${Date.now()}_${Math.floor(Math.random() * 1e5)}`;
      const warrior = makeWarrior(id, data.name, data.style, data.attributes);
      setState({
        ...state,
        roster: [...state.roster, warrior],
        gold: (state.gold ?? 0) - RECRUIT_COST,
        ledger: [...(state.ledger ?? []), {
          week: state.week,
          label: `Recruit: ${data.name}`,
          amount: -RECRUIT_COST,
          category: "recruit" as const,
        }],
      });
      toast.success(`${data.name} has joined your stable! (-${RECRUIT_COST}g)`);
      navigate(`/warrior/${id}`);
    },
    [state, setState, navigate, canAfford]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Badge variant="outline" className="gap-1.5 font-mono">
          <Coins className="h-3 w-3 text-arena-gold" />
          {state.gold ?? 0}g · Cost: {RECRUIT_COST}g
        </Badge>
      </div>
      {!canAfford && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Not enough gold to recruit. You need {RECRUIT_COST}g but only have {state.gold ?? 0}g.
        </div>
      )}
      <WarriorBuilder
        onCreateWarrior={handleCreate}
        maxRoster={10}
        currentRosterSize={state.roster.length}
      />
    </div>
  );
}
