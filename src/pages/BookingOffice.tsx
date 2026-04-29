import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useGameStore, useWorldState, type GameStore } from '@/state/useGameStore';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Heart,
  Ban,
  AlertTriangle,
  Zap,
  Award,
  DollarSign,
  Target,
} from 'lucide-react';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import type { Warrior, PromoterPersonality, BoutOffer } from '@/types/state.types';
import { PERSONALITY_CONFIG } from '@/data/promoterPersonalityConfig';
import type { InjuryData } from '@/types/warrior.types';

/** Get fatigue status for display */
function getFatigueStatus(fatigue: number): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  if (fatigue <= 30)
    return {
      label: 'Fresh',
      color: 'bg-primary/20 text-primary border-primary/30',
      icon: <Heart className="h-3 w-3" />,
    };
  if (fatigue <= 60)
    return {
      label: 'Tired',
      color: 'bg-arena-gold/20 text-arena-gold border-arena-gold/30',
      icon: <Clock className="h-3 w-3" />,
    };
  return {
    label: 'Exhausted',
    color: 'bg-destructive/20 text-destructive border-destructive/30',
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
    Moderate: 'bg-arena-gold/20 text-arena-gold border-arena-gold/30',
    Severe: 'bg-arena-blood/20 text-arena-blood border-arena-blood/30',
    Critical: 'bg-destructive/20 text-destructive border-destructive/30',
    Permanent: 'bg-arena-fame/20 text-arena-fame border-arena-fame/30',
  };
  const severity = severest.severity ?? 'Moderate';
  const color = colorMap[severity] ?? colorMap['Moderate'];
  if (!color) {
    throw new Error('Color not found for severity');
  }
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

  return (
    <Surface
      variant="glass"
      padding="none"
      className="border-border/10 overflow-hidden group hover:border-primary/40 transition-all duration-300 shadow-xl flex flex-col"
    >
      <div className="bg-white/[0.03] border-b border-white/5 p-6 pb-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black uppercase tracking-widest text-primary truncate max-w-[150px]">
                {promoter?.name || 'Local Promoter'}
              </span>
              <Badge variant="outline" className="text-[9px] uppercase font-black border-white/10">
                {promoter?.tier}
              </Badge>
              {personalityConfig && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] uppercase font-black cursor-help',
                        personalityConfig.color
                      )}
                    >
                      <span className="flex items-center gap-1">
                        {personalityConfig.icon} {personality}
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-[11px] font-semibold">
                    {personalityConfig.tooltip}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-black uppercase opacity-40 tracking-widest truncate">
                {personalityConfig?.desc}
              </div>
              {promoter && (
                <Link
                  to="/ops/promoter/$id"
                  params={{ id: promoter.id }}
                  className="text-[9px] font-black uppercase tracking-widest text-primary/50 hover:text-primary transition-colors whitespace-nowrap ml-auto"
                >
                  View Profile →
                </Link>
              )}
            </div>
          </div>
          <div className="text-right pl-4">
            <div className="text-2xl font-display font-black text-foreground flex items-center gap-1.5 justify-end leading-none">
              <DollarSign className="h-4 w-4 text-arena-gold" />
              {offer.purse}G
            </div>
            <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">
              Contract Purse
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 flex-1 space-y-8">
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] font-black uppercase tracking-widest border-white/5',
              fatigueStatus.color
            )}
          >
            <span className="flex items-center gap-1.5">
              {fatigueStatus.icon} {fatigue}% Ready
            </span>
          </Badge>
          {injuryBadge && (
            <Badge
              variant="outline"
              className={cn(
                'text-[9px] font-black uppercase tracking-widest border-white/5',
                injuryBadge.color
              )}
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> {injuryBadge.label} Wound
              </span>
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between gap-6 px-4 py-6 bg-black/20 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
          <div className="text-center space-y-3 flex-1 min-w-0">
            <div className="text-[8px] font-black text-primary/40 uppercase tracking-[0.3em] mb-2">
              DEPLOYED
            </div>
            <div className="text-xs font-black uppercase tracking-tight text-foreground truncate">
              {playerWarrior?.name}
            </div>
            <div className="text-[9px] font-black text-muted-foreground/60 uppercase">
              {STYLE_DISPLAY_NAMES[playerWarrior?.style as FightingStyle]}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
            <div className="h-px w-8 bg-white/10" />
            <Zap className="h-4 w-4 text-arena-gold animate-pulse" />
            <div className="h-px w-8 bg-white/10" />
          </div>
          <div className="text-center space-y-3 flex-1 min-w-0">
            <div className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] mb-2">
              TARGET
            </div>
            <div className="text-xs font-black uppercase tracking-tight text-muted-foreground/80 truncate">
              {opponent?.name || 'Unknown'}
            </div>
            <div className="text-[9px] font-black text-muted-foreground/40 uppercase">
              {opponent ? STYLE_DISPLAY_NAMES[opponent.style as FightingStyle] : 'CLASSIFIED'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-2">
          <div className="space-y-1">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-1.5">
              <Clock className="h-3 w-3 opacity-40" /> SCHEDULE
            </div>
            <div className="text-sm font-black uppercase">WEEK {offer.boutWeek}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-1.5">
              <Target className="h-3 w-3 opacity-40 text-arena-gold" /> HYPE EST
            </div>
            <div className="text-sm font-black text-arena-gold">{offer.hype}% Hype</div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-black/40 border-t border-white/5 flex gap-3">
        {signedOfferIds.has(offer.id) ? (
          <Button
            className="flex-1 h-12 bg-primary/20 text-primary border border-primary/40 gap-2 font-black uppercase text-[10px] tracking-[0.2em] transition-all cursor-default"
            disabled
          >
            <CheckCircle2 className="h-4 w-4" /> Signed
          </Button>
        ) : (
          <Button
            className="flex-1 h-12 bg-primary text-black hover:bg-primary/90 gap-2 font-black uppercase text-[10px] tracking-[0.2em] transition-all"
            onClick={() => onResponse(offer.id, playerWarriorId, 'Accepted')}
            disabled={!!injuryBadge || fatigue > 60}
          >
            Sign Contract
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-12 h-12 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
          onClick={() => onResponse(offer.id, playerWarriorId, 'Declined')}
          title="Decline Offer"
        >
          <Ban className="h-5 w-5" />
        </Button>
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

  // Reset local UI state when the week advances
  if (week !== trackedWeek) {
    setTrackedWeek(week);
    setSignedOfferIds(new Set());
    setSelectedWarriorId(null);
  }

  // Group offers by week
  const { thisWeekOffers, upcomingOffers, idleWarriors, highestPurse } = useMemo(() => {
    const playerOffers = Object.values(boutOffers).filter(
      (offer: BoutOffer) =>
        offer.warriorIds.some((wId: string) =>
          roster.some((playerW: Warrior) => playerW.id === wId)
        ) &&
        (offer.status === 'Proposed' || signedOfferIds.has(offer.id))
    );

    const filtered = selectedWarriorId
      ? playerOffers.filter((o) => o.warriorIds.includes(selectedWarriorId as any))
      : playerOffers;

    // Keep only the best offer per promoter (highest purse × hype score)
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

    // Find warriors with no offers
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
    toast.success(`Offer ${response === 'Accepted' ? 'accepted' : 'declined'}.`);
  };

  // Bulk actions
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
    toast.success(`Accepted ${accepted} offers from honorable promoters.`);
  };

  const _declineAllFromPromoter = (promoterId: string) => {
    const promoterOffers = thisWeekOffers.filter((o) => o.promoterId === promoterId);
    let declined = 0;
    promoterOffers.forEach((offer) => {
      const warriorId = offer.warriorIds.find((id) => roster.some((w) => w.id === id));
      if (warriorId) {
        handleResponse(offer.id, warriorId, 'Declined');
        declined++;
      }
    });
    toast.success(`Declined ${declined} offers.`);
  };

  const renderOfferCard = (offer: BoutOffer) => (
    <OfferCard
      key={offer.id}
      offer={offer}
      promoters={promoters}
      roster={roster}
      rivals={rivals}
      signedOfferIds={signedOfferIds}
      onResponse={handleResponse}
    />
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-8 pb-20 max-w-7xl mx-auto">
        <PageHeader
          icon={Briefcase}
          title="Booking Office"
          subtitle={`OPS · CONTRACTS · WEEK ${week}`}
        />

        {/* Band 2 — Booking Intelligence Strip (Spec §6.4) */}
        <Surface
          variant="glass"
          className="flex items-center gap-12 p-5 border-l-4 border-l-primary/50"
        >
          <div className="flex items-center gap-3">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
              Market Overview
            </span>
          </div>

          <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">
                Open Proposals
              </span>
              <span className="font-display font-black text-xl text-primary leading-none mt-1">
                {thisWeekOffers.length + upcomingOffers.length}
              </span>
            </div>

            <div className="h-8 w-px bg-white/5" />

            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">
                Highest Purse
              </span>
              <span className="font-display font-black text-xl text-arena-gold leading-none mt-1">
                {(highestPurse || 0).toLocaleString()}G
              </span>
            </div>

            <div className="h-8 w-px bg-white/5" />

            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">
                Idle Warriors
              </span>
              <span
                className={cn(
                  'font-display font-black text-xl leading-none mt-1',
                  idleWarriors.length > 0 ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {idleWarriors.length}
              </span>
            </div>
          </div>

          <div className="ml-auto flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 text-[10px] font-black uppercase tracking-widest"
              onClick={acceptAllHonorable}
            >
              <Award className="h-3.5 w-3.5 mr-2 text-primary" /> Accept All (Safe)
            </Button>
          </div>
        </Surface>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Archetype D: Left Rail Roster (span-4) */}
          <div className="lg:col-span-4 space-y-4 sticky top-6">
            <div className="flex items-center gap-3 px-2">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                Roster Readiness
              </h3>
            </div>
            <Surface
              variant="glass"
              className="p-0 border-white/5 max-h-[700px] overflow-y-auto thin-scrollbar"
            >
              {roster.map((warrior) => {
                const hasAccepted = Object.values(boutOffers).some(
                  (o) => o.warriorIds.includes(warrior.id) && o.status === 'Signed'
                );
                const hasProposed = Object.values(boutOffers).some(
                  (o) => o.warriorIds.includes(warrior.id) && o.status === 'Proposed'
                );
                const fatigueConfig = getFatigueStatus(warrior.fatigue ?? 0);
                const isSelected = selectedWarriorId === warrior.id;

                return (
                  <button
                    key={warrior.id}
                    onClick={() => setSelectedWarriorId(isSelected ? null : warrior.id)}
                    className={cn(
                      'w-full p-4 border-b border-white/5 last:border-0 flex items-center gap-3 transition-colors text-left',
                      isSelected
                        ? 'bg-primary/10 border-l-2 border-l-primary'
                        : 'hover:bg-white/[0.03] border-l-2 border-l-transparent',
                      hasAccepted ? 'bg-primary/[0.03]' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        hasAccepted ? 'bg-primary' : hasProposed ? 'bg-arena-gold' : 'bg-white/10'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase truncate">{warrior.name}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">
                        {fatigueConfig.label} • {warrior.fatigue ?? 0}% FATIGUE
                      </p>
                    </div>
                    {hasAccepted && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] font-black px-1 h-4">
                        BOOKED
                      </Badge>
                    )}
                  </button>
                );
              })}
            </Surface>
          </div>

          {/* Right Rail Viewport (span-8) */}
          <div className="lg:col-span-8 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start h-auto bg-transparent border-b border-white/10 rounded-none p-0 mb-6 flex gap-6">
                <TabsTrigger
                  value="this-week"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground data-[state=active]:text-primary"
                >
                  Immediate Proposals ({thisWeekOffers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground data-[state=active]:text-primary"
                >
                  Future Slates ({upcomingOffers.length})
                </TabsTrigger>
              </TabsList>

              {selectedWarriorId && (
                <div className="flex items-center gap-2 mb-4 px-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                    Showing offers for
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                    {roster.find((w) => w.id === selectedWarriorId)?.name}
                  </span>
                  <button
                    onClick={() => setSelectedWarriorId(null)}
                    className="ml-auto text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    Show All ×
                  </button>
                </div>
              )}

              <TabsContent value="this-week" className="mt-0 space-y-6">
                {thisWeekOffers.length === 0 ? (
                  <Surface variant="glass" className="py-24 text-center">
                    <ShieldAlert className="h-16 w-16 opacity-10 mx-auto mb-4" />
                    <p className="font-display font-black uppercase tracking-widest text-sm text-muted-foreground/30">
                      {selectedWarriorId
                        ? `No proposals for ${roster.find((w) => w.id === selectedWarriorId)?.name ?? 'this warrior'} this week`
                        : `No proposals detected for week ${week + 2}`}
                    </p>
                  </Surface>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {thisWeekOffers.map(renderOfferCard)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="mt-0 space-y-6">
                {upcomingOffers.length === 0 && selectedWarriorId ? (
                  <Surface variant="glass" className="py-24 text-center">
                    <ShieldAlert className="h-16 w-16 opacity-10 mx-auto mb-4" />
                    <p className="font-display font-black uppercase tracking-widest text-sm text-muted-foreground/30">
                      No upcoming proposals for{' '}
                      {roster.find((w) => w.id === selectedWarriorId)?.name ?? 'this warrior'}
                    </p>
                  </Surface>
                ) : (
                  upcomingOffers.map(renderOfferCard)
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
