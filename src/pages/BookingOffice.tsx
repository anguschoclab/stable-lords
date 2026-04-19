import { useMemo, useState } from "react";
import { useGameStore, useWorldState, type GameStore } from "@/state/useGameStore";
import { respondToBoutOffer } from "@/engine/bout/mutations/contractMutations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  User,
  Coins,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Crown,
  Heart,
  AlertTriangle,
  Ban,
  Users,
  TrendingUp,
  Award,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/shared.types";
import type { Warrior, PromoterPersonality, BoutOffer } from "@/types/state.types";
import type { InjuryData } from "@/types/warrior.types";

/** Personality badge colors and icons */
const PERSONALITY_CONFIG: Record<PromoterPersonality, { color: string; icon: React.ReactNode; desc: string }> = {
  Greedy: { color: "bg-amber-500/20 text-amber-600 border-amber-500/30", icon: <DollarSign className="h-3 w-3" />, desc: "High purse, lower hype" },
  Honorable: { color: "bg-blue-500/20 text-blue-600 border-blue-500/30", icon: <Award className="h-3 w-3" />, desc: "Fair matches, +10% hype" },
  Sadistic: { color: "bg-red-500/20 text-red-600 border-red-500/30", icon: <AlertTriangle className="h-3 w-3" />, desc: "High-kill matchups" },
  Flashy: { color: "bg-purple-500/20 text-purple-600 border-purple-500/30", icon: <Zap className="h-3 w-3" />, desc: "Fame-focused, +20% purse" },
  Corporate: { color: "bg-slate-500/20 text-slate-600 border-slate-500/30", icon: <TrendingUp className="h-3 w-3" />, desc: "Stable tier matching" },
};

/** Get fatigue status for display */
function getFatigueStatus(fatigue: number): { label: string; color: string; icon: React.ReactNode } {
  if (fatigue <= 30) return { label: "Fresh", color: "bg-green-500/20 text-green-600 border-green-500/30", icon: <Heart className="h-3 w-3" /> };
  if (fatigue <= 60) return { label: "Tired", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> };
  return { label: "Exhausted", color: "bg-red-500/20 text-red-600 border-red-500/30", icon: <AlertTriangle className="h-3 w-3" /> };
}

/** Get injury severity badge */
function getInjuryBadge(injuries: InjuryData[]): { label: string; color: string; count: number } | null {
  const blocking = injuries.filter(i => ["Moderate", "Severe", "Critical", "Permanent"].includes(i.severity));
  if (blocking.length === 0) return null;
  const severest = blocking.reduce<InjuryData>((max, i) => {
    const order = ["Minor", "Moderate", "Severe", "Critical", "Permanent"];
    return order.indexOf(i.severity) > order.indexOf(max.severity) ? i : max;
  }, blocking[0]!);
  const colorMap: Record<string, string> = {
    Moderate: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    Severe: "bg-orange-500/20 text-orange-600 border-orange-500/30",
    Critical: "bg-red-500/20 text-red-600 border-red-500/30",
    Permanent: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  };
  const severity = severest.severity ?? "Moderate";
  return { label: severity, color: colorMap[severity] ?? colorMap.Moderate, count: blocking.length };
}

