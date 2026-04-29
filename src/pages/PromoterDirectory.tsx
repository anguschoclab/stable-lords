/**
 * Stable Lords — Promoter Directory
 * Browse all promoters in the realm with their personalities,
 * booking history, and current capacity.
 */
import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import type { Promoter, BoutOffer, PromoterPersonality } from '@/types/state.types';
import { PERSONALITY_CONFIG } from '@/data/promoterPersonalityConfig';
import { STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Sword, History, ArrowRight, Building2, DollarSign } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/ui/PageHeader';

const TIER_COLORS: Record<Promoter['tier'], string> = {
  Local: 'bg-muted/40 text-muted-foreground border-border/40',
  Regional: 'bg-accent/20 text-accent border-accent/30',
  National: 'bg-arena-fame/20 text-arena-fame border-arena-fame/30',
  Legendary: 'bg-arena-gold/20 text-arena-gold border-arena-gold/30',
};

/** Calculate active offers for a promoter */
function calculatePromoterStats(
  promoterId: string,
  offers: Record<string, BoutOffer>,
  currentWeek: number
) {
  const promoterOffers = Object.values(offers).filter((o) => o.promoterId === promoterId);
  const activeThisWeek = promoterOffers.filter(
    (o) => o.boutWeek === currentWeek && o.status === 'Signed'
  ).length;
  const pendingProposals = promoterOffers.filter((o) => o.status === 'Proposed').length;
  const totalOffers = promoterOffers.length;

  return { activeThisWeek, pendingProposals, totalOffers };
}

/** Format large numbers with commas */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

interface PromoterCardProps {
  promoter: Promoter;
  offers: Record<string, BoutOffer>;
  currentWeek: number;
}

