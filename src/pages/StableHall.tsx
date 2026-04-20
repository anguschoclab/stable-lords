import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { Shield, Users, Crown, Medal, Award, Star, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { ReputationSliders } from "@/components/stable/ReputationSliders";
import { RosterWall } from "@/components/stable/RosterWall";
import { TrainerTable } from "@/components/stable/TrainerTable";
import { StyleMeterTable } from "@/components/charts/StyleMeterTable";
import { InsightManager } from "@/components/ledger/InsightManager";

export default function StableHall() {
  const { player, fame, insightTokens } = useGameStore();
  const pendingTokens = (insightTokens ?? []).length;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title={player.stableName}
        subtitle={`REPUTATION // ${player.name} // LEGACY OF THE ARENA`}
        icon={Shield}
      />

      {/* Band 2 — Stable Hero Strip (Spec §6.5) */}
      <Surface variant="gold" className="flex items-center gap-12 p-8 border-l-4 border-l-arena-gold/50">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-none bg-arena-gold/10 border border-arena-gold/30 flex items-center justify-center shadow-[0_0_20px_rgba(201,151,42,0.15)]">
              <Shield className="h-8 w-8 text-arena-gold" />
           </div>
           <div>
              <h2 className="font-display font-black text-3xl uppercase tracking-tighter text-foreground leading-none">
                {player.stableName}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mt-1.5 flex items-center gap-2">
                ESTABLISHED 410 AE <span className="opacity-30">·</span> {player.name}
              </p>
           </div>
        </div>

        <div className="h-12 w-px bg-white/5" />

        <div className="flex items-center gap-10">
           <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Eminent Fame</span>
              <div className="flex items-center gap-2 font-display font-black text-2xl text-arena-gold tracking-tighter leading-none">
                {fame} <Star className="h-4 w-4" />
              </div>
           </div>

           <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Master Titles</span>
              <div className="flex items-center gap-2 font-display font-black text-2xl text-arena-fame tracking-tighter leading-none">
                {player.titles || 0} <Crown className="h-4 w-4" />
              </div>
           </div>

           {pendingTokens > 0 && (
             <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Patron Tokens</span>
               <div className="flex items-center gap-2 font-display font-black text-2xl text-yellow-400 tracking-tighter leading-none">
                 {pendingTokens} <Sparkles className="h-4 w-4 animate-pulse" />
               </div>
             </div>
           )}
        </div>

        <div className="ml-auto hidden xl:block text-right">
           <p className="text-[10px] italic text-muted-foreground/40 max-w-[200px] leading-relaxed">
             "The sand remembers every drop of blood shed in the name of the {player.stableName.split(' ')[0]} legacy."
           </p>
        </div>
      </Surface>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-12">
           <div className="flex items-center gap-3 px-1 mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">STABLE_COMPOSITION</span>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
           </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-8">
           <ReputationSliders />
           <StyleMeterTable />
           <TrainerTable />
        </div>

        <div className="lg:col-span-7">
           <RosterWall />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">PATRONAGE_AWARDS</span>
          {pendingTokens > 0
            ? <Badge className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-[9px] font-black">{pendingTokens} TOKEN{pendingTokens !== 1 ? "S" : ""} PENDING</Badge>
            : <Badge className="bg-white/5 text-muted-foreground border border-white/10 text-[9px] font-black">Place in tournaments to earn tokens</Badge>
          }
          <div className="h-px flex-1 bg-gradient-to-r from-yellow-400/20 via-border/20 to-transparent" />
        </div>
        <InsightManager />
      </div>
    </div>
  );
}
