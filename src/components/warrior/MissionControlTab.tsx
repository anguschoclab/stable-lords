import React from "react";
import { Crosshair, Shield, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PlanBuilder from "@/components/PlanBuilder";
import EquipmentLoadoutUI from "@/components/EquipmentLoadout";
import { SchedulingWidget } from "@/components/widgets/SchedulingWidget";
import { Warrior, FightPlan } from "@/types/game";
import { EquipmentLoadout } from "@/data/equipment";

interface MissionControlTabProps {
  warrior: Warrior;
  displayWarrior: import("@/types/game").Warrior;
  currentPlan: FightPlan;
  currentLoadout: EquipmentLoadout;
  onPlanChange: (plan: FightPlan) => void;
  onEquipmentChange: (loadout: EquipmentLoadout) => void;
}

export function MissionControlTab({ 
  warrior, 
  displayWarrior, 
  currentPlan, 
  currentLoadout, 
  onPlanChange, 
  onEquipmentChange 
}: MissionControlTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="bg-glass-card border-neon-gold border-2 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-arena-gold/10 px-8 py-4 border-b border-arena-gold/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crosshair className="h-5 w-5 text-arena-gold" />
              <span className="font-display font-black uppercase tracking-widest text-sm">Targeting & Engagement Protocols</span>
            </div>
            <Badge className="bg-arena-gold text-black px-4">Manual Override Active</Badge>
          </div>
          <div className="p-8">
            <PlanBuilder warrior={warrior} plan={currentPlan} onPlanChange={onPlanChange} warriorName={displayWarrior.name} />
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-glass-card border-neon rounded-2xl overflow-hidden border">
            <div className="bg-secondary/10 px-6 py-4 border-b border-border/40 flex items-center gap-3">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-display font-black uppercase tracking-widest text-xs">Armory Loadout</span>
            </div>
            <div className="p-6">
              <EquipmentLoadoutUI
                loadout={currentLoadout}
                style={warrior.style}
                carryCap={warrior.derivedStats?.encumbrance ?? 0}
                warriorAttrs={warrior.attributes}
                onChange={onEquipmentChange}
              />
            </div>
          </div>
          <div className="bg-glass-card border-neon rounded-2xl overflow-hidden border">
            <div className="bg-secondary/10 px-6 py-4 border-b border-border/40 flex items-center gap-3">
              <Target className="h-4 w-4 text-accent" />
              <span className="font-display font-black uppercase tracking-widest text-xs">Scouting Assist</span>
            </div>
            <div className="p-2 h-full overflow-y-auto max-h-[600px] no-scrollbar">
              <SchedulingWidget warrior={warrior} />
            </div>
          </div>
       </div>
    </div>
  );
}