function PromoterCard({ promoter, offers, currentWeek }: PromoterCardProps) {
  const personality = PERSONALITY_CONFIG[promoter.personality];
  const tierColor = TIER_COLORS[promoter.tier];
  const stats = calculatePromoterStats(promoter.id, offers, currentWeek);
  const capacityUsed = stats.activeThisWeek;
  const capacityPercent = (capacityUsed / promoter.capacity) * 100;

  return (
    <Card className="group hover:border-primary/50 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-base font-black uppercase tracking-wider text-primary truncate">
              {promoter.name}
            </CardTitle>
            <div className="text-[10px] font-mono uppercase flex items-center gap-1.5 flex-wrap text-muted-foreground">
              <Badge variant="outline" className={`text-[9px] ${tierColor}`}>
                {promoter.tier}
              </Badge>
              <span className="opacity-60">•</span>
              <span className="opacity-60">Age {promoter.age}</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] uppercase font-bold flex items-center gap-1 ${personality.color}`}
          >
            {personality.icon}
            {personality.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Personality Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {personality.description}
        </p>

        {/* Style Biases */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
            <Sword className="h-3 w-3" /> Preferred Styles
          </span>
          <div className="flex flex-wrap gap-1">
            {promoter.biases.length > 0 ? (
              promoter.biases.map((style) => (
                <Badge key={style} variant="secondary" className="text-[9px] uppercase">
                  {STYLE_DISPLAY_NAMES[style]}
                </Badge>
              ))
            ) : (
              <span className="text-[10px] italic text-muted-foreground">No style preferences</span>
            )}
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] uppercase tracking-wider">
            <span className="text-muted-foreground font-bold flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Weekly Capacity
            </span>
            <span
              className={`font-mono font-bold ${capacityPercent >= 80 ? 'text-destructive' : capacityPercent >= 50 ? 'text-arena-gold' : 'text-primary'}`}
            >
              {capacityUsed}/{promoter.capacity}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-none overflow-hidden">
            <div
              className={`h-full rounded-none transition-all duration-500 ${
                capacityPercent >= 80
                  ? 'bg-destructive'
                  : capacityPercent >= 50
                    ? 'bg-arena-gold'
                    : 'bg-primary'
              }`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          <div className="text-center space-y-0.5">
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Active</div>
            <div className="text-lg font-black font-mono">{stats.activeThisWeek}</div>
          </div>
          <div className="text-center space-y-0.5 border-x border-border/50">
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">
              Pending
            </div>
            <div className="text-lg font-black font-mono">{stats.pendingProposals}</div>
          </div>
          <div className="text-center space-y-0.5">
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Total</div>
            <div className="text-lg font-black font-mono">{stats.totalOffers}</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-[10px] uppercase font-bold"
          asChild
        >
          <Link to="/ops/promoter/$id" params={{ id: promoter.id }}>
            View Profile <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function PromoterDirectory() {
  const { promoters, boutOffers, week } = useGameStore();

  const { sortedPromoters, stats } = useMemo(() => {
    const promoterList = Object.values(promoters || {});

    // Sort by tier (Legendary first) then by legacy fame
    const sorted = promoterList.sort((a, b) => {
      const tierOrder = { Legendary: 4, National: 3, Regional: 2, Local: 1 };
      const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
      if (tierDiff !== 0) return tierDiff;
      return (b.history?.legacyFame || 0) - (a.history?.legacyFame || 0);
    });

    // Calculate aggregate stats
    const totalPurse = promoterList.reduce((sum, p) => sum + (p.history?.totalPursePaid || 0), 0);
    const totalNotableBouts = promoterList.reduce(
      (sum, p) => sum + (p.history?.notableBouts?.length || 0),
      0
    );
    const totalCapacity = promoterList.reduce((sum, p) => sum + p.capacity, 0);
    const totalActiveOffers = Object.values(boutOffers || {}).filter(
      (o) => o.status === 'Signed'
    ).length;

    return {
      sortedPromoters: sorted,
      stats: {
        totalPromoters: promoterList.length,
        totalPurse,
        totalNotableBouts,
        totalCapacity,
        totalActiveOffers,
      },
    };
  }, [promoters, boutOffers]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <PageHeader
        icon={Building2}
        title="Promoter Directory"
        subtitle={`OPS · PROMOTERS · WEEK ${week}`}
        actions={
          <Button
            asChild
            variant="outline"
            className="h-9 text-[11px] uppercase font-black tracking-widest gap-2"
          >
            <Link to="/ops/contracts">
              <Calendar className="h-3.5 w-3.5" />
              Booking Office
            </Link>
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Promoters
            </div>
            <div className="text-2xl font-black font-mono">{stats.totalPromoters}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total Purse Paid
            </div>
            <div className="text-2xl font-black font-mono">{formatNumber(stats.totalPurse)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500/5 to-transparent">
          <CardContent className="p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
              <History className="h-3 w-3" /> Notable Bouts
            </div>
            <div className="text-2xl font-black font-mono">{stats.totalNotableBouts}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
              <Users className="h-3 w-3" /> Total Capacity
            </div>
            <div className="text-2xl font-black font-mono">
              {stats.totalActiveOffers}/{stats.totalCapacity}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="mb-6 p-4 border border-border/50 rounded-none bg-muted/20">
        <h3 className="text-[11px] uppercase tracking-wider font-bold mb-3 text-muted-foreground">
          Personality Guide
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {(Object.keys(PERSONALITY_CONFIG) as PromoterPersonality[]).map((p) => (
            <div
              key={p}
              className={`p-2 rounded border text-[10px] space-y-1 ${PERSONALITY_CONFIG[p].color}`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {PERSONALITY_CONFIG[p].icon}
                {PERSONALITY_CONFIG[p].label}
              </div>
              <div className="opacity-80 leading-tight text-[9px]">
                {PERSONALITY_CONFIG[p].description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Promoter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPromoters.map((promoter) => (
          <PromoterCard
            key={promoter.id}
            promoter={promoter}
            offers={boutOffers || {}}
            currentWeek={week}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedPromoters.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-lg font-bold uppercase tracking-wider">No Promoters Available</p>
            <p className="text-[11px] text-muted-foreground">
              Promoters will appear here as the season progresses.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
