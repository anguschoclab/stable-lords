import React, { useMemo } from "react";
import { Eye, Lightbulb, Swords, Zap, Activity, Download } from "lucide-react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { type Warrior } from "@/types/game";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getFavoritesDisplay, applyInsightToken } from "@/engine/favorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Discovery progress thresholds */
const WEAPON_HINT_FIGHTS = 5;
const WEAPON_REVEAL_FIGHTS = 15;
const RHYTHM_HINT_FIGHTS = 7;
const RHYTHM_REVEAL_FIGHTS = 18;

/** Get discovery progress for a warrior */
function getDiscoveryProgress(totalFights: number): {
  weaponProgress: number;
  rhythmProgress: number;
  weaponStage: "hidden" | "hint1" | "hint2" | "revealed";
  rhythmStage: "hidden" | "hint1" | "hint2" | "revealed";
} {
  let weaponStage: "hidden" | "hint1" | "hint2" | "revealed" = "hidden";
  if (totalFights >= WEAPON_REVEAL_FIGHTS) weaponStage = "revealed";
  else if (totalFights >= WEAPON_HINT_FIGHTS * 2) weaponStage = "hint2";
  else if (totalFights >= WEAPON_HINT_FIGHTS) weaponStage = "hint1";

  let rhythmStage: "hidden" | "hint1" | "hint2" | "revealed" = "hidden";
  if (totalFights >= RHYTHM_REVEAL_FIGHTS) rhythmStage = "revealed";
  else if (totalFights >= RHYTHM_HINT_FIGHTS * 2) rhythmStage = "hint2";
  else if (totalFights >= RHYTHM_HINT_FIGHTS) rhythmStage = "hint1";

  return {
    weaponProgress: Math.min(100, (totalFights / WEAPON_REVEAL_FIGHTS) * 100),
    rhythmProgress: Math.min(100, (totalFights / RHYTHM_REVEAL_FIGHTS) * 100),
    weaponStage,
    rhythmStage,
  };
}

/** Discovery Progress Bar with milestone markers */
function DiscoveryProgressBar({
  progress,
  stage,
  label,
  hint1Label,
  hint2Label,
  revealLabel,
  hint1At,
  hint2At,
  revealAt,
}: {
  progress: number;
  stage: "hidden" | "hint1" | "hint2" | "revealed";
  label: string;
  hint1Label: string;
  hint2Label: string;
  revealLabel: string;
  hint1At: number;
  hint2At: number;
  revealAt: number;
}) {
  const stageLabels: Record<string, string> = {
    hidden: "Unknown",
    hint1: hint1Label,
    hint2: hint2Label,
    revealed: revealLabel,
  };

  const stageColors: Record<string, string> = {
    hidden: "bg-muted",
    hint1: "bg-primary/60",
    hint2: "bg-primary/80",
    revealed: "bg-accent",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-medium ${stage === "revealed" ? "text-accent" : "text-muted-foreground"}`}>
          {stageLabels[stage]}
        </span>
      </div>
      <div className="relative">
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${stageColors[stage]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center">
          <div
            className="absolute w-px h-3 bg-muted-foreground/30"
            style={{ left: `${(hint1At / revealAt) * 100}%` }}
          />
          <div
            className="absolute w-px h-3 bg-muted-foreground/30"
            style={{ left: `${(hint2At / revealAt) * 100}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/70">
        <span>0</span>
        <span>Hint {hint1At}</span>
        <span>Hint {hint2At}</span>
        <span>Reveal {revealAt}</span>
      </div>
    </div>
  );
}

