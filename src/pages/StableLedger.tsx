import {
  BookOpen,
  Coins,
  Sparkles,
  GraduationCap,
  ScrollText,
  Skull,
  CalendarDays,
  AlertCircle,
  Hourglass,
} from 'lucide-react';
import { useGameStore } from '@/state/useGameStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { Separator } from '@/components/ui/separator';
import { TreasuryOverview } from '@/components/ledger/TreasuryOverview';
import { InsightVault } from '@/components/ledger/InsightVault';
import { InsightManager } from '@/components/ledger/InsightManager';
import { ContractManager } from '@/components/ledger/ContractManager';
import { Chronicle } from '@/components/ledger/Chronicle';
import { HallOfWarriors } from '@/components/ledger/HallOfWarriors';
import { YearEndRecap } from '@/components/ledger/YearEndRecap';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { computeWeeklyBreakdown } from '@/engine/economy';
import { cn } from '@/lib/utils';

export default function StableLedger() {
  const store = useGameStore();
  const { season, week, treasury } = store;
  const breakdown = computeWeeklyBreakdown(store);
  const runway = breakdown.totalExpenses > 0 ? Math.floor(treasury / breakdown.totalExpenses) : 99;
  const isEmergency = runway < 4;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Stable Ledger"
        subtitle={`FISCAL YEAR: 412 AE · SEASON: ${season} · Week: ${week}`}
        icon={BookOpen}
        actions={
          <div className="flex items-center gap-4 px-4 py-2 bg-secondary/20 rounded-none border border-border/40 backdrop-blur-sm">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                Treasury Reserve
              </span>
              <span className="font-mono font-black text-arena-gold">
                {(treasury ?? 0).toLocaleString()}G
              </span>
            </div>
          </div>
        }
      />

      {/* Band 2 — Financial Runway Alert (Spec §6.4) */}
      <Surface
        variant={isEmergency ? 'blood' : 'glass'}
        className="flex items-center justify-between p-5 border-l-4 border-l-primary/50"
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'p-2 rounded-none border',
              isEmergency
                ? 'bg-destructive/20 border-destructive/40 animate-pulse'
                : 'bg-primary/10 border-primary/30'
            )}
          >
            {isEmergency ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <Hourglass className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
                Fiscal Runway Projection
              </span>
              {isEmergency && (
                <Badge className="bg-destructive text-foreground text-[8px] font-black h-4 px-1.5 animate-bounce">
                  CRITICAL
                </Badge>
              )}
            </div>
            <p className="text-xl font-display font-black uppercase tracking-tight text-foreground leading-none mt-1">
              {runway === 99 ? 'INFINITE' : `${runway} WEEKS`} REMAINING
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1 text-right">
              Weekly Burn
            </div>
            <div className="font-mono font-black text-destructive text-lg leading-none">
              -{breakdown.totalExpenses}G
            </div>
          </div>
          <div className="h-8 w-px bg-white/5" />
          <div className="text-right">
            <div className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1 text-right">
              Net Flow
            </div>
            <div
              className={cn(
                'font-mono font-black text-lg leading-none',
                breakdown.net >= 0 ? 'text-primary' : 'text-destructive'
              )}
            >
              {breakdown.net >= 0 ? '+' : ''}
              {breakdown.net}G
            </div>
          </div>
        </div>
      </Surface>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-6 h-auto p-1 bg-secondary/20 border border-border/40 backdrop-blur-sm rounded-none mb-8">
          <TabsTrigger
            value="overview"
            className="text-[10px] font-black uppercase tracking-widest py-3 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Coins className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="tokens"
            className="text-[10px] font-black uppercase tracking-widest py-3 gap-2 data-[state=active]:bg-arena-gold data-[state=active]:text-black"
          >
            <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">The Vault</span>
          </TabsTrigger>
          <TabsTrigger
            value="contracts"
            className="text-[10px] font-black uppercase tracking-widest py-3 gap-2 data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground"
          >
            <GraduationCap className="h-3.5 w-3.5" />{' '}
            <span className="hidden sm:inline">Staffing</span>
          </TabsTrigger>
          <TabsTrigger
            value="chronicle"
            className="text-[10px] font-black uppercase tracking-widest py-3 gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground"
          >
            <ScrollText className="h-3.5 w-3.5" />{' '}
            <span className="hidden sm:inline">Chronicle</span>
          </TabsTrigger>
          <TabsTrigger
            value="hall"
            className="text-[10px] font-black uppercase tracking-widest py-3 gap-2 data-[state=active]:bg-destructive data-[state=active]:text-primary-foreground"
          >
            <Skull className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Legends Hall</span>
          </TabsTrigger>
          <TabsTrigger
            value="year-end"
            className="text-[10px] font-black uppercase tracking-widest py-3 gap-2 data-[state=active]:bg-arena-gold data-[state=active]:text-black"
          >
            <CalendarDays className="h-3.5 w-3.5" />{' '}
            <span className="hidden sm:inline">Year-End</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="focus-visible:outline-none">
          <TreasuryOverview />
        </TabsContent>
        <TabsContent value="tokens" className="focus-visible:outline-none space-y-12">
          <InsightManager />
          <Separator className="bg-border/20" />
          <InsightVault />
        </TabsContent>
        <TabsContent value="contracts" className="focus-visible:outline-none">
          <ContractManager />
        </TabsContent>
        <TabsContent value="chronicle" className="focus-visible:outline-none">
          <Chronicle />
        </TabsContent>
        <TabsContent value="hall" className="focus-visible:outline-none">
          <HallOfWarriors />
        </TabsContent>
        <TabsContent value="year-end" className="focus-visible:outline-none">
          <YearEndRecap />
        </TabsContent>
      </Tabs>
    </div>
  );
}
