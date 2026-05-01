import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { FightingStyle, STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, type Attributes } from '@/types/game';
import { BASE_ROSTER_CAP } from '@/data/constants';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { hashStr } from '@/utils/random';
import {
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
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus,
  RefreshCw,
  Hammer,
  Search,
  Heart,
  Zap,
  Eye,
  Quote,
  Star,
  Coins,
  Shield,
  Target,
  Sword,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';

const CUSTOM_COST = 200;

const TIER_CONFIG: Record<
  RecruitTier,
  { border: string; text: string; bg: string; ring: 'bronze' | 'silver' | 'gold' | 'blood' }
> = {
  Common: {
    border: 'border-white/10',
    text: 'text-muted-foreground',
    bg: 'bg-white/5',
    ring: 'bronze',
  },
  Promising: {
    border: 'border-white/20',
    text: 'text-foreground',
    bg: 'bg-white/10',
    ring: 'silver',
  },
  Exceptional: {
    border: 'border-primary/30',
    text: 'text-primary',
    bg: 'bg-primary/5',
    ring: 'blood',
  },
  Prodigy: {
    border: 'border-arena-gold/30',
    text: 'text-arena-gold',
    bg: 'bg-arena-gold/5',
    ring: 'gold',
  },
};

function TierBadge({ tier }: { tier: RecruitTier }) {
  const stars = TIER_STARS[tier];
  const config = TIER_CONFIG[tier];
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[9px] gap-1.5 font-black uppercase tracking-[0.2em] px-3 py-1 rounded-none border-white/10',
        config.text
      )}
    >
      {stars > 0 && (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} className="h-2 w-2 fill-current" />
          ))}
        </div>
      )}
      {tier}
    </Badge>
  );
}