export function FavoritesCard({ warrior, onUpdate }: { warrior: Warrior; onUpdate: () => void }) {
  const state = useWorldState();
  const setState = useGameStore((s) => s.setState);
  const favDisplay = getFavoritesDisplay(warrior);
  
  const isWeaponDiscovered = !!warrior.favorites?.discovered.weapon;
  const isRhythmDiscovered = !!warrior.favorites?.discovered.rhythm;

  const weaponHints = warrior.favorites?.discovered.weaponHints ?? 0;
  const rhythmHints = warrior.favorites?.discovered.rhythmHints ?? 0;
  
  const weaponProgress = isWeaponDiscovered ? 100 : (weaponHints / 2) * 100;
  const rhythmProgress = isRhythmDiscovered ? 100 : (rhythmHints / 2) * 100;

  const handleInsight = (type: "weapon" | "rhythm") => {
    const msg = applyInsightToken(warrior, type);
    setState((s) => {
      const w = s.roster.find((x) => x.id === warrior.id);
      if (w) w.favorites = warrior.favorites;
    });
    toast.success(msg);
    onUpdate();
  };

  const handleApplyRhythm = () => {
    const fav = warrior.favorites;
    if (!fav?.discovered.rhythm) return;
    setState((s) => {
      const w = s.roster.find((x) => x.id === warrior.id);
      if (w) {
        if (!w.plan) w.plan = { style: w.style, OE: fav.rhythm.oe, AL: fav.rhythm.al };
        else {
          w.plan.OE = fav.rhythm.oe;
          w.plan.AL = fav.rhythm.al;
        }
      }
    });
    toast.success(`${warrior.name}'s strategy updated — OE ${fav.rhythm.oe} / AL ${fav.rhythm.al} locked in.`);
    onUpdate();
  };

  const handleEquipFavoriteWeapon = () => {
    const fav = warrior.favorites;
    if (!fav?.discovered.weapon) return;
    setState((s) => {
      const w = s.roster.find((x) => x.id === warrior.id);
      if (w) {
        if (!w.equipment) w.equipment = { weapon: fav.weaponId, armor: "none_armor", shield: "none_shield", helm: "none_helm" };
        else w.equipment.weapon = fav.weaponId;
      }
    });
    const weaponName = favDisplay.weapon ?? fav.weaponId;
    toast.success(`${warrior.name} equipped with their soul-bond weapon: ${weaponName}.`);
    onUpdate();
  };

  if (!warrior.favorites) return null;

  return (
    <Card className="bg-glass/10 border-arena-gold/10">
      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="font-display text-lg flex items-center gap-2 text-arena-gold">
          <Zap className="h-5 w-5 fill-arena-gold" /> SOUL-BOND & MASTERY
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Weapon Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Swords className="h-3 w-3" /> Favorite Weapon
            </div>
            {isWeaponDiscovered && (
              <Badge className="bg-arena-gold text-black font-black text-[9px] px-1.5 py-0 h-4">MASTERY ✨</Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {isWeaponDiscovered ? (
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white uppercase tracking-tight">{favDisplay.weapon}</div>
                  <div className="text-[9px] font-mono text-arena-gold font-bold">+2 ATT / +1 DAMAGE</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic font-medium opacity-60">
                   {weaponHints > 0 ? favDisplay.weaponHint : "Preference hidden..."}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isWeaponDiscovered && warrior.equipment?.weapon !== warrior.favorites?.weaponId && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleEquipFavoriteWeapon} className="h-7 px-2 border-arena-gold/30 hover:bg-arena-gold/20 text-arena-gold text-[9px] font-black uppercase gap-1" aria-label="Equip favorite weapon">
                        <Download className="h-3 w-3" /> Equip
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-black text-[10px]">Switch to soul-bond weapon</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {!isWeaponDiscovered && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleInsight("weapon")} className="h-7 w-7 p-0 border-white/10 hover:bg-arena-gold/20" aria-label="Reveal favorite weapon insight">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-black text-[10px]">Use Insight Token</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-1000", isWeaponDiscovered ? "bg-arena-gold" : "bg-arena-gold/30")}
              style={{ width: `${weaponProgress}%` }}
            />
          </div>
        </div>

        {/* Rhythm Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3 w-3" /> Natural Rhythm
            </div>
            {isRhythmDiscovered && (
              <Badge className="bg-arena-gold text-black font-black text-[9px] px-1.5 py-0 h-4">SYNERGY ✨</Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {isRhythmDiscovered ? (
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white uppercase tracking-tight">{favDisplay.rhythm}</div>
                  <div className="text-[9px] font-mono text-arena-gold font-bold">+2 INI / +2 DEF (BONUS)</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic font-medium opacity-60">
                   {rhythmHints > 0 ? favDisplay.rhythmHint : "Rhythm hidden..."}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isRhythmDiscovered && (() => {
                const fav = warrior.favorites!;
                const plan = warrior.plan;
                const alreadyApplied = plan && plan.OE === fav.rhythm.oe && plan.AL === fav.rhythm.al;
                return !alreadyApplied ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={handleApplyRhythm} className="h-7 px-2 border-arena-gold/30 hover:bg-arena-gold/20 text-arena-gold text-[9px] font-black uppercase gap-1" aria-label="Apply favorite rhythm to strategy">
                          <Download className="h-3 w-3" /> Apply
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-black text-[10px]">Lock soul-rhythm into strategy sheet</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Badge className="bg-arena-gold/10 text-arena-gold border border-arena-gold/20 text-[9px] font-black px-1.5">Active</Badge>
                );
              })()}
              {!isRhythmDiscovered && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleInsight("rhythm")} className="h-7 w-7 p-0 border-white/10 hover:bg-arena-gold/20" aria-label="Reveal favorite rhythm insight">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-black text-[10px]">Use Insight Token</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-1000", isRhythmDiscovered ? "bg-arena-gold" : "bg-arena-gold/30")}
              style={{ width: `${rhythmProgress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
