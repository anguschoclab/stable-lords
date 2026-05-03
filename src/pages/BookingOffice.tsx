import { useMemo, useState } from 'react';
import { useGameStore, useWorldState, type GameStore } from '@/state/useGameStore';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Heart,
  Ban,
  AlertTriangle,
  Zap,
  Award,
  Target,
} from 'lucide-react';
import {} from '@/types/shared.types';
import type { Warrior, PromoterPersonality, BoutOffer } from '@/types/state.types';
import { PERSONALITY_CONFIG } from '@/data/promoterPersonalityConfig';
import type { InjuryData } from '@/types/warrior.types';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';

/** Get fatigue status for display */
function getFatigueStatus(fatigue: number): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  if (fatigue <= 30)
    return {
      label: 'Optimal',
      color: 'text-primary',
      icon: <Heart className="h-3 w-3" />,
    };
  if (fatigue <= 60)
    return {
      label: 'Degraded',
      color: 'text-arena-gold',
      icon: <Clock className="h-3 w-3" />,
    };
  return {
    label: 'Critical',
    color: 'text-destructive',
    icon: <AlertTriangle className="h-3 w-3" />,
  };
}

/** Get injury severity badge */
function getInjuryBadge(
  injuries: InjuryData[]
): { label: string; color: string; count: number } | null {
  const blocking = injuries.filter((i) =>
    ['Moderate', 'Severe', 'Critical', 'Permanent'].includes(i.severity)
  );
  if (blocking.length === 0) return null;
  const first = blocking[0];
  if (!first) return null;
  const severest = blocking.reduce<InjuryData>((max, i) => {
    const order = ['Minor', 'Moderate', 'Severe', 'Critical', 'Permanent'];
    return order.indexOf(i.severity) > order.indexOf(max.severity) ? i : max;
  }, first);
  const colorMap: Record<string, string> = {
    Moderate: 'text-arena-gold',
    Severe: 'text-primary',
    Critical: 'text-destructive',
    Permanent: 'text-arena-fame',
  };
  const severity = severest.severity ?? 'Moderate';
  const color = colorMap[severity] ?? colorMap['Moderate'];
  return {
    label: severity,
    color,
    count: blocking.length,
  };
}

interface OfferCardProps {
  offer: BoutOffer;
  promoters: ReturnType<typeof useWorldState>['promoters'];
  roster: ReturnType<typeof useWorldState>['roster'];
  rivals: ReturnType<typeof useWorldState>['rivals'];
  signedOfferIds: Set<string>;
  onResponse: (
    offerId: string,
    warriorId: string | undefined,
    response: 'Accepted' | 'Declined'
  ) => void;
}

