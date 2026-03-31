import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, Crown, Heart, Skull } from "lucide-react";
import { getTagDescription } from "@/data/tagDescriptions";
import {
  STYLE_ABBREV,
  STYLE_DISPLAY_NAMES,
  type TagBadgeProps,
  type StatBadgeProps,
  type WarriorNameTagProps,
  TagType,
  FightingStyle,
  CareerRecord,
} from "@/types/game";
import { WarriorLink } from "@/components/EntityLink";

/**
 * Unified WarriorBadge component consolidating TagBadge, StatBadge, and WarriorNameTag.
 */
export type WarriorBadgeProps =
  | {
      variant?: "tag";
      className?: string;
      tag: string;
      type: TagType;
    }
  | {
      variant: "stat";
      className?: string;
      styleName: FightingStyle;
      career?: CareerRecord;
      badgeVariant?: "default" | "secondary" | "destructive" | "outline";
      showFullName?: boolean;
    }
  | {
      variant: "name";
      className?: string;
      id?: string;
      name: string;
      isChampion?: boolean;
      injuryCount?: number;
      useCrown?: boolean;
      isDead?: boolean;
    };

export function WarriorBadge(props: WarriorBadgeProps) {
  const { variant = "tag", className } = props;

  if (variant === "tag") {
    const { tag, type } = props;
    if (!tag) return null;
    const description = getTagDescription(tag);

    const badge = (() => {
      switch (type) {
        case "flair":
          return (
            <Badge variant="secondary" className={`text-arena-gold border-arena-gold/30 ${className ?? ""}`}>
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
        default:
          return <Badge className={className}>{tag}</Badge>;
      }
    })();

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{badge}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs">
          {description}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (variant === "stat") {
    const { styleName, career, badgeVariant = "outline", showFullName = false } = props;
    if (!styleName) return null;
    return (
      <div className={`flex items-center gap-2 ${className ?? ""}`}>
        <Badge variant={badgeVariant} className="text-[10px] font-mono h-4 px-1 shrink-0">
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

  if (variant === "name") {
    const { id, name, isChampion, injuryCount = 0, useCrown = false, isDead = false } = props;
    const ChampionIcon = useCrown ? Crown : Trophy;

    return (
      <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
        <span className={`font-display font-semibold text-sm truncate ${isDead ? "text-muted-foreground line-through" : ""}`}>
          {id && name ? (
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

  return null;
}

// Keep legacy exports around as aliases for backward compatibility if needed,
// but we will update all usages.
export function TagBadge(props: TagBadgeProps) {
  return <WarriorBadge variant="tag" {...props} />;
}

export function StatBadge(props: StatBadgeProps) {
  return <WarriorBadge variant="stat" {...props} badgeVariant={props.variant} />;
}

export function WarriorNameTag(props: WarriorNameTagProps) {
  return <WarriorBadge variant="name" {...props} />;
}
