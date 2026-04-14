import { useGameStore } from "@/state/useGameStore";
import { Card } from "@/components/ui/card";
import { Shield, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export function StableStrategyWidget() {
  const { player, ownerGrudges, rivals } = useGameStore();

  const personality = player.personality || "Pragmatic";
  const metaAdaptation = player.metaAdaptation || "Opportunist";

  const activeGrudges = ownerGrudges.filter(g =>
    g.ownerIdA === player.id || g.ownerIdB === player.id
  );

  return (
    <Card className="p-4 bg-neutral-950/50 border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">Stable Strategy</h3>
      </div>

      <div className="space-y-3">
        {/* Philosophy Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Personality</span>
            <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{personality}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Adaptation</span>
            <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{metaAdaptation}</span>
          </div>
        </div>

        {/* Grudges Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-destructive" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Active Grudges</span>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded", activeGrudges.length > 0 ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground")}>
              {activeGrudges.length}
            </span>
          </div>

          {activeGrudges.length > 0 && (
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {activeGrudges.map(grudge => {
                const rivalId = grudge.ownerIdA === player.id ? grudge.ownerIdB : grudge.ownerIdA;
                const rival = rivals.find(r => r.owner.id === rivalId);
                return (
                  <div key={grudge.id} className="flex items-center justify-between text-[9px] bg-neutral-900/40 px-2 py-1 rounded">
                    <span className="text-muted-foreground">{rival?.owner.stableName || "Unknown"}</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1 h-2 rounded-sm",
                              i < grudge.intensity ? "bg-destructive" : "bg-neutral-800"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeGrudges.length === 0 && (
            <div className="text-[9px] text-muted-foreground italic px-2 py-1">
              No active grudges
            </div>
          )}
        </div>

        {/* Strategy Note */}
        <div className="pt-2 border-t border-white/5">
          <p className="text-[9px] text-muted-foreground leading-tight">
            Your philosophy influences AI decision-making. Grudges increase rivalry intensity in matchups.
          </p>
        </div>
      </div>
    </Card>
  );
}
