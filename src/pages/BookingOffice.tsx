import { useMemo, useState } from "react";
import { useGameStore, useWorldState, type GameStore } from "@/state/useGameStore";
import { respondToBoutOffer } from "@/engine/bout/mutations/contractMutations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  DollarSign,
  Activity,
  Target
} from "lucide-react";
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
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <PageHeader
        icon={Briefcase}
        title="Booking Office"
        subtitle={`OPS · CONTRACTS · WEEK ${week}`}
      />

      {/* Band 2 — Booking Intelligence Strip (Spec §6.4) */}
      <Surface variant="glass" className="flex items-center gap-12 p-5 border-l-4 border-l-primary/50">
        <div className="flex items-center gap-3">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Market_Overview</span>
        </div>

        <div className="flex items-center gap-10">
           <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Open Proposals</span>
              <span className="font-display font-black text-xl text-primary leading-none mt-1">{thisWeekOffers.length + upcomingOffers.length}</span>
           </div>
           
           <div className="h-8 w-px bg-white/5" />

           <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Highest Purse</span>
              <span className="font-display font-black text-xl text-arena-gold leading-none mt-1">{(highestPurse || 0).toLocaleString()}G</span>
           </div>

           <div className="h-8 w-px bg-white/5" />

           <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Idle Warriors</span>
              <span className={cn("font-display font-black text-xl leading-none mt-1", idleWarriors.length > 0 ? "text-destructive" : "text-muted-foreground")}>
                {idleWarriors.length}
              </span>
           </div>
        </div>

        <div className="ml-auto flex gap-3">
           <Button variant="outline" size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest" onClick={acceptAllHonorable}>
             <Award className="h-3.5 w-3.5 mr-2 text-primary" /> Accept All (Safe)
           </Button>
        </div>
      </Surface>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Archetype D: Left Rail Roster (span-4) */}
        <div className="lg:col-span-4 space-y-4 sticky top-6">
          <div className="flex items-center gap-3 px-2">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Roster_Readiness</h3>
          </div>
          <Surface variant="glass" className="p-0 border-white/5 max-h-[700px] overflow-y-auto thin-scrollbar">
            {roster.map(warrior => {
              const hasAccepted = Object.values(boutOffers).some(o => o.warriorIds.includes(warrior.id) && o.status === "Accepted");
              const hasProposed = Object.values(boutOffers).some(o => o.warriorIds.includes(warrior.id) && o.status === "Proposed");
              const fatigueConfig = getFatigueStatus(warrior.fatigue ?? 0);

              return (
                <div key={warrior.id} className={cn(
                  "p-4 border-b border-white/5 last:border-0 flex items-center gap-3 transition-colors",
                  hasAccepted ? "bg-primary/[0.03]" : ""
                )}>
                  <div className={cn("h-1.5 w-1.5 rounded-full", hasAccepted ? "bg-primary" : hasProposed ? "bg-arena-gold" : "bg-white/10")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase truncate">{warrior.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">{fatigueConfig.label} • {warrior.fatigue}% FATIGUE</p>
                  </div>
                  {hasAccepted && <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] font-black px-1 h-4">BOOKED</Badge>}
                </div>
              );
            })}
          </Surface>
        </div>

        {/* Right Rail Viewport (span-8) */}
        <div className="lg:col-span-8 space-y-6">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-auto bg-transparent border-b border-white/10 rounded-none p-0 mb-6 flex gap-6">
              <TabsTrigger value="this-week" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground data-[state=active]:text-primary">
                Immediate Proposals ({thisWeekOffers.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground data-[state=active]:text-primary">
                Future Slates ({upcomingOffers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="this-week" className="mt-0 space-y-6">
              {thisWeekOffers.length === 0 ? (
                <Surface variant="glass" className="py-24 text-center">
                  <ShieldAlert className="h-16 w-16 opacity-10 mx-auto mb-4" />
                  <p className="font-display font-black uppercase tracking-widest text-sm text-muted-foreground/30">
                    No_Proposals_Detected_Week_{week + 2}
                  </p>
                </Surface>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {thisWeekOffers.map(renderOfferCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0 space-y-6">
              {upcomingOffers.map(renderOfferCard)}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
