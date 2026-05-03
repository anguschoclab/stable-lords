import React, { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useGameStore } from '@/state/useGameStore';
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  type Attributes,
  type FightingStyle,
} from '@/types/shared.types';
import type { Warrior, SeasonalGrowth } from '@/types/state.types';
import { computeGainChance } from '@/engine/training';
import { potentialRating, potentialGrade, diminishingReturnsFactor } from '@/engine/potential';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, AlertTriangle, Star, Target, Activity } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';

/* ── Burn Risk Assessment ──────────────────────────────── */

interface BurnWarning {
  attribute: keyof Attributes;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

function assessBurnRisks(
  warrior: Warrior,
  trainers: import('@/types/shared.types').Trainer[]
): BurnWarning[] {
  const warnings: BurnWarning[] = [];
  const age = warrior.age ?? 18;

  for (const key of ATTRIBUTE_KEYS) {
    if (key === 'SZ') continue;

    const val = warrior.attributes[key];
    const pot = warrior.potential?.[key];
    const chance = computeGainChance(warrior, key, trainers);

    // At or near potential ceiling
    if (pot !== undefined) {
      if (val >= pot) {
        warnings.push({
          attribute: key,
          reason: `At potential ceiling (${pot})`,
          severity: 'high',
        });
      } else if (val >= pot - 1) {
        warnings.push({
          attribute: key,
          reason: `1 point from ceiling (${pot})`,
          severity: 'medium',
        });
      }
    }

    // Very low gain chance
    if (chance < 0.2 && val < 25) {
      warnings.push({
        attribute: key,
        reason: `Very low gain chance (${Math.round(chance * 100)}%)`,
        severity: 'medium',
      });
    }

    // Age penalty
    if (age > 30) {
      warnings.push({ attribute: key, reason: `Age penalty active (age ${age})`, severity: 'low' });
    }
  }

  return warnings;
}

function computeTrainability(
  warrior: Warrior,
  trainers: import('@/types/shared.types').Trainer[]
): number {
  let totalChance = 0;
  let trainable = 0;
  for (const key of ATTRIBUTE_KEYS) {
    if (key === 'SZ') continue;
    const val = warrior.attributes[key];
    const pot = warrior.potential?.[key];
    if (val >= 25 || (pot !== undefined && val >= pot)) continue;
    totalChance += computeGainChance(warrior, key, trainers);
    trainable++;
  }
  return trainable > 0 ? Math.round((totalChance / trainable) * 100) : 0;
}

function BurnWarnings({ burns }: { burns: BurnWarning[] }) {
  const visibleBurns = burns.filter((b) => b.severity !== 'low');
  if (visibleBurns.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          Operational Constraints
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleBurns.map((b, i) => (
          <div
            key={i}
            className={cn(
              'p-4 border bg-white/[0.01] flex items-center justify-between',
              b.severity === 'high' ? 'border-primary/20' : 'border-white/5'
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                {ATTRIBUTE_LABELS[b.attribute]}
              </span>
              <span className="text-[10px] text-foreground font-display font-black italic">
                "{b.reason}"
              </span>
            </div>
            <Badge
              className={cn(
                'rounded-none text-[8px] font-black uppercase tracking-widest',
                b.severity === 'high'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/10 text-muted-foreground'
              )}
            >
              {b.severity} Risk
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttributeRow({
  attr,
}: {
  attr: {
    key: keyof Attributes;
    val: number;
    pot?: number;
    chance: number;
    seasonGain: number;
    capped: boolean;
    seasonCapped: boolean;
    drFactor: number;
  };
}) {
  const chancePct = Math.round(attr.chance * 100);
  const isRecommended = !attr.capped && !attr.seasonCapped && attr.chance >= 0.4;
  const pct = (attr.val / 25) * 100;
  const potPct = attr.pot ? (attr.pot / 25) * 100 : 0;

  const colorClass =
    attr.val >= 16 ? 'bg-primary' : attr.val >= 12 ? 'bg-arena-gold' : 'bg-white/20';

  return (
    <div
      className={cn(
        'p-4 border border-white/5 bg-white/[0.01] transition-all',
        attr.capped && 'opacity-20 grayscale'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 w-16">
            {ATTRIBUTE_LABELS[attr.key]}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-display font-black text-foreground leading-none">
              {attr.val}
            </span>
            {attr.pot !== undefined && (
              <span className="text-[11px] font-display font-black text-arena-gold opacity-40">
                / {attr.pot}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Season Gains */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn('w-2 h-2', i < attr.seasonGain ? 'bg-primary' : 'bg-white/5')}
              />
            ))}
          </div>
          {/* Chance Badge */}
          {!attr.capped ? (
            <div className="w-16 text-right">
              <span
                className={cn(
                  'text-[10px] font-display font-black tracking-widest',
                  chancePct >= 50
                    ? 'text-arena-pop'
                    : chancePct >= 30
                      ? 'text-foreground'
                      : 'text-primary'
                )}
              >
                {chancePct}%
              </span>
              <p className="text-[8px] font-black uppercase text-muted-foreground/20 tracking-tighter">
                SUCCESS
              </p>
            </div>
          ) : (
            <div className="w-16 text-right">
              <span className="text-[10px] font-display font-black text-muted-foreground/40 tracking-widest">
                CEILING
              </span>
              <p className="text-[8px] font-black uppercase text-muted-foreground/20 tracking-tighter">
                REACHED
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="h-1 bg-white/5 relative overflow-hidden">
        {/* Potential Marker */}
        {attr.pot !== undefined && (
          <div
            className="absolute h-full w-px bg-arena-gold/30 z-10"
            style={{ left: `${potPct}%` }}
          />
        )}
        {/* Progress Bar */}
        <div
          className={cn('h-full transition-all duration-1000', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isRecommended && (
        <div className="flex items-center gap-2 mt-3">
          <Target className="h-3 w-3 text-arena-pop" />
          <span className="text-[8px] font-black uppercase tracking-widest text-arena-pop">
            Optimized Development Path Detected
          </span>
        </div>
      )}
    </div>
  );
}

function WarriorPlannerCard({
  warrior,
  trainers,
  seasonalGains,
}: {
  warrior: Warrior;
  trainers: import('@/types/shared.types').Trainer[];
  seasonalGains: Partial<Record<keyof Attributes, number>>;
}) {
  const burns = useMemo(() => assessBurnRisks(warrior, trainers), [warrior, trainers]);
  const trainability = useMemo(() => computeTrainability(warrior, trainers), [warrior, trainers]);
  const potRating = warrior.potential ? potentialRating(warrior.potential) : null;
  const potGrade = potRating !== null ? potentialGrade(potRating) : null;

  const ranked = ATTRIBUTE_KEYS.filter((k): k is Exclude<keyof Attributes, 'SZ'> => k !== 'SZ')
    .map((k) => ({
      key: k as keyof Attributes,
      val: warrior.attributes[k],
      pot: warrior.potential?.[k],
      chance: computeGainChance(warrior, k, trainers),
      seasonGain: seasonalGains[k] ?? 0,
      capped:
        warrior.attributes[k] >= 25 ||
        (warrior.potential?.[k] !== undefined &&
          warrior.attributes[k] >= (warrior.potential?.[k] ?? 0)),
      seasonCapped: (seasonalGains[k] ?? 0) >= 3,
      drFactor: diminishingReturnsFactor(warrior.attributes[k], warrior.potential?.[k]),
    }))
    .sort((a, b) => {
      if (a.capped && !b.capped) return 1;
      if (!a.capped && b.capped) return -1;
      return b.chance - a.chance;
    });

  return (
    <div className="space-y-12">
      <Surface variant="glass" className="p-8 border-white/5 space-y-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <ImperialRing size="md" variant="bronze">
              <Activity className="h-5 w-5 text-muted-foreground/40" />
            </ImperialRing>
            <div>
              <h2 className="text-2xl font-display font-black uppercase tracking-tight text-foreground leading-none mb-2">
                {warrior.name}
              </h2>
              <div className="flex items-center gap-4">
                <StatBadge styleName={warrior.style as FightingStyle} showFullName />
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-black">
                  Age {warrior.age}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Potential Index
              </span>
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-arena-gold" />
                <span className="text-xl font-display font-black text-arena-gold">{potGrade}</span>
              </div>
            </div>
            <div className="text-right border-l border-white/5 pl-6">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Trainability
              </span>
              <div className="flex items-center gap-3">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span className="text-xl font-display font-black text-foreground">
                  {trainability}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {ranked.map((attr) => (
            <AttributeRow key={attr.key} attr={attr} />
          ))}
        </div>

        <BurnWarnings burns={burns} />
      </Surface>
    </div>
  );
}

export default function TrainingPlanner() {
  const { roster, trainers, seasonalGrowth, season } = useGameStore();
  const activeWarriors = roster.filter((w) => w.status === 'Active');
  const [selectedId, setSelectedId] = React.useState<string | null>(activeWarriors[0]?.id || null);

  const currentTrainers = useMemo(() => trainers ?? [], [trainers]);
  const selectedWarrior = activeWarriors.find((w) => w.id === selectedId);

  const seasonalGainsMap = useMemo(() => {
    const map = new Map<string, Partial<Record<keyof Attributes, number>>>();
    const growth = (seasonalGrowth ?? []) as SeasonalGrowth[];
    for (const sg of growth) {
      if (sg.season === season) {
        map.set(sg.warriorId, sg.gains);
      }
    }
    return map;
  }, [seasonalGrowth, season]);

  const avgTrainability = useMemo(() => {
    if (activeWarriors.length === 0) return 0;
    return Math.round(
      activeWarriors.reduce((s, w) => s + computeTrainability(w, currentTrainers), 0) /
        activeWarriors.length
    );
  }, [activeWarriors, currentTrainers]);

  return (
    <PageFrame size="xl">
      <PageHeader
        title="Training Logistics"
        subtitle="STABLE · DEVELOPMENT_PLANNER · WK {season}"
        actions={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Stable Trainability
              </span>
              <span className="text-sm font-display font-black text-primary">
                {avgTrainability}% Aggregate
              </span>
            </div>
            <div className="flex flex-col items-end border-l border-white/5 pl-6">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Active Trainers
              </span>
              <span className="text-sm font-display font-black text-foreground">
                {currentTrainers.filter((t) => t.contractWeeksLeft > 0).length} Personnel
              </span>
            </div>
          </div>
        }
      />

      <div className="flex items-center h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none mb-12">
        <Link
          to="/command/training"
          className="flex-1 h-full flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground transition-all"
        >
          <Dumbbell className="h-3.5 w-3.5" />
          Personnel Assignments
        </Link>
        <div className="flex-1 h-full flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-[0.3em] bg-primary text-primary-foreground">
          <Target className="h-3.5 w-3.5" />
          Strategic Planning
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Left Rail Roster */}
        <aside className="space-y-8">
          <SectionDivider label="Asset Registry" />
          <div className="grid grid-cols-1 gap-3">
            {activeWarriors.map((warrior) => {
              const isSelected = warrior.id === selectedId;
              const trainability = computeTrainability(warrior, currentTrainers);
              return (
                <button
                  key={warrior.id}
                  onClick={() => setSelectedId(warrior.id)}
                  className={cn(
                    'flex flex-col gap-1 p-4 border transition-all text-left group',
                    isSelected
                      ? 'bg-white/[0.05] border-white/20'
                      : 'bg-transparent border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                  )}
                >
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-widest',
                      isSelected ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {warrior.name}
                  </span>
                  <span className="text-[9px] font-black text-primary uppercase tracking-tighter">
                    {trainability}% Growth Potential
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Rail Viewport */}
        <div className="lg:col-span-3">
          {selectedWarrior ? (
            <WarriorPlannerCard
              warrior={selectedWarrior}
              trainers={currentTrainers}
              seasonalGains={seasonalGainsMap.get(selectedWarrior.id) ?? {}}
            />
          ) : (
            <Surface
              variant="glass"
              className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
            >
              <ImperialRing size="lg" variant="bronze" className="opacity-20">
                <Dumbbell className="h-8 w-8" />
              </ImperialRing>
              <div className="space-y-2">
                <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                  Zero Assets Selected
                </p>
                <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
                  Select a combat asset from the registry to initialize planning.
                </p>
              </div>
            </Surface>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
