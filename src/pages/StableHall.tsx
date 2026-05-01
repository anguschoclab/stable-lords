import { useGameStore } from '@/state/useGameStore';
import { Shield, Crown, Star, Sparkles, UserCheck, BookOpen, Quote } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { ReputationSliders } from '@/components/stable/ReputationSliders';
import { RosterWall } from '@/components/stable/RosterWall';
import { TrainerTable } from '@/components/stable/TrainerTable';
import { StyleMeterTable } from '@/components/charts/StyleMeterTable';
import { InsightManager } from '@/components/ledger/InsightManager';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';

export default function StableHall() {
  const { player, fame, insightTokens } = useGameStore();
  const pendingTokens = (insightTokens ?? []).length;

  return (
    <PageFrame size="xl">
      <PageHeader
        eyebrow="INSTITUTIONAL_PROFILE"
        title={player.stableName}
        subtitle={`COMMANDER · ${player.name.toUpperCase()} · ESTABLISHED 410 AE`}
        icon={Shield}
        actions={
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">
                Eminent Fame
              </span>
              <div className="flex items-center gap-2 font-display font-black text-xl text-arena-gold">
                {fame} <Star className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="h-8 w-px bg-white/5" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">
                Master Titles
              </span>
              <div className="flex items-center gap-2 font-display font-black text-xl text-primary">
                {player.titles || 0} <Crown className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Sidebar: Institutional Values */}
        <aside className="lg:col-span-4 space-y-12">
          <section>
            <SectionDivider label="Reputation Metrics" />
            <div className="mt-8">
              <ReputationSliders />
            </div>
          </section>

          <section>
            <SectionDivider label="Style Composition" />
            <div className="mt-8">
              <StyleMeterTable />
            </div>
          </section>

          <section>
            <SectionDivider label="Institutional Creed" />
            <Surface
              variant="glass"
              className="mt-8 p-6 border-white/5 bg-white/[0.01] relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
                <Quote className="h-24 w-24" />
              </div>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed italic relative z-10">
                "The sand remembers every drop of blood shed in the name of the{' '}
                {player.stableName.split(' ')[0]} legacy. We do not just fight; we endure."
              </p>
            </Surface>
          </section>
        </aside>

        {/* Main: Roster & Staff */}
        <div className="lg:col-span-8 space-y-12">
          <section>
            <SectionDivider label="Active Personnel Matrix" variant="primary" />
            <div className="mt-8">
              <RosterWall />
            </div>
          </section>

          <section>
            <SectionDivider label="Command Staff" variant="gold" />
            <div className="mt-8">
              <TrainerTable />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <SectionDivider label="Patronage Awards" className="flex-1" />
              {pendingTokens > 0 && (
                <Badge className="bg-arena-gold/10 text-arena-gold border border-arena-gold/20 text-[9px] font-black rounded-none ml-4">
                  {pendingTokens} TOKENS_PENDING
                </Badge>
              )}
            </div>
            <InsightManager />
          </section>
        </div>
      </div>
    </PageFrame>
  );
}