function StatBar({ label, value, max = 21 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const colorClass = value >= 16 ? 'bg-primary' : value >= 12 ? 'bg-arena-gold' : 'bg-white/20';

  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-black uppercase text-muted-foreground/40 w-8 tracking-tighter">
        {label.slice(0, 3)}
      </span>
      <div className="flex-1 h-1 bg-white/5 rounded-none overflow-hidden relative">
        <div
          className={cn('h-full transition-all duration-1000 ease-out', colorClass)}
          style={{ width: `${pct}%` }}
        />
        {/* Threshold Markers */}
        <div className="absolute top-0 left-[60%] w-px h-full bg-white/10" />
        <div className="absolute top-0 left-[80%] w-px h-full bg-white/10" />
      </div>
      <span className="text-[11px] font-display font-black w-6 text-right text-foreground">
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
  const config = TIER_CONFIG[warrior.tier];

  return (
    <Surface
      variant="glass"
      className="group p-0 border-white/5 hover:border-primary/20 transition-all duration-500 overflow-hidden"
    >
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <ImperialRing size="md" variant={config.ring}>
              <Sword className={cn('h-5 w-5', config.text)} />
            </ImperialRing>
            <div>
              <h3 className="text-xl font-display font-black uppercase tracking-tight text-foreground leading-none mb-2">
                {warrior.name}
              </h3>
              <div className="flex items-center gap-4">
                <StatBadge styleName={warrior.style} showFullName />
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
                  Age {warrior.age}
                </span>
              </div>
            </div>
          </div>
          <TierBadge tier={warrior.tier} />
        </div>

        {/* Intelligence Overlay */}
        {isScouted ? (
          <div className="bg-primary/5 border border-primary/20 p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Intelligence Synchronized
                </span>
              </div>
              <Badge className="bg-primary text-primary-foreground font-black text-[10px] rounded-none px-3">
                POTENTIAL: {grade}
              </Badge>
            </div>
            {scoutReport && (
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                "{scoutReport.summary}"
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/5 p-6 flex items-center justify-between group/scout">
            <div className="flex items-center gap-3 opacity-40">
              <Info className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Personnel Intel Redacted
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[9px] font-black uppercase tracking-widest border-white/10 hover:border-primary/50 transition-all rounded-none"
              disabled={!canAffordScout}
              onClick={() => onScout(warrior)}
            >
              Scout Profile [25G]
            </Button>
          </div>
        )}

        {/* Attributes Grid */}
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-4 bg-white/[0.01] border border-white/5 p-6">
            {ATTRIBUTE_KEYS.map((key) => (
              <StatBar key={key} label={key} value={warrior.attributes[key]} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">
                Health Capacity
              </span>
              <div className="flex items-center gap-3">
                <Heart className="h-3.5 w-3.5 text-destructive" />
                <span className="text-lg font-display font-black text-foreground">
                  {warrior.derivedStats.hp}
                </span>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">
                Endurance Pool
              </span>
              <div className="flex items-center gap-3">
                <Zap className="h-3.5 w-3.5 text-arena-fame" />
                <span className="text-lg font-display font-black text-foreground">
                  {warrior.derivedStats.endurance}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lore / Quote */}
        <div className="relative pl-6 border-l border-white/10">
          <Quote className="absolute -left-1 top-0 h-4 w-4 text-white/5" />
          <p className="text-[11px] text-muted-foreground/60 italic leading-relaxed">
            {warrior.lore}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 pt-8 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
              Contract Value
            </span>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-arena-gold" />
              <span className="text-2xl font-display font-black text-arena-gold">
                {warrior.cost}G
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="flex-1 sm:flex-none h-14 px-8 bg-primary text-primary-foreground font-black uppercase text-[11px] tracking-[0.2em] rounded-none hover:shadow-[0_0_25px_rgba(135,34,40,0.4)] transition-all"
              disabled={!canAfford || rosterFull}
              onClick={() => onRecruit(warrior, false)}
            >
              <UserPlus className="h-4 w-4 mr-3" />
              Contract Secure
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none h-14 px-6 border-arena-gold/30 text-arena-gold font-black uppercase text-[10px] tracking-widest rounded-none hover:bg-arena-gold/5 transition-all"
              disabled={!canAffordBonus || rosterFull}
              onClick={() => onRecruit(warrior, true)}
              title="Pay a 50g signing bonus — warrior arrives eager (+2 XP) and gets a gazette mention."
            >
              + Bonus [50G]
            </Button>
          </div>
        </div>
      </div>
    </Surface>
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

        const recruitRng = new SeededRNGService(draft.week + hashStr(w.name));
        const warrior = makeWarrior(
          recruitRng.uuid('warrior') as WarriorId,
          w.name,
          w.style,
          w.attributes,
          { age: w.age, potential: w.potential }
        );

        if (bonus) {
          warrior.xp = (warrior.xp ?? 0) + 2;
          const currentFlair = warrior.flair ?? [];
          warrior.flair = [...currentFlair, 'Eager'];
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

      const usedNames = new Set<string>();
      draft.roster.forEach((w: Warrior) => usedNames.add(w.name));
      draft.graveyard.forEach((w: Warrior) => usedNames.add(w.name));
      draft.retired.forEach((w: Warrior) => usedNames.add(w.name));
      (draft.rivals ?? []).forEach((r) => r.roster.forEach((w: Warrior) => usedNames.add(w.name)));

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
    pool = pool.filter((w: PoolWarrior) => activeTiers.has(w.tier));
    if (activeStyle !== 'all') {
      pool = pool.filter((w: PoolWarrior) => w.style === activeStyle);
    }
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
    <PageFrame size="xl">
      <PageHeader
        title="Personnel Acquisition"
        subtitle="STABLE · CONTRACT_MARKET · Wk {week}"
        actions={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Roster Capacity
              </span>
              <span className="text-sm font-display font-black text-foreground">
                {roster.length} / {MAX_ROSTER}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Available Credits
              </span>
              <span className="text-sm font-display font-black text-arena-gold">{treasury}G</span>
            </div>
          </div>
        }
      />

      {rosterFull && (
        <Surface
          variant="glass"
          className="border-destructive/30 bg-destructive/5 p-6 mb-8 flex items-center gap-6"
        >
          <ImperialRing size="sm" variant="blood">
            <Shield className="h-4 w-4 text-destructive" />
          </ImperialRing>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-destructive">
              Roster Capacity Exhausted
            </p>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest italic">
              Protocol: Decommission active assets before acquiring new recruits.
            </p>
          </div>
        </Surface>
      )}

      <Tabs defaultValue="scout" className="w-full space-y-12">
        <TabsList className="w-full h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none">
          <TabsTrigger
            value="scout"
            className="flex-1 h-full font-black uppercase text-[10px] tracking-[0.3em] rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Personnel Registry
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className="flex-1 h-full font-black uppercase text-[10px] tracking-[0.3em] rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Custom Specification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scout" className="mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Left Sidebar */}
            <aside className="space-y-8">
              <SectionDivider label="Filter Engine" />

              <div className="space-y-8">
                {/* Tiers */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    Market Tier Filter
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {(['Common', 'Promising', 'Exceptional', 'Prodigy'] as RecruitTier[]).map(
                      (tier) => {
                        const isActive = activeTiers.has(tier);
                        const config = TIER_CONFIG[tier];
                        return (
                          <button
                            key={tier}
                            onClick={() => toggleTier(tier)}
                            className={cn(
                              'group flex items-center justify-between p-4 border transition-all',
                              isActive
                                ? 'bg-white/[0.05] border-white/20'
                                : 'bg-transparent border-white/5 opacity-20 grayscale hover:opacity-100 hover:grayscale-0'
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn('w-1.5 h-1.5', config.bg)} />
                              <span
                                className={cn(
                                  'text-[10px] font-black uppercase tracking-widest',
                                  isActive ? 'text-foreground' : 'text-muted-foreground'
                                )}
                              >
                                {tier}
                              </span>
                            </div>
                            <span className="font-display font-black text-[10px] text-arena-gold">
                              {TIER_COST[tier]}G
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Style */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    Tactical Archetype
                  </label>
                  <Select value={activeStyle} onValueChange={(v) => setActiveStyle(v as string)}>
                    <SelectTrigger className="h-12 bg-white/[0.02] border-white/10 rounded-none font-black uppercase text-[10px] tracking-widest">
                      <SelectValue placeholder="All Archetypes" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-950 border-white/10 rounded-none">
                      <SelectItem value="all">ALL ARCHETYPES</SelectItem>
                      {Object.entries(STYLE_DISPLAY_NAMES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    Registry Sequence
                  </label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as string)}>
                    <SelectTrigger className="h-12 bg-white/[0.02] border-white/10 rounded-none font-black uppercase text-[10px] tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-950 border-white/10 rounded-none">
                      <SelectItem value="potential-desc">POTENTIAL: HIGH TO LOW</SelectItem>
                      <SelectItem value="cost-asc">VALUE: LOW TO HIGH</SelectItem>
                      <SelectItem value="cost-desc">VALUE: HIGH TO LOW</SelectItem>
                      <SelectItem value="age-asc">AGE: YOUNGEST FIRST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Refresh */}
                <Button
                  onClick={handleRefresh}
                  disabled={!canRefresh}
                  className="w-full h-16 bg-white/[0.02] border border-white/10 text-foreground hover:bg-white/5 transition-all rounded-none flex items-center justify-between px-6 group"
                >
                  <div className="flex items-center gap-4">
                    <RefreshCw className="h-4 w-4 text-primary group-hover:rotate-180 transition-all duration-700" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Sync Registry
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-3 w-3 text-arena-gold" />
                    <span className="font-display font-black text-arena-gold text-xs">
                      {REFRESH_COST}G
                    </span>
                  </div>
                </Button>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ImperialRing size="xs" variant="blood">
                    <Target className="h-3 w-3" />
                  </ImperialRing>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                    Showing {filteredPool.length} of {recruitPool.length} Identified Candidates
                  </span>
                </div>
              </div>

              {filteredPool.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
                <Surface
                  variant="glass"
                  className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
                >
                  <ImperialRing size="lg" variant="bronze" className="opacity-20">
                    <Search className="h-8 w-8" />
                  </ImperialRing>
                  <div className="space-y-2">
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                      Zero Results Detected
                    </p>
                    <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
                      Broaden filtering parameters or synchronize registry.
                    </p>
                  </div>
                </Surface>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="mt-0 space-y-12 focus-visible:outline-none">
          <Surface
            variant="glass"
            className="p-8 border-primary/20 bg-primary/5 flex items-center gap-8"
          >
            <ImperialRing size="md" variant="blood">
              <Hammer className="h-5 w-5 text-primary" />
            </ImperialRing>
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground leading-none">
                Custom Specification Protocol
              </h3>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                Unit Cost: <span className="text-arena-gold font-display font-black">200G</span> ·
                Allocation: <span className="text-foreground font-black">66 Attribute Points</span>{' '}
                · Full tactical customization enabled.
              </p>
            </div>
          </Surface>

          <WarriorBuilder
            onCreateWarrior={handleCustomCreate}
            maxRoster={MAX_ROSTER}
            currentRosterSize={roster.length}
          />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}
