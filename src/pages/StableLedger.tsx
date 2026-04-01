import React from "react";
import { BookOpen, Coins, Sparkles, GraduationCap, ScrollText, Skull } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { TreasuryOverview } from "@/components/ledger/TreasuryOverview";
import { InsightVault } from "@/components/ledger/InsightVault";
import { ContractManager } from "@/components/ledger/ContractManager";
import { Chronicle } from "@/components/ledger/Chronicle";
import { HallOfWarriors } from "@/components/ledger/HallOfWarriors";

export default function StableLedger() {
  const { state } = useGameStore();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader 
        title="Stable Ledger"
        subtitle={`FISCAL YEAR: 412 AE · SEASON: ${state.season} · WEEK: ${state.week}`}
        icon={BookOpen}
        actions={
          <div className="flex items-center gap-4 px-4 py-2 bg-secondary/20 rounded-lg border border-border/40 backdrop-blur-sm">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Treasury Reserve</span>
              <span className="font-mono font-black text-arena-gold">{(state.gold ?? 0).toLocaleString()}G</span>
            </div>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 h-auto p-1 bg-secondary/20 border border-border/40 backdrop-blur-sm rounded-xl mb-8">
          <TabsTrigger value="overview" className="text-[10px] font-black uppercase tracking-widest py-3 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Coins className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="text-[10px] font-black uppercase tracking-widest py-3 gap-2 data-[state=active]:bg-arena-gold data-[state=active]:text-black">
            <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Vault</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="text-[10px] font-black uppercase tracking-widest py-3 gap-2 data-[state=active]:bg-primary/80 data-[state=active]:text-white">
            <GraduationCap className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Staffing</span>
          </TabsTrigger>
          <TabsTrigger value="chronicle" className="text-[10px] font-black uppercase tracking-widest py-3 gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground">
            <ScrollText className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Chronicle</span>
          </TabsTrigger>
          <TabsTrigger value="hall" className="text-[10px] font-black uppercase tracking-widest py-3 gap-2 data-[state=active]:bg-destructive data-[state=active]:text-white">
            <Skull className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Memorial</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="focus-visible:outline-none"><TreasuryOverview /></TabsContent>
        <TabsContent value="tokens" className="focus-visible:outline-none"><InsightVault /></TabsContent>
        <TabsContent value="contracts" className="focus-visible:outline-none"><ContractManager /></TabsContent>
        <TabsContent value="chronicle" className="focus-visible:outline-none"><Chronicle /></TabsContent>
        <TabsContent value="hall" className="focus-visible:outline-none"><HallOfWarriors /></TabsContent>
      </Tabs>
    </div>
  );
}
