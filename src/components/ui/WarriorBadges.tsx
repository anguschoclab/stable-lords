import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, Crown, Heart, Skull } from "lucide-react";
import { getTagDescription } from "@/data/tagDescriptions";
import {
  STYLE_ABBREV,
  STYLE_DISPLAY_NAMES,
  type TagBadgeProps,
  type StatBadgeProps,
  type WarriorNameTagProps
} from "@/types/game";
import { WarriorLink } from "@/components/EntityLink";

// ─── TagBadge ─────────────────────────────────────────────────────────────

/**
 * Reusable badge with tooltip explaining the tag's gameplay impact.
 */
export function TagBadge({ tag, type, className }: TagBadgeProps) {
  const description = getTagDescription(tag);

  const badge = (() => {
    switch (type) {
      case "flair":
        return (
          <Badge variant="secondary" className={cn("text-arena-gold border-arena-gold/30", className)}>
            {tag}
          </Badge>
        );
      case "title":
        return (
          <Badge className={`bg-arena-gold/20 text-arena-gold border-arena-gold/30 ${className ?? ""}`}>
            <Trophy className="h-3 w-3 mr-1" /> {tag}
          </Badge>
        );
      case "injury":
        return (
          <Badge variant="destructive" className={className}>
            {tag}
          </Badge>
        );
    }
  })();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{badge}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="w-full max-w-xs text-xs">
        {description}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── StatBadge ────────────────────────────────────────────────────────────

export function StatBadge({ styleName, career, variant = "outline", showFullName = false, className }: StatBadgeProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant={variant} className="text-[10px] font-mono h-4 px-1 shrink-0">
        {showFullName ? (STYLE_DISPLAY_NAMES[styleName] || styleName) : (STYLE_ABBREV[styleName] || styleName)}
      </Badge>
      {career && (
        <span className="text-[10px] text-muted-foreground">
          {career.wins}W-{career.losses}L
          {career.kills > 0 && <span className="text-arena-blood ml-0.5">{career.kills}K</span>}
        </span>
      )}
    </div>
  );
}

// ─── WarriorNameTag ───────────────────────────────────────────────────────

export function WarriorNameTag({
  id,
  name,
  isChampion,
  injuryCount = 0,
  useCrown = false,
  isDead = false,
}: WarriorNameTagProps) {
  const ChampionIcon = useCrown ? Crown : Trophy;

  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-display font-semibold text-sm truncate ${isDead ? "text-muted-foreground line-through" : ""}`}>
        {id ? (
          <WarriorLink name={name} id={id}>
            {name}
          </WarriorLink>
        ) : (
          name
        )}
      </span>
      {isDead && <Skull className="h-3 w-3 text-muted-foreground shrink-0" />}
      {isChampion && <ChampionIcon className="h-3 w-3 text-arena-gold shrink-0" />}
      {injuryCount > 0 && <Heart className="h-3 w-3 text-destructive shrink-0" />}
    </div>
  );
}
