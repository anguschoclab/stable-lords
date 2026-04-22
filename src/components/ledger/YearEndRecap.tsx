/**
 * Year-End Recap — a condensed summary of the season: top warrior, kill count,
 * treasury delta, biggest rivalry, roster turnover, notable memorials.
 * Pulls directly from GameState; no new engine deps.
 */
import { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Surface } from "@/components/ui/Surface";
import { Trophy, Skull, Coins, Swords, Users, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function YearEndRecap() {
  const { roster, graveyard, retired, ledger, rivalries, season, week } = useGameStore();

  const recap = useMemo(() => {
    // ⚡ Bolt: Reduced O(N log N) sort to O(N) linear scan for finding max values. Avoids extra array allocations.
    let topWarrior = roster[0];
    let mostKills = roster[0];
    for (const w of roster) {
      if ((w.fame ?? 0) > (topWarrior?.fame ?? 0)) topWarrior = w;
      if ((w.career?.kills ?? 0) > (mostKills?.career?.kills ?? 0)) mostKills = w;
    }

    const totalKills = roster.reduce((s, w) => s + (w.career?.kills ?? 0), 0)
      + graveyard.reduce((s, w) => s + (w.career?.kills ?? 0), 0);
    const net = (ledger ?? []).reduce((s, e) => s + e.amount, 0);
    const memorials = graveyard.slice(-5);

    let topRivalry = rivalries?.[0];
    if (rivalries) {
      for (const r of rivalries) {
        if ((r.intensity ?? 0) > (topRivalry?.intensity ?? 0)) topRivalry = r;
      }
    }

    return { topWarrior, mostKills, totalKills, net, memorials, topRivalry };
  }, [roster, graveyard, ledger, rivalries]);

  const stat = (label: string, value: React.ReactNode, tone: string, Icon: React.ComponentType<{ className?: string }>) => (
    <Surface variant="glass" className={cn("px-5 py-4 border-border/30 flex items-center gap-4", tone)}>
      <Icon className="h-5 w-5 opacity-60" />
      <div>
        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</div>
        <div className="text-sm font-black">{value}</div>
      </div>
    </Surface>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-arena-gold">
          YEAR_END_RECAP · Season {season} · Week {week}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-arena-gold/30 via-border/20 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {recap.topWarrior && stat("Top Warrior", `${recap.topWarrior.name} · ${recap.topWarrior.fame}G fame`, "text-arena-gold", Trophy)}
        {recap.mostKills && stat("Most Lethal", `${recap.mostKills.name} · ${recap.mostKills.career?.kills ?? 0} kills`, "text-destructive", Flame)}
        {stat("Total Arena Kills", recap.totalKills, "text-destructive", Skull)}
        {stat("Net Treasury", `${recap.net >= 0 ? "+" : ""}${recap.net}G`, recap.net >= 0 ? "text-primary" : "text-destructive", Coins)}
        {stat("Active Roster", `${roster.length} warriors`, "text-primary", Users)}
        {stat("Retired / Fallen", `${retired.length} / ${graveyard.length}`, "text-muted-foreground", Swords)}
      </div>

      {recap.topRivalry && (
        <Surface variant="glass" className="px-5 py-4 border-destructive/30">
          <div className="text-[9px] font-black uppercase tracking-widest text-destructive mb-1">Headline Rivalry</div>
          <div className="text-sm">
            Intensity {recap.topRivalry.intensity ?? 0} — {recap.topRivalry.stableIdA} vs {recap.topRivalry.stableIdB}
          </div>
        </Surface>
      )}

      {recap.memorials.length > 0 && (
        <Surface variant="glass" className="px-5 py-4 border-border/30">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">In Memoriam</div>
          <ul className="space-y-1">
            {recap.memorials.map(w => (
              <li key={w.id} className="text-xs flex items-center gap-2">
                <Skull className="h-3 w-3 text-destructive" />
                <span className="font-black">{w.name}</span>
                <span className="text-muted-foreground/60">— fame {w.fame ?? 0}, {w.career?.kills ?? 0} kills</span>
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </div>
  );
}

export default YearEndRecap;