function OfferCard({
  offer,
  promoters,
  roster,
  rivals,
  signedOfferIds,
  onResponse,
}: OfferCardProps) {
  const promoter = promoters[offer.promoterId];
  const playerWarriorId = offer.warriorIds.find((id) => roster.some((w) => w.id === id));
  const playerWarrior = roster.find((w) => w.id === playerWarriorId);
  const opponentId = offer.warriorIds.find((id) => id !== playerWarriorId);

  let opponent: ({ stableName: string } & (typeof rivals)[0]['roster'][0]) | null = null;
  for (const rival of rivals || []) {
    const found = rival.roster.find((w) => w.id === opponentId);
    if (found) {
      opponent = { ...found, stableName: rival.owner.stableName };
      break;
    }
  }

  const personality = promoter?.personality as PromoterPersonality;
  const personalityConfig = personality ? PERSONALITY_CONFIG[personality] : null;
  const fatigue = playerWarrior?.fatigue ?? 0;
  const fatigueStatus = getFatigueStatus(fatigue);
  const injuryBadge = getInjuryBadge(playerWarrior?.injuries || []);
  const isSigned = signedOfferIds.has(offer.id);

  return (
    <Surface
      variant="glass"
      className={cn(
        'border-white/5 overflow-hidden group hover:border-primary/20 transition-all duration-500',
        isSigned && 'opacity-60 grayscale-[0.5]'
      )}
    >
      <div className="p-6 border-b border-white/5 flex items-start justify-between bg-white/[0.01]">
        <div className="flex items-center gap-4">
          <ImperialRing size="sm" variant="bronze">
            <Briefcase className="h-4 w-4 text-muted-foreground/40" />
          </ImperialRing>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground leading-none mb-1">
              {promoter?.name || 'External Syndicate'}
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[8px] font-black uppercase text-primary tracking-widest">
                {promoter?.tier} PROMOTER
              </span>
              {personalityConfig && (
                <span
                  className={cn(
                    'text-[8px] font-black uppercase tracking-widest',
                    personalityConfig.color
                  )}
                >
                  {personality}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-display font-black text-arena-gold leading-none">
            {offer.purse}G
          </div>
          <p className="text-[8px] font-black uppercase text-muted-foreground/20 tracking-tighter mt-1">
            ALLOCATED PURSE
          </p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 text-center space-y-2">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/40">
              DEPLOYMENT
            </span>
            <div className="text-xs font-display font-black uppercase text-foreground">
              {playerWarrior?.name}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span
                className={cn(
                  'text-[8px] font-black uppercase tracking-widest',
                  fatigueStatus.color
                )}
              >
                {fatigueStatus.label} [{100 - fatigue}%]
              </span>
              {injuryBadge && (
                <span
                  className={cn(
                    'text-[8px] font-black uppercase tracking-widest',
                    injuryBadge.color
                  )}
                >
                  / {injuryBadge.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 opacity-20">
            <Zap className="h-4 w-4" />
            <div className="h-8 w-px bg-white/20" />
          </div>

          <div className="flex-1 text-center space-y-2">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">
              TARGET
            </span>
            <div className="text-xs font-display font-black uppercase text-muted-foreground/80">
              {opponent?.name || 'CLASSIFIED'}
            </div>
            <div className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">
              {opponent?.stableName || 'UNKNOWN STABLE'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              Temporal Window
            </span>
            <div className="text-[11px] font-display font-black uppercase">
              Operation Week {offer.boutWeek}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              Projection Index
            </span>
            <div className="text-[11px] font-display font-black uppercase text-arena-gold">
              {offer.hype}% Expected Hype
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white/[0.02] flex gap-2">
        {isSigned ? (
          <div className="flex-1 h-12 flex items-center justify-center gap-3 border border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
            <CheckCircle2 className="h-4 w-4" /> Execution Confirmed
          </div>
        ) : (
          <>
            <Button
              className="flex-1 h-12 bg-primary text-primary-foreground rounded-none gap-3 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-primary/90 transition-all"
              onClick={() => onResponse(offer.id, playerWarriorId, 'Accepted')}
              disabled={!!injuryBadge || fatigue > 60}
            >
              Sign Protocol
            </Button>
            <Button
              variant="outline"
              className="w-12 h-12 rounded-none border-white/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 p-0 transition-all"
              onClick={() => onResponse(offer.id, playerWarriorId, 'Declined')}
            >
              <Ban className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </Surface>
  );
}

export default function BookingOffice() {
  const state = useWorldState();
  const { setState } = useGameStore();
  const { promoters, boutOffers, roster, week, rivals } = state;
  const [activeTab, setActiveTab] = useState('this-week');
  const [signedOfferIds, setSignedOfferIds] = useState<Set<string>>(new Set());
  const [selectedWarriorId, setSelectedWarriorId] = useState<string | null>(null);
  const [trackedWeek, setTrackedWeek] = useState(week);

  if (week !== trackedWeek) {
    setTrackedWeek(week);
    setSignedOfferIds(new Set());
    setSelectedWarriorId(null);
  }

  const { thisWeekOffers, upcomingOffers, idleWarriors, highestPurse } = useMemo(() => {
    const playerOffers = Object.values(boutOffers).filter(
      (offer: BoutOffer) =>
        offer.warriorIds.some((wId: string) =>
          roster.some((playerW: Warrior) => playerW.id === wId)
        ) &&
        (offer.status === 'Proposed' || signedOfferIds.has(offer.id))
    );

    const filtered = selectedWarriorId
      ? playerOffers.filter((o) =>
          o.warriorIds.includes(selectedWarriorId as import('@/types/warrior.types').WarriorId)
        )
      : playerOffers;

    const bestByPromoter = (offers: BoutOffer[]): BoutOffer[] => {
      const map = new Map<string, BoutOffer>();
      offers.forEach((o) => {
        const score = o.purse * o.hype;
        const existing = map.get(o.promoterId);
        if (!existing || score > existing.purse * existing.hype) {
          map.set(o.promoterId, o);
        }
      });
      return Array.from(map.values());
    };

    const thisWeek = bestByPromoter(filtered.filter((o) => o.boutWeek === week + 2));
    const upcoming = bestByPromoter(filtered.filter((o) => o.boutWeek > week + 2));

    const warriorsWithOffers = new Set(playerOffers.flatMap((o) => o.warriorIds));
    const idle = roster.filter((w) => w.status === 'Active' && !warriorsWithOffers.has(w.id));
    const maxPurse = playerOffers.length > 0 ? Math.max(...playerOffers.map((o) => o.purse)) : 0;

    return {
      thisWeekOffers: thisWeek.sort((a, b) =>
        (promoters[b.promoterId]?.tier ?? '') > (promoters[a.promoterId]?.tier ?? '') ? 1 : -1
      ),
      upcomingOffers: upcoming.sort((a, b) => a.boutWeek - b.boutWeek),
      idleWarriors: idle,
      highestPurse: maxPurse,
    };
  }, [boutOffers, roster, week, promoters, signedOfferIds, selectedWarriorId]);

  const handleResponse = (
    offerId: string,
    warriorId: string | undefined,
    response: 'Accepted' | 'Declined'
  ) => {
    if (!warriorId) return;
    if (response === 'Accepted') {
      setSignedOfferIds((prev) => new Set(prev).add(offerId));
    }
    setState((s: GameStore) => {
      const next = respondToBoutOffer(state, offerId, warriorId, response);
      if (next.boutOffers) {
        s.boutOffers = next.boutOffers;
      }
    });
    toast.success(`Protocol ${response === 'Accepted' ? 'Initialized' : 'Terminated'}.`);
  };

  const acceptAllHonorable = () => {
    const honorableOffers = thisWeekOffers.filter(
      (o) => promoters[o.promoterId]?.personality === 'Honorable'
    );
    let accepted = 0;
    honorableOffers.forEach((offer) => {
      const warriorId = offer.warriorIds.find((id) => roster.some((w) => w.id === id));
      const warrior = roster.find((w) => w.id === warriorId);
      if (
        warriorId &&
        warrior &&
        (warrior.fatigue ?? 0) <= 60 &&
        !getInjuryBadge(warrior.injuries || [])
      ) {
        handleResponse(offer.id, warriorId, 'Accepted');
        accepted++;
      }
    });
    toast.success(`Batch execution complete: ${accepted} protocols signed.`);
  };

  return (
    <PageFrame size="xl">
      <PageHeader
        title="Booking Intelligence"
        subtitle={`OPS · CONTRACT_MANAGEMENT · WK ${week}`}
        actions={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Market Saturation
              </span>
              <span className="text-sm font-display font-black text-primary">
                {thisWeekOffers.length + upcomingOffers.length} Live Proposals
              </span>
            </div>
            <div className="flex flex-col items-end border-l border-white/5 pl-6">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Peak Valuation
              </span>
              <span className="text-sm font-display font-black text-arena-gold">
                {highestPurse.toLocaleString()}G CAP
              </span>
            </div>
          </div>
        }
      />

      <Surface variant="glass" className="flex items-center gap-12 p-8 border-white/5 mb-12">
        <div className="flex items-center gap-4">
          <ImperialRing size="sm" variant="blood">
            <Target className="h-4 w-4 text-primary" />
          </ImperialRing>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">
            Operational Overview
          </span>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">
              Idle Assets
            </span>
            <span
              className={cn(
                'font-display font-black text-lg leading-none',
                idleWarriors.length > 0 ? 'text-primary' : 'text-muted-foreground/40'
              )}
            >
              {idleWarriors.length}
            </span>
          </div>
          <div className="h-8 w-px bg-white/5" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">
              Personnel Deployed
            </span>
            <span className="font-display font-black text-lg leading-none">
              {roster.length - idleWarriors.length} / {roster.length}
            </span>
          </div>
        </div>

        <div className="ml-auto">
          <Button
            variant="outline"
            className="h-10 px-6 rounded-none border-white/10 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest flex items-center gap-3"
            onClick={acceptAllHonorable}
          >
            <Award className="h-3.5 w-3.5 text-primary" /> Execute All Safe Protocols
          </Button>
        </div>
      </Surface>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Left Rail Asset Registry */}
        <aside className="space-y-8">
          <SectionDivider label="Asset Registry" />
          <div className="grid grid-cols-1 gap-3">
            {roster.map((warrior) => {
              const hasAccepted = Object.values(boutOffers).some(
                (o) => o.warriorIds.includes(warrior.id) && o.status === 'Signed'
              );
              const isSelected = selectedWarriorId === warrior.id;
              const fatigueConfig = getFatigueStatus(warrior.fatigue ?? 0);

              return (
                <button
                  key={warrior.id}
                  onClick={() => setSelectedWarriorId(isSelected ? null : warrior.id)}
                  className={cn(
                    'flex flex-col gap-1 p-4 border transition-all text-left group relative overflow-hidden',
                    isSelected
                      ? 'bg-white/[0.05] border-white/20'
                      : 'bg-transparent border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0',
                    hasAccepted && 'border-l-4 border-l-primary'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-[10px] font-black uppercase tracking-widest',
                        isSelected ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {warrior.name}
                    </span>
                    {hasAccepted && <CheckCircle2 className="h-3 w-3 text-primary" />}
                  </div>
                  <span
                    className={cn(
                      'text-[8px] font-black uppercase tracking-tighter',
                      fatigueConfig.color
                    )}
                  >
                    {fatigueConfig.label} Readiness
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Rail Viewport */}
        <div className="lg:col-span-3 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none mb-12">
              <TabsList className="flex w-full h-full bg-transparent p-0 gap-1 rounded-none">
                <TabsTrigger
                  value="this-week"
                  className="flex-1 h-full rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground border-0"
                >
                  Immediate Proposals [{thisWeekOffers.length}]
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="flex-1 h-full rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground border-0"
                >
                  Future Slates [{upcomingOffers.length}]
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="this-week" className="mt-0 space-y-8">
              {thisWeekOffers.length === 0 ? (
                <Surface
                  variant="glass"
                  className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
                >
                  <ImperialRing size="lg" variant="bronze" className="opacity-20">
                    <Briefcase className="h-8 w-8" />
                  </ImperialRing>
                  <div className="space-y-2">
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                      Zero Proposals Found
                    </p>
                    <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
                      No immediate contract offers detected for the current window.
                    </p>
                  </div>
                </Surface>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {thisWeekOffers.map((o) => (
                    <OfferCard
                      key={o.id}
                      offer={o}
                      promoters={promoters}
                      roster={roster}
                      rivals={rivals}
                      signedOfferIds={signedOfferIds}
                      onResponse={handleResponse}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0 space-y-8">
              {upcomingOffers.length === 0 ? (
                <Surface
                  variant="glass"
                  className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
                >
                  <ImperialRing size="lg" variant="bronze" className="opacity-20">
                    <Briefcase className="h-8 w-8" />
                  </ImperialRing>
                  <div className="space-y-2">
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                      Upcoming Slates Empty
                    </p>
                    <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
                      No future engagement projections currently available.
                    </p>
                  </div>
                </Surface>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {upcomingOffers.map((o) => (
                    <OfferCard
                      key={o.id}
                      offer={o}
                      promoters={promoters}
                      roster={roster}
                      rivals={rivals}
                      signedOfferIds={signedOfferIds}
                      onResponse={handleResponse}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageFrame>
  );
}
