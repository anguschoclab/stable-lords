import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { respondToBoutOffer } from "@/engine/bout/mutations/contractMutations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Crown
} from "lucide-react";
import { toast } from "sonner";
import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/shared.types";

export default function BookingOffice() {
  const { state, setState } = useGameStore();
  const { promoters, boutOffers, roster, week } = state;

  // Filter offers involving the player's warriors
  const playerOffers = useMemo(() => {
    return Object.values(boutOffers).filter(offer => 
      offer.warriorIds.some(wId => roster.some(playerW => playerW.id === wId)) &&
      offer.status === "Proposed"
    );
  }, [boutOffers, roster]);

  const handleResponse = (offerId: string, warriorId: string, response: "Accepted" | "Declined") => {
    const newState = respondToBoutOffer(state, offerId, warriorId, response);
    setState(newState);
    toast.success(`Offer ${response === "Accepted" ? "accepted" : "declined"}.`);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      <header className="flex flex-col gap-2 border-b border-border/10 pb-6">
        <h1 className="text-4xl font-black font-display tracking-tighter uppercase flex items-center gap-3">
          <Briefcase className="h-10 w-10 text-primary" />
          Booking Office
        </h1>
        <p className="text-muted-foreground uppercase text-[10px] tracking-[0.3em] font-bold opacity-60">
          Current Operational Week: {week} // Pending Contracts: {playerOffers.length}
        </p>
      </header>

      {playerOffers.length === 0 ? (
        <Card className="border-dashed bg-secondary/5 border-border/20 py-20 text-center">
          <CardContent className="flex flex-col items-center gap-4 text-muted-foreground/30">
            <ShieldAlert className="h-16 w-16 opacity-10" />
            <p className="font-display font-black uppercase tracking-widest text-sm">
              No_Active_Proposals_Incoming
            </p>
            <p className="text-[10px] uppercase tracking-wider opacity-60">
              Promoters seek talent based on fame and style performance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {playerOffers.map((offer) => {
            const promoter = promoters[offer.promoterId];
            const playerWarriorId = offer.warriorIds.find(id => roster.some(w => w.id === id));
            const playerWarrior = roster.find(w => w.id === playerWarriorId);
            const opponentId = offer.warriorIds.find(id => id !== playerWarriorId);
            
            // Note: In a real app we'd fetch opponent details from state.rivals
            // For now, we'll assume they are known or shown as 'Opponent ID'
            
            return (
              <Card key={offer.id} className="bg-glass-card border-primary/20 overflow-hidden group hover:border-primary/40 transition-all duration-300">
                <CardHeader className="bg-secondary/10 border-b border-border/10 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        {promoter?.name || "Local Promoter"}
                        <Badge variant="outline" className="text-[9px] uppercase">{promoter?.tier}</Badge>
                      </CardTitle>
                      <CardDescription className="text-[10px] font-mono uppercase opacity-70">
                        Personality: {promoter?.personality} // Specializes in: {promoter?.biases.map(s => STYLE_DISPLAY_NAMES[s]).join(", ")}
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
                   <div className="flex items-center justify-between gap-4">
                      <div className="text-center space-y-2 flex-1">
                        <div className="p-3 bg-primary/5 rounded-full mx-auto w-fit border border-primary/10">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-xs font-black uppercase tracking-tight">{playerWarrior?.name}</div>
                        <Badge className="text-[9px]">{STYLE_DISPLAY_NAMES[playerWarrior?.style as FightingStyle]}</Badge>
                      </div>
                      <div className="flex flex-col items-center gap-1 opacity-40">
                         <Zap className="h-5 w-5 text-arena-gold animate-pulse" />
                         <span className="text-[9px] font-black uppercase text-muted-foreground">VS</span>
                      </div>
                      <div className="text-center space-y-2 flex-1">
                        <div className="p-3 bg-secondary/5 rounded-full mx-auto w-fit border border-border/10">
                          <Crown className="h-6 w-6 text-muted-foreground opacity-30" />
                        </div>
                        <div className="text-xs font-black uppercase tracking-tight text-muted-foreground">Ranked Opponent</div>
                        <Badge variant="secondary" className="text-[9px] opacity-40 text-muted-foreground">PRO_CIRCUIT</Badge>
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
                        onClick={() => handleResponse(offer.id, playerWarriorId!, "Accepted")}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Sign_Contract
                      </Button>
                      <Button 
                        variant="ghost"
                        className="flex-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive gap-2 font-black uppercase text-[10px] tracking-widest"
                        onClick={() => handleResponse(offer.id, playerWarriorId!, "Declined")}
                      >
                        <XCircle className="h-4 w-4" /> Decline
                      </Button>
                   </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
