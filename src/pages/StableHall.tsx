import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { Shield, Users, Crown, Medal, Award, Star } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReputationSliders } from "@/components/stable/ReputationSliders";
import { RosterWall } from "@/components/stable/RosterWall";
import { TrainerTable } from "@/components/stable/TrainerTable";

export default function StableHall() {
  const { player, fame } = useGameStore();

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title={player.stableName}
        subtitle={`REPUTATION // ${player.name} // LEGACY OF THE ARENA`}
        icon={Shield}
        actions={
          <div className="flex flex-col md:flex-row items-center gap-6 bg-neutral-900/40 backdrop-blur-md px-6 py-3 rounded-xl border border-white/5 shadow-inner">
             <div className="flex flex-col items-center border-r border-white/10 pr-6">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Eminent Fame</span>
                <span className="font-mono font-black text-arena-gold text-lg flex items-center gap-1.5 leading-none">
                   {fame} <Star className="h-3.5 w-3.5" />
                </span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Master Titles</span>
                <span className="font-mono font-black text-arena-fame text-lg flex items-center gap-1.5 leading-none">
                   {player.titles} <Crown className="h-3.5 w-3.5" />
                </span>
             </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-12">
           <div className="flex items-center gap-3 px-1 mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">STABLE_COMPOSITION</span>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
           </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-8">
           <ReputationSliders />
           <TrainerTable />
        </div>

        <div className="lg:col-span-7">
           <RosterWall />
        </div>
      </div>
    </div>
  );
}