export default function BookingOffice() {
  const state = useWorldState();
  const { setState } = useGameStore();
  const { promoters, boutOffers, roster, week, rivals } = state;
  const [activeTab, setActiveTab] = useState("this-week");

  // Group offers by week
  const { thisWeekOffers, upcomingOffers, idleWarriors } = useMemo(() => {
    const playerOffers = Object.values(boutOffers).filter((offer: BoutOffer) =>
      offer.warriorIds.some((wId: string) => roster.some((playerW: Warrior) => playerW.id === wId)) &&
      offer.status === "Proposed"
    );

    const thisWeek = playerOffers.filter(o => o.boutWeek === week + 2);
    const upcoming = playerOffers.filter(o => o.boutWeek > week + 2);

    // Find warriors with no offers
    const warriorsWithOffers = new Set(playerOffers.flatMap(o => o.warriorIds));
    const idle = roster.filter(w => w.status === "Active" && !warriorsWithOffers.has(w.id));

    return {
      thisWeekOffers: thisWeek.sort((a, b) => (promoters[b.promoterId]?.tier ?? "") > (promoters[a.promoterId]?.tier ?? "") ? 1 : -1),
      upcomingOffers: upcoming.sort((a, b) => a.boutWeek - b.boutWeek),
      idleWarriors: idle
    };
  }, [boutOffers, roster, week, promoters]);

  const handleResponse = (offerId: string, warriorId: string | undefined, response: "Accepted" | "Declined") => {
    if (!warriorId) return;
    setState((s: GameStore) => {
      const next = respondToBoutOffer(state, offerId, warriorId, response);
      s.boutOffers = next.boutOffers ?? {};
    });
    toast.success(`Offer ${response === "Accepted" ? "accepted" : "declined"}.`);
  };

  // Bulk actions
  const acceptAllHonorable = () => {
    const honorableOffers = thisWeekOffers.filter(o => promoters[o.promoterId]?.personality === "Honorable");
    let accepted = 0;
    honorableOffers.forEach(offer => {
      const warriorId = offer.warriorIds.find(id => roster.some(w => w.id === id));
      const warrior = roster.find(w => w.id === warriorId);
      if (warriorId && warrior && (warrior.fatigue ?? 0) <= 60 && !getInjuryBadge(warrior.injuries || [])) {
        handleResponse(offer.id, warriorId, "Accepted");
        accepted++;
      }
    });
    toast.success(`Accepted ${accepted} offers from honorable promoters.`);
  };

  const declineAllFromPromoter = (promoterId: string) => {
    const promoterOffers = thisWeekOffers.filter(o => o.promoterId === promoterId);
    let declined = 0;
    promoterOffers.forEach(offer => {
      const warriorId = offer.warriorIds.find(id => roster.some(w => w.id === id));
      if (warriorId) {
        handleResponse(offer.id, warriorId, "Declined");
        declined++;
      }
    });
    toast.success(`Declined ${declined} offers.`);
  };

  const renderOfferCard = (offer: BoutOffer) => {
    const promoter = promoters[offer.promoterId];
    const playerWarriorId = offer.warriorIds.find(id => roster.some(w => w.id === id));
    const playerWarrior = roster.find(w => w.id === playerWarriorId);
    const opponentId = offer.warriorIds.find(id => id !== playerWarriorId);

    // Find opponent from rivals
    const opponent = useMemo(() => {
      for (const rival of rivals || []) {
        const found = rival.roster.find(w => w.id === opponentId);
        if (found) return { ...found, stableName: rival.owner.stableName };
      }
      return null;
    }, [opponentId, rivals]);

    const personality = promoter?.personality as PromoterPersonality;
    const personalityConfig = personality ? PERSONALITY_CONFIG[personality] : null;
    const fatigue = playerWarrior?.fatigue ?? 0;
    const fatigueStatus = getFatigueStatus(fatigue);
    const injuryBadge = getInjuryBadge(playerWarrior?.injuries || []);

    return (
      <Card key={offer.id} className="bg-glass-card border-primary/20 overflow-hidden group hover:border-primary/40 transition-all duration-300">
        <CardHeader className="bg-secondary/10 border-b border-border/10 pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 flex-wrap">
                {promoter?.name || "Local Promoter"}
                <Badge variant="outline" className="text-[9px] uppercase">{promoter?.tier}</Badge>
                {personalityConfig && (
                  <Badge variant="outline" className={`text-[9px] ${personalityConfig.color}`}>
                    <span className="flex items-center gap-1">
                      {personalityConfig.icon} {personality}
                    </span>
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-[10px] font-mono uppercase opacity-70">
                {personalityConfig?.desc} • {promoter?.biases.map(s => STYLE_DISPLAY_NAMES[s]).join(", ")}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-foreground flex items-center gap-1 justify-end font-display">
                <Coins className="h-4 w-4 text-arena-gold" />
                {offer.purse}g
              </div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase">Guaranteed Purse</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Warrior Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`text-[9px] ${fatigueStatus.color}`}>
              <span className="flex items-center gap-1">
                {fatigueStatus.icon} {fatigueStatus.label} ({fatigue}%)
              </span>
            </Badge>
            {injuryBadge && (
              <Badge variant="outline" className={`text-[9px] ${injuryBadge.color}`}>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {injuryBadge.label}
                  {injuryBadge.count > 1 && ` (+${injuryBadge.count - 1})`}
                </span>
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-center space-y-2 flex-1">
              <div className="p-3 bg-primary/5 rounded-full mx-auto w-fit border border-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="text-xs font-black uppercase tracking-tight">{playerWarrior?.name}</div>
              <div className="flex flex-col gap-1">
                <Badge className="text-[9px]">{STYLE_DISPLAY_NAMES[playerWarrior?.style as FightingStyle]}</Badge>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-40">
              <Zap className="h-5 w-5 text-arena-gold animate-pulse" />
              <span className="text-[9px] font-black uppercase text-muted-foreground">VS</span>
            </div>
            <div className="text-center space-y-2 flex-1">
              <div className="p-3 bg-secondary/5 rounded-full mx-auto w-fit border border-border/10">
                <Crown className="h-6 w-6 text-muted-foreground opacity-30" />
              </div>
              <div className="text-xs font-black uppercase tracking-tight text-muted-foreground">
                {opponent?.name || "Ranked Opponent"}
              </div>
              <div className="flex flex-col gap-1">
                {opponent ? (
                  <>
                    <Badge variant="secondary" className="text-[9px] opacity-60">
                      {STYLE_DISPLAY_NAMES[opponent.style as FightingStyle]}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground">{opponent.stableName}</span>
                  </>
                ) : (
                  <Badge variant="secondary" className="text-[9px] opacity-40 text-muted-foreground">PRO_CIRCUIT</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator className="bg-border/10" />

          <div className="grid grid-cols-2 gap-4 h-12">
            <div className="flex flex-col justify-center border-r border-border/10">
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Clock className="h-3 w-3" /> Scheduled_For
              </div>
              <div className="text-sm font-black">Week {offer.boutWeek}</div>
            </div>
            <div className="flex flex-col justify-center pl-2">
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Zap className="h-3 w-3 text-arena-gold" /> Hype_Matrix
              </div>
              <div className="text-sm font-black text-arena-gold">{offer.hype}%</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 gap-2 font-black uppercase text-[10px] tracking-widest"
              onClick={() => handleResponse(offer.id, playerWarriorId, "Accepted")}
              disabled={!!injuryBadge || fatigue > 60}
            >
              <CheckCircle2 className="h-4 w-4" /> Sign_Contract
            </Button>
            <Button
              variant="ghost"
              className="flex-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive gap-2 font-black uppercase text-[10px] tracking-widest"
              onClick={() => handleResponse(offer.id, playerWarriorId, "Declined")}
            >
              <XCircle className="h-4 w-4" /> Decline
            </Button>
          </div>
          {(!!injuryBadge || fatigue > 60) && (
            <p className="text-[9px] text-destructive text-center">
              {injuryBadge ? "Warrior has blocking injuries" : "Warrior is too fatigued"}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      <header className="flex flex-col gap-2 border-b border-border/10 pb-6">
        <h1 className="text-4xl font-black font-display tracking-tighter uppercase flex items-center gap-3">
          <Briefcase className="h-10 w-10 text-primary" />
          Booking Office
        </h1>
        <p className="text-muted-foreground uppercase text-[10px] tracking-[0.3em] font-bold opacity-60">
          Week {week} — {thisWeekOffers.length + upcomingOffers.length} offers, {idleWarriors.length} warriors idle
        </p>
      </header>

      {/* Bulk Actions */}
      {thisWeekOffers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] uppercase font-bold"
            onClick={acceptAllHonorable}
          >
            <Award className="h-3 w-3 mr-1" /> Accept All Honorable (Healthy)
          </Button>
          {Object.values(promoters).map(p => (
            <Button
              key={p.id}
              variant="outline"
              size="sm"
              className="text-[10px] uppercase font-bold"
              onClick={() => declineAllFromPromoter(p.id)}
            >
              <Ban className="h-3 w-3 mr-1" /> Decline All {p.name}
            </Button>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="this-week" className="text-[10px] uppercase font-bold">
            This Week ({thisWeekOffers.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-[10px] uppercase font-bold">
            Upcoming ({upcomingOffers.length})
          </TabsTrigger>
          <TabsTrigger value="idle" className="text-[10px] uppercase font-bold">
            Idle ({idleWarriors.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="this-week" className="mt-6">
          {thisWeekOffers.length === 0 ? (
            <Card className="border-dashed bg-secondary/5 border-border/20 py-20 text-center">
              <CardContent className="flex flex-col items-center gap-4 text-muted-foreground/30">
                <ShieldAlert className="h-16 w-16 opacity-10" />
                <p className="font-display font-black uppercase tracking-widest text-sm">
                  No_Proposals_For_Week_{week + 2}
                </p>
                <p className="text-[10px] uppercase tracking-wider opacity-60">
                  Promoters are preparing their next slate of offers.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {thisWeekOffers.map(renderOfferCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingOffers.length === 0 ? (
            <Card className="border-dashed bg-secondary/5 border-border/20 py-20 text-center">
              <CardContent className="flex flex-col items-center gap-4 text-muted-foreground/30">
                <Clock className="h-16 w-16 opacity-10" />
                <p className="font-display font-black uppercase tracking-widest text-sm">
                  No_Future_Proposals
                </p>
                <p className="text-[10px] uppercase tracking-wider opacity-60">
                  Future offers will appear here as promoters announce.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingOffers.map(renderOfferCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="idle" className="mt-6">
          {idleWarriors.length === 0 ? (
            <Card className="border-dashed bg-secondary/5 border-border/20 py-20 text-center">
              <CardContent className="flex flex-col items-center gap-4 text-muted-foreground/30">
                <Users className="h-16 w-16 opacity-10" />
                <p className="font-display font-black uppercase tracking-widest text-sm">
                  All_Warriors_Booked
                </p>
                <p className="text-[10px] uppercase tracking-wider opacity-60">
                  Every active warrior has pending offers.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {idleWarriors.map(warrior => {
                const fatigueStatus = getFatigueStatus(warrior.fatigue ?? 0);
                const injuryBadge = getInjuryBadge(warrior.injuries || []);
                return (
                  <Card key={warrior.id} className="bg-secondary/5 border-border/20">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase truncate">{warrior.name}</p>
                        <p className="text-[9px] text-muted-foreground">{STYLE_DISPLAY_NAMES[warrior.style]}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className={`text-[8px] ${fatigueStatus.color}`}>
                          {fatigueStatus.label}
                        </Badge>
                        {injuryBadge && (
                          <Badge variant="outline" className={`text-[8px] ${injuryBadge.color}`}>
                            {injuryBadge.label}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
