/**
 * Stable Lords — Recruit Page (Post-FTUE)
 * Two tabs: Scout Pool (pre-generated warriors) and Custom Build.
 * Implements Stable_Lords_Orphanage_Recruitment_Spec_v1.0
 */
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { FightingStyle, STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, type Attributes } from '@/types/game';
import { BASE_ROSTER_CAP } from '@/data/constants';
import { makeWarrior } from '@/engine/factories';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { hashStr } from '@/utils/random';
import {
  generateRecruitPool,
  fullRefreshPool,
  type PoolWarrior,
  type RecruitTier,
  TIER_COST,
  TIER_STARS,
  REFRESH_COST,
} from '@/engine/recruitment';
import { canTransact } from '@/utils/economyUtils';
import { potentialRating, potentialGrade } from '@/engine/potential';
import { revealRecruitPotential, type PotentialScoutReport } from '@/engine/recruitScouting';
import WarriorBuilder from '@/components/WarriorBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Coins,
  Star,
  UserPlus,
  RefreshCw,
  Hammer,
  Search,
  Heart,
  Zap,
  Users,
  Eye,
  Clock,
  Quote,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Surface } from '@/components/ui/Surface';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CUSTOM_COST = 200;

const TIER_ACCENTS: Record<RecruitTier, string> = {
  Common: 'border-border/40 text-muted-foreground',
  Promising: 'border-stone-500/30 text-stone-300 bg-stone-500/10',
  Exceptional:
    'border-arena-fame/50 text-arena-fame bg-arena-fame/10 shadow-[0_0_15px_-3px_rgba(139,95,196,0.3)]',
  Prodigy:
    'border-arena-gold text-arena-gold bg-arena-gold/10 shadow-[0_0_20px_-5px_rgba(201,151,42,0.4)]',
};

function TierBadge({ tier }: { tier: RecruitTier }) {
  const stars = TIER_STARS[tier];
  return (
    <Badge
      variant="outline"
      className={`text-[10px] gap-1 font-black uppercase tracking-widest ${TIER_ACCENTS[tier]}`}
    >
      {stars > 0 &&
        Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="h-2 w-2 fill-current" />
        ))}
      {tier}
    </Badge>
  );
}

function StatBar({ label, value, max = 21 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-black uppercase text-muted-foreground w-6 text-right font-mono tracking-tighter">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary/30 overflow-hidden border border-border/20">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            value >= 16
              ? 'bg-primary glow-neon-green'
              : value >= 12
                ? 'bg-arena-gold glow-neon-gold'
                : 'bg-muted-foreground/40'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold w-4 text-right text-foreground/80">
        {value}
      </span>
    </div>
  );
}

