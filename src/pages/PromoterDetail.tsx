/**
 * Stable Lords — Promoter Detail
 * Deep dive into a single promoter's history, personality, and active offers.
 */
import React, { useMemo, useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useGameStore } from '@/state/useGameStore';
import type { Promoter, PromoterPersonality, BoutOffer } from '@/types/state.types';
import { STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Award,
  AlertTriangle,
  Sparkles,
  Building2,
  ArrowLeft,
  TrendingUp,
  History,
  Target,
  Calendar,
  Users,
  Coins,
  Crown,
} from 'lucide-react';
import SubNav, { type SubNavTab } from '@/components/SubNav';

/** Personality configuration */
const PERSONALITY_CONFIG: Record<
  PromoterPersonality,
  {
    color: string;
    bgColor: string;
    icon: React.ReactNode;
    label: string;
    description: string;
    traits: string[];
  }
> = {
  Greedy: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    icon: <DollarSign className="h-5 w-5" />,
    label: 'Greedy',
    description:
      'Prioritizes high-purse matchups over competitive balance. Offers 15% higher purses but generates 10% less hype.',
    traits: ['+15% Purse Bonus', '-10% Hype Penalty', 'Wide skill gap tolerance (0.35)'],
  },
  Honorable: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    icon: <Award className="h-5 w-5" />,
    label: 'Honorable',
    description:
      'Values fair competition and warrior safety. Generates 10% more hype with tightly matched skill gaps (0.10).',
    traits: ['+10% Hype Bonus', 'Tight skill matching', 'Warrior safety priority'],
  },
  Sadistic: {
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    icon: <AlertTriangle className="h-5 w-5" />,
    label: 'Sadistic',
    description:
      'Seeks dramatic, high-risk matchups with injury potential. 25% hype bonus for matchups involving wounded warriors.',
    traits: ['+25% Hype with injuries', 'High-kill matchups', 'Moderate skill gap (0.25)'],
  },
  Flashy: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    icon: <Sparkles className="h-5 w-5" />,
    label: 'Flashy',
    description:
      'Fame-focused promoter who loves showy fighters. 15% hype bonus for Aggressive/Impaling styles. 20% purse bonus.',
    traits: ['+15% Hype (showy styles)', '+20% Purse', 'Moderate skill gap (0.25)'],
  },
  Corporate: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    icon: <Building2 className="h-5 w-5" />,
    label: 'Corporate',
    description:
      'Stable, predictable matchmaking with consistent quality. 5% purse bonus and conservative skill gaps (0.20).',
    traits: ['+5% Purse Bonus', 'Conservative matching', 'Reliable scheduling'],
  },
};

