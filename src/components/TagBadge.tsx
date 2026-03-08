/**
 * Reusable badge with tooltip explaining the tag's gameplay impact.
 */
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trophy } from "lucide-react";
import { getTagDescription } from "@/data/tagDescriptions";

type TagType = "flair" | "title" | "injury";

interface TagBadgeProps {
  tag: string;
  type: TagType;
  className?: string;
}

export default function TagBadge({ tag, type, className }: TagBadgeProps) {
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
