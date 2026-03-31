import React from "react";
import { Eye, Lightbulb, Swords, Zap } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { type Warrior } from "@/types/game";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getFavoritesDisplay, applyInsightToken } from "@/engine/favorites";
import { getMastery } from "@/engine/stylePassives";
import { toast } from "sonner";

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
  const { setState, state } = useGameStore();
  const favDisplay = getFavoritesDisplay(warrior);
  const totalFights = (warrior.career.wins || 0) + (warrior.career.losses || 0);
  const mastery = getMastery(totalFights);
  const progress = getDiscoveryProgress(totalFights);

  const handleInsight = (type: "weapon" | "rhythm") => {
    const msg = applyInsightToken(warrior, type);
    setState({
      ...state,
      roster: state.roster.map(w => w.id === warrior.id ? { ...w, favorites: warrior.favorites } : w),
    });
    toast.success(msg);
    onUpdate();
  };

  if (!warrior.favorites) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" /> Favorites & Mastery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant={mastery.tier === "Grandmaster" ? "destructive" : mastery.tier === "Master" ? "default" : "secondary"}>
              {mastery.tier}
            </Badge>
            <span className="text-xs text-muted-foreground">{totalFights} fights</span>
          </div>
          <span className="text-[10px] text-muted-foreground">×{mastery.mult} passives</span>
        </div>

        <div className="space-y-3 pt-1">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Eye className="h-3 w-3" /> Discovery Progress
          </div>
          <DiscoveryProgressBar
            progress={progress.weaponProgress}
            stage={progress.weaponStage}
            label="Favorite Weapon"
            hint1Label="Developing..."
            hint2Label="Preference emerging"
            revealLabel="Discovered! (+1 ATT)"
            hint1At={WEAPON_HINT_FIGHTS}
            hint2At={WEAPON_HINT_FIGHTS * 2}
            revealAt={WEAPON_REVEAL_FIGHTS}
          />
          <DiscoveryProgressBar
            progress={progress.rhythmProgress}
            stage={progress.rhythmStage}
            label="Natural Rhythm"
            hint1Label="Rhythm forming..."
            hint2Label="Approach emerging"
            revealLabel="Discovered! (+1 INI)"
            hint1At={RHYTHM_HINT_FIGHTS}
            hint2At={RHYTHM_HINT_FIGHTS * 2}
            revealAt={RHYTHM_REVEAL_FIGHTS}
          />
        </div>

        <div className="border-t border-border pt-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Discovered Preferences</div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Swords className="h-3 w-3" /> Favorite Weapon
            </div>
            {favDisplay.weapon ? (
              <div className="text-sm font-semibold text-accent">{favDisplay.weapon}</div>
            ) : favDisplay.weaponHint ? (
              <div className="text-sm text-muted-foreground italic">{favDisplay.weaponHint}</div>
            ) : (
              <div className="text-sm text-muted-foreground/50">Not yet discovered</div>
            )}
          </div>
          {!warrior.favorites.discovered.weapon && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => handleInsight("weapon")} aria-label="Reveal favorite weapon">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Use Insight Token to reveal</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" /> Natural Rhythm
            </div>
            {favDisplay.rhythm ? (
              <div className="text-sm font-semibold text-accent">{favDisplay.rhythm}</div>
            ) : favDisplay.rhythmHint ? (
              <div className="text-sm text-muted-foreground italic">{favDisplay.rhythmHint}</div>
            ) : (
              <div className="text-sm text-muted-foreground/50">Not yet discovered</div>
            )}
          </div>
          {!warrior.favorites.discovered.rhythm && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => handleInsight("rhythm")} aria-label="Reveal natural rhythm">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Use Insight Token to reveal</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