const TIER_COLORS: Record<Promoter['tier'], { badge: string; bg: string }> = {
  Local: {
    badge: 'bg-stone-500/20 text-stone-600 border-stone-500/30',
    bg: 'bg-stone-500/5',
  },
  Regional: {
    badge: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30',
    bg: 'bg-cyan-500/5',
  },
  National: {
    badge: 'bg-violet-500/20 text-violet-600 border-violet-500/30',
    bg: 'bg-violet-500/5',
  },
  Legendary: {
    badge: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
};

const TABS: SubNavTab[] = [
  { id: 'overview', label: 'Overview', icon: <Target className="h-4 w-4" /> },
  { id: 'history', label: 'History', icon: <History className="h-4 w-4" /> },
  { id: 'offers', label: 'Active Offers', icon: <Calendar className="h-4 w-4" /> },
];

/** Format large numbers */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/** Calculate promoter statistics */
function calculateStats(
  promoter: Promoter,
  offers: Record<string, BoutOffer>,
  currentWeek: number
) {
  const promoterOffers = Object.values(offers).filter((o) => o.promoterId === promoter.id);
  const signedOffers = promoterOffers.filter((o) => o.status === 'Signed');
  const proposedOffers = promoterOffers.filter((o) => o.status === 'Proposed');
  const thisWeekBouts = signedOffers.filter((o) => o.boutWeek === currentWeek);

  const avgPurse =
    promoterOffers.length > 0
      ? promoterOffers.reduce((sum, o) => sum + o.purse, 0) / promoterOffers.length
      : 0;

  return {
    totalOffers: promoterOffers.length,
    signedCount: signedOffers.length,
    proposedCount: proposedOffers.length,
    thisWeekActive: thisWeekBouts.length,
    capacityUsed: thisWeekBouts.length,
    capacityPercent: (thisWeekBouts.length / promoter.capacity) * 100,
    avgPurse: Math.round(avgPurse),
    totalHype: promoterOffers.reduce((sum, o) => sum + o.hype, 0),
  };
}

export default function PromoterDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { promoters, boutOffers, week } = useGameStore();
  const [activeTab, setActiveTab] = useState('overview');

  const promoter = useMemo(() => {
    return Object.values(promoters || {}).find((p) => p.id === id);
  }, [id, promoters]);

  const stats = useMemo(() => {
    if (!promoter) return null;
    return calculateStats(promoter, boutOffers || {}, week);
  }, [promoter, boutOffers, week]);

  const promoterOffers = useMemo(() => {
    if (!promoter) return [];
    return Object.values(boutOffers || {})
      .filter((o) => o.promoterId === promoter.id)
      .sort((a, b) => a.boutWeek - b.boutWeek);
  }, [promoter, boutOffers]);

  if (!promoter || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Promoter not found.</p>
        <Link to="/ops/promoters">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const personality = PERSONALITY_CONFIG[promoter.personality];
  const tierStyle = TIER_COLORS[promoter.tier];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/ops/promoters">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className={`p-6 rounded-xl border ${tierStyle.bg} ${tierStyle.badge} border-current`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black uppercase tracking-wider">{promoter.name}</h1>
              <Badge variant="outline" className={`text-xs ${tierStyle.badge}`}>
                {promoter.tier}
              </Badge>
            </div>
            <p className="text-sm opacity-80">{personality.description}</p>
          </div>
          <div className={`p-4 rounded-lg ${personality.bgColor} flex items-center gap-3`}>
            <div className={personality.color}>{personality.icon}</div>
            <div>
              <div className={`font-bold ${personality.color}`}>{personality.label}</div>
              <div className="text-xs opacity-60">Personality</div>
            </div>
          </div>
        </div>
      </div>

      <SubNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                  <Coins className="h-3 w-3" /> Avg Purse
                </div>
                <div className="text-2xl font-black font-mono">{formatNumber(stats.avgPurse)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Total Hype
                </div>
                <div className="text-2xl font-black font-mono">{formatNumber(stats.totalHype)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> This Week
                </div>
                <div className="text-2xl font-black font-mono">
                  {stats.thisWeekActive}/{promoter.capacity}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                  <Users className="h-3 w-3" /> Total Offers
                </div>
                <div className="text-2xl font-black font-mono">{stats.totalOffers}</div>
              </CardContent>
            </Card>
          </div>

          {/* Capacity Bar */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold uppercase tracking-wider">Weekly Capacity Usage</span>
                <span
                  className={`font-mono font-bold ${stats.capacityPercent >= 80 ? 'text-red-500' : stats.capacityPercent >= 50 ? 'text-amber-500' : 'text-emerald-500'}`}
                >
                  {Math.round(stats.capacityPercent)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.capacityPercent >= 80
                      ? 'bg-red-500'
                      : stats.capacityPercent >= 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(stats.capacityPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.capacityUsed} of {promoter.capacity} weekly bouts scheduled
              </p>
            </CardContent>
          </Card>

          {/* Personality Traits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                {personality.icon} {personality.label} Traits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {personality.traits.map((trait, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs uppercase">Age</span>
                  <div className="font-mono font-bold">{promoter.age} years</div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs uppercase">Style Preferences</span>
                  <div className="font-medium">
                    {promoter.biases.length > 0
                      ? promoter.biases.map((s) => STYLE_DISPLAY_NAMES[s]).join(', ')
                      : 'No preferences'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-amber-500/5 to-transparent">
              <CardContent className="p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Legacy Fame
                </div>
                <div className="text-2xl font-black font-mono">{promoter.history.legacyFame}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent">
              <CardContent className="p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Total Purse Paid
                </div>
                <div className="text-2xl font-black font-mono">
                  {formatNumber(promoter.history.totalPursePaid)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-violet-500/5 to-transparent">
              <CardContent className="p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                  <History className="h-3 w-3" /> Notable Bouts
                </div>
                <div className="text-2xl font-black font-mono">
                  {promoter.history.notableBouts.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {promoter.history.mentorId && (
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-bold">Mentor:</span> {promoter.history.mentorId}
                </div>
              </CardContent>
            </Card>
          )}

          {promoter.history.notableBouts.length === 0 && (
            <Card className="p-8 text-center">
              <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-bold uppercase tracking-wider">No Notable Bouts</p>
              <p className="text-sm text-muted-foreground mt-2">
                This promoter hasn't hosted any legendary matches yet.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Active Offers Tab */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          {promoterOffers.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-bold uppercase tracking-wider">No Active Offers</p>
              <p className="text-sm text-muted-foreground mt-2">
                This promoter has no pending or signed bout offers.
              </p>
            </Card>
          ) : (
            promoterOffers.map((offer) => (
              <Card
                key={offer.id}
                className={offer.status === 'Signed' ? 'border-emerald-500/30' : ''}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{offer.id}</span>
                        <Badge
                          variant={offer.status === 'Signed' ? 'default' : 'outline'}
                          className="text-[10px]"
                        >
                          {offer.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Week {offer.boutWeek} • Expires Week {offer.expirationWeek}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-mono font-bold">{formatNumber(offer.purse)} gold</div>
                      <div className="text-xs text-muted-foreground">{offer.hype} hype</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Warriors ({offer.warriorIds.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {offer.warriorIds.map((wid) => (
                        <Badge key={wid} variant="secondary" className="text-[10px]">
                          {wid.slice(0, 8)}...
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