function RecruitCard({
  warrior,
  canAfford,
  rosterFull,
  onRecruit,
  isScouted,
  onScout,
  canAffordScout,
  canAffordBonus,
  scoutReport,
}: {
  warrior: PoolWarrior;
  canAfford: boolean;
  rosterFull: boolean;
  onRecruit: (w: PoolWarrior, bonus?: boolean) => void;
  isScouted: boolean;
  onScout: (w: PoolWarrior) => void;
  canAffordScout: boolean;
  canAffordBonus: boolean;
  scoutReport?: PotentialScoutReport;
}) {
  const grade = potentialGrade(potentialRating(warrior.potential));
  const isElite = warrior.tier === 'Prodigy' || warrior.tier === 'Exceptional';

  return (
    <motion.div whileHover={{ y: -5 }}>
      <Surface
        variant={isElite ? 'gold' : 'glass'}
        padding="none"
        className={cn(
          'overflow-hidden transition-all duration-300 group h-full',
          isElite ? 'border-arena-gold/30 hover:border-arena-gold' : 'hover:border-primary/50',
          TIER_ACCENTS[warrior.tier]
        )}
      >
        <CardHeader className="pb-2 pt-5 px-5 relative">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="font-display font-black uppercase text-sm tracking-tight group-hover:text-primary transition-colors">
              {warrior.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <TierBadge tier={warrior.tier} />
              {isScouted && (
                <Badge
                  variant="outline"
                  className="gap-1 border-primary/50 bg-primary/10 text-[10px] px-2 py-0 h-5"
                >
                  <Eye className="h-3 w-3" /> Scouted
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
            <StatBadge styleName={warrior.style} showFullName />
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> AGE {warrior.age}
            </span>
            {isScouted && (
              <Badge
                className={cn(
                  'text-[10px] ml-auto font-black px-2 py-0 h-4',
                  grade === 'S' || grade === 'A'
                    ? 'bg-primary text-black'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                POTENTIAL: {grade}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 space-y-4">
          <div className="space-y-1.5 bg-background/20 p-3 rounded-none border border-border/20">
            {ATTRIBUTE_KEYS.map((key) => (
              <StatBar key={key} label={key} value={warrior.attributes[key]} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-none bg-secondary/10 border border-border/10">
              <Heart className="h-3.5 w-3.5 text-destructive" />
              <div className="flex-1">
                <p className="text-[9px] text-muted-foreground font-black uppercase">HIT POINTS</p>
                <p className="text-xs font-mono font-bold">{warrior.derivedStats.hp}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-none bg-secondary/10 border border-border/10">
              <Zap className="h-3.5 w-3.5 text-arena-fame" />
              <div className="flex-1">
                <p className="text-[9px] text-muted-foreground font-black uppercase">ENDURANCE</p>
                <p className="text-xs font-mono font-bold">{warrior.derivedStats.endurance}</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Quote className="h-4 w-4 text-primary/20 absolute -top-2 -left-2" />
            <p className="text-[11px] text-muted-foreground italic leading-relaxed pl-3 border-l-2 border-primary/20">
              {warrior.lore}
            </p>
          </div>

          {isScouted && scoutReport && Object.keys(scoutReport.revealed).length > 0 && (
            <div className="p-3 border border-primary/30 bg-primary/5 rounded-none space-y-1.5">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
                Scout_Report
              </div>
              <p className="text-[10px] text-muted-foreground italic">{scoutReport.summary}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(scoutReport.revealed).map(([k, v]) => (
                  <span
                    key={k}
                    className="text-[10px] font-mono px-2 py-0.5 border border-primary/30 bg-black/40 text-primary"
                  >
                    {k} ceiling: <span className="font-black">{v}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/20">
            <div className="flex flex-col">
              <span className="text-[8px] text-muted-foreground font-black uppercase tracking-tighter">
                CONTRACT FEE
              </span>
              <div className="flex items-center gap-1.5 text-base font-display font-black text-arena-gold">
                <Coins className="h-4 w-4" />
                {warrior.cost}G
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isScouted && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-[10px] font-black uppercase tracking-widest px-3 border-border/40 hover:bg-primary/10"
                  disabled={!canAffordScout}
                  onClick={() => onScout(warrior)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  SCOUT [25G]
                </Button>
              )}
              <Button
                size="sm"
                className={cn(
                  'h-9 px-4 font-black uppercase tracking-widest',
                  isElite
                    ? 'bg-arena-gold text-black hover:bg-arena-gold/80'
                    : 'bg-primary text-black hover:bg-primary/80'
                )}
                disabled={!canAfford || rosterFull}
                onClick={() => onRecruit(warrior, false)}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                HIRE
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3 font-black uppercase tracking-widest border-arena-gold/40 text-arena-gold hover:bg-arena-gold/10"
                disabled={!canAffordBonus || rosterFull}
                onClick={() => onRecruit(warrior, true)}
                title="Pay a 50g signing bonus — warrior arrives eager (+2 XP) and gets a gazette mention."
              >
                + BONUS [50G]
              </Button>
            </div>
          </div>
        </CardContent>
      </Surface>
    </motion.div>
  );
}

export default function Recruit() {
  const store = useGameStore();
  const { roster, treasury, rosterBonus, recruitPool, setState } = store;

  const navigate = useNavigate();
  const MAX_ROSTER = BASE_ROSTER_CAP + (rosterBonus ?? 0);

  const [scoutedIds, setScoutedIds] = useState<Set<string>>(new Set());
  const [scoutReports, setScoutReports] = useState<Record<string, PotentialScoutReport>>({});

  const rosterFull = roster.length >= MAX_ROSTER;
  const [activeTiers, setActiveTiers] = useState<Set<RecruitTier>>(
    new Set(['Common', 'Promising', 'Exceptional', 'Prodigy'])
  );
  const [activeStyle, setActiveStyle] = useState<FightingStyle | 'all'>('all');
  const [sortBy, setSortBy] = useState<'cost-asc' | 'cost-desc' | 'potential-desc' | 'age-asc'>(
    'potential-desc'
  );

  const canRefresh = canTransact(treasury, REFRESH_COST);

  const handleRecruit = useCallback(
    (w: PoolWarrior, bonus: boolean = false) => {
      setState((draft: GameStore) => {
        const BONUS_COST = 50;
        const totalCost = w.cost + (bonus ? BONUS_COST : 0);
        if (!canTransact(draft.treasury, totalCost)) {
          toast.error(`Not enough funds! Need ${totalCost}g.`);
          return;
        }
        if (draft.roster.length >= MAX_ROSTER) {
          toast.error('Roster full! Retire or release a warrior first.');
          return;
        }

        // 1.0 Deterministic ID: Recruitment uses hash-based seed for bit-identity
        const recruitRng = new SeededRNGService(draft.week + hashStr(w.name));
        const warrior = makeWarrior(
          recruitRng.uuid('warrior') as any,
          w.name,
          w.style,
          w.attributes,
          { age: w.age, potential: w.potential }
        );

        // Signing bonus perk — +2 XP and an "Eager" flair tag.
        if (bonus) {
          (warrior as any).xp = ((warrior as any).xp ?? 0) + 2;
          const tags = (warrior as any).tags ?? (warrior as any).flair ?? [];
          (warrior as any).tags = [...tags, 'Eager'];
        }

        draft.roster.push(warrior);
        draft.treasury -= totalCost;
        draft.recruitPool = (draft.recruitPool ?? []).filter((p: PoolWarrior) => p.id !== w.id);

        draft.ledger.push({
          id: String(hashStr(`${draft.week}-${w.name}`)),
          week: draft.week,
          label: `Recruit: ${w.name} (${w.tier})${bonus ? ' + signing bonus' : ''}`,
          amount: -totalCost,
          category: 'recruit',
        });

        const items = [
          `${draft.player.stableName} signed ${w.name}, a ${w.tier.toLowerCase()} ${STYLE_DISPLAY_NAMES[w.style]}.`,
        ];
        if (bonus)
          items.push(
            `A 50g signing bonus sealed the deal — ${w.name} arrived eager to prove themselves.`
          );
        draft.newsletter.push({
          id: String(hashStr(`${draft.week}-recruitment-${w.name}`)),
          week: draft.week,
          title: 'Recruitment',
          items,
        });

        toast.success(`${w.name} has joined your stable! (-${totalCost}g)`);
      });
    },
    [MAX_ROSTER, setState]
  );

  const handleScout = useCallback(
    (w: PoolWarrior) => {
      setState((draft: GameStore) => {
        if (!canTransact(draft.treasury, 25)) {
          toast.error('Not enough gold to scout potential (need 25g).');
          return;
        }
        setScoutedIds((s) => new Set(s).add(w.id));
        // Deterministic partial reveal — same (recruit, week) always yields the
        // same subset, so save/load doesn't shuffle the intel.
        const report = revealRecruitPotential(w.id, draft.week, w.potential);
        setScoutReports((prev) => ({ ...prev, [w.id]: report }));
        draft.treasury -= 25;
        draft.ledger.push({
          id: String(hashStr(`${draft.week}-scout-${w.name}`)),
          week: draft.week,
          label: `Scout Potential: ${w.name}`,
          amount: -25,
          category: 'other',
        });
        toast.success(`Scouted potential for ${w.name}! (-25g)`);
      });
    },
    [setState]
  );

  const handleRefresh = useCallback(() => {
    setState((draft: GameStore) => {
      if (!canTransact(draft.treasury, REFRESH_COST)) {
        toast.error(`Not enough gold! Need ${REFRESH_COST}g to refresh.`);
        return;
      }

      // ⚡ Bolt: Moving name collection inside the callback to avoid per-render overhead.
      // We use a single-pass loop approach to avoid intermediate array allocations (O(N) vs O(N*M)).
      const usedNames = new Set<string>();
      draft.roster.forEach((w: any) => usedNames.add(w.name));
      draft.graveyard.forEach((w: any) => usedNames.add(w.name));
      draft.retired.forEach((w: any) => usedNames.add(w.name));
      (draft.rivals ?? []).forEach((r: any) => r.roster.forEach((w: any) => usedNames.add(w.name)));

      const newPool = fullRefreshPool(draft.week, usedNames);
      draft.treasury -= REFRESH_COST;
      draft.recruitPool = newPool;
      draft.ledger.push({
        id: String(hashStr(`${draft.week}-pool-refresh`)),
        week: draft.week,
        label: 'Pool refresh',
        amount: -REFRESH_COST,
        category: 'other',
      });
      toast.success(`Scout pool refreshed! (-${REFRESH_COST}g)`);
    });
  }, [setState]);

  const handleCustomCreate = useCallback(
    (data: { name: string; style: FightingStyle; attributes: Attributes }) => {
      setState((draft: GameStore) => {
        if (!canTransact(draft.treasury, CUSTOM_COST)) {
          toast.error(`Not enough gold! Need ${CUSTOM_COST}g for custom build.`);
          return;
        }
        if (draft.roster.length >= MAX_ROSTER) {
          toast.error('Roster full!');
          return;
        }
        const rng = new SeededRNGService(draft.week + hashStr(data.name));
        const id = rng.uuid('warrior');
        const warrior = makeWarrior(id, data.name, data.style, data.attributes);

        draft.roster.push(warrior);
        draft.treasury -= CUSTOM_COST;
        draft.ledger.push({
          id: String(hashStr(`${draft.week}-custom-${data.name}`)),
          week: draft.week,
          label: `Custom Build: ${data.name}`,
          amount: -CUSTOM_COST,
          category: 'recruit',
        });

        toast.success(`${data.name} has joined your stable! (-${CUSTOM_COST}g)`);
        setTimeout(() => navigate({ to: `/warrior/${id}` }), 0);
      });
    },
    [setState, navigate, MAX_ROSTER]
  );

  const filteredPool = useMemo(() => {
    let pool = [...(recruitPool ?? [])];

    // Filter by Tier
    pool = pool.filter((w: PoolWarrior) => activeTiers.has(w.tier));

    // Filter by Style
    if (activeStyle !== 'all') {
      pool = pool.filter((w: PoolWarrior) => w.style === activeStyle);
    }

    // Sort
    pool.sort((a: PoolWarrior, b: PoolWarrior) => {
      switch (sortBy) {
        case 'cost-asc':
          return a.cost - b.cost;
        case 'cost-desc':
          return b.cost - a.cost;
        case 'potential-desc':
          return potentialRating(b.potential) - potentialRating(a.potential);
        case 'age-asc':
          return a.age - b.age;
        default:
          return 0;
      }
    });

    return pool;
  }, [recruitPool, activeTiers, activeStyle, sortBy]);

  const toggleTier = (tier: RecruitTier) => {
    const next = new Set(activeTiers);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);
    setActiveTiers(next);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={UserPlus}
        title="Recruit Warriors"
        subtitle="STABLE · RECRUITMENT · CONTRACT MARKET"
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 font-mono">
              <Users className="h-3 w-3" />
              {roster.length}/{MAX_ROSTER}
            </Badge>
            <Badge variant="outline" className="gap-1.5 font-mono">
              <Coins className="h-3 w-3 text-arena-gold" />
              {treasury}g
            </Badge>
          </div>
        }
      />

      {rosterFull && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Roster full! Retire or release a warrior before recruiting.
        </div>
      )}

      <Tabs defaultValue="scout" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="scout" className="gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Scout Pool
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-1.5">
            <Hammer className="h-3.5 w-3.5" />
            Custom Build
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scout" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Archetype B: Left Filter Sidebar (span-3) */}
            <aside className="lg:col-span-3 space-y-6 sticky top-6">
              <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                  FILTER ENGINE
                </span>
              </div>

              <Surface variant="glass" className="space-y-6">
                {/* Tiers */}
                <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
                    Market Tiers
                  </label>
                  <div className="space-y-3">
                    {(['Common', 'Promising', 'Exceptional', 'Prodigy'] as RecruitTier[]).map(
                      (tier) => {
                        const isActive = activeTiers.has(tier);
                        return (
                          <button
                            key={tier}
                            onClick={() => toggleTier(tier)}
                            className={cn(
                              'w-full flex items-center justify-between p-2 border transition-all',
                              isActive
                                ? 'bg-white/[0.05] border-white/20'
                                : 'bg-transparent border-transparent opacity-40 grayscale hover:grayscale-0 hover:opacity-100'
                            )}
                          >
                            <TierBadge tier={tier} />
                            <span className="font-mono text-[10px] text-arena-gold">
                              {TIER_COST[tier]}g
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Style */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
                    Combat Style
                  </label>
                  <Select value={activeStyle} onValueChange={(v) => setActiveStyle(v as any)}>
                    <SelectTrigger className="h-9 text-[10px] uppercase font-black tracking-widest bg-black/20 border-white/10">
                      <SelectValue placeholder="All Styles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ALL_STYLES</SelectItem>
                      {Object.entries(STYLE_DISPLAY_NAMES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
                    Sequence Order
                  </label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="h-9 text-[10px] uppercase font-black tracking-widest bg-black/20 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="potential-desc">POTENTIAL_DESC</SelectItem>
                      <SelectItem value="cost-asc">COST_ASCENDING</SelectItem>
                      <SelectItem value="cost-desc">COST_DESCENDING</SelectItem>
                      <SelectItem value="age-asc">AGE_ASCENDING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Refresh */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
                    Temporal Refresh
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between h-10 px-4 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/10 transition-colors"
                    onClick={handleRefresh}
                    disabled={!canRefresh}
                  >
                    <span>REFRESH_LIST</span>
                    <div className="flex items-center gap-1.5 text-arena-gold">
                      <Coins className="h-3 w-3" />
                      {REFRESH_COST}g
                    </div>
                  </Button>
                </div>
              </Surface>
            </aside>

            {/* Right Result Grid (span-9) */}
            <main className="lg:col-span-9 space-y-6">
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  {filteredPool.length} Profiles_Match_Criteria / {recruitPool.length} TOTAL
                </p>
              </div>

              {filteredPool.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredPool.map((w) => (
                    <RecruitCard
                      key={w.id}
                      warrior={w}
                      canAfford={canTransact(treasury, w.cost)}
                      rosterFull={rosterFull}
                      onRecruit={handleRecruit}
                      isScouted={scoutedIds.has(w.id)}
                      onScout={handleScout}
                      canAffordScout={canTransact(treasury, 25)}
                      canAffordBonus={canTransact(treasury, w.cost + 50)}
                      scoutReport={scoutReports[w.id]}
                    />
                  ))}
                </div>
              ) : (
                <Surface variant="glass" className="py-48 text-center border-dashed opacity-50">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="font-display font-black uppercase tracking-widest text-sm text-muted-foreground/30">
                    NO MATCHES DETECTED
                  </p>
                </Surface>
              )}
            </main>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="mt-8 space-y-4">
          <div className="rounded-none border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
            <Hammer className="h-4 w-4 inline mr-1.5" />
            Custom warriors cost{' '}
            <span className="font-semibold text-foreground">{CUSTOM_COST}g</span> and start with 66
            total attribute points. You choose the distribution.
            {!canTransact(treasury, CUSTOM_COST) && (
              <span className="text-destructive ml-1">(Need {CUSTOM_COST - treasury}g more)</span>
            )}
          </div>
          <WarriorBuilder
            onCreateWarrior={handleCustomCreate}
            maxRoster={MAX_ROSTER}
            currentRosterSize={roster.length}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
