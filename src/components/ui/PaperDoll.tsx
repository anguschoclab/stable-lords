import React from "react";
import { cn } from "@/lib/utils";

export type BodyPart = "Head" | "Torso" | "LeftArm" | "RightArm" | "Legs";

export interface PaperDollProps {
  healthMap: Partial<Record<BodyPart, number>>;
  className?: string;
}

export function PaperDoll({ healthMap, className }: PaperDollProps) {
  const getPartColor = (part: BodyPart) => {
    const hp = healthMap[part] ?? 100;
    if (hp <= 0) return "fill-neutral-900";
    if (hp < 20) return "fill-red-600";
    if (hp <= 50) return "fill-yellow-500";
    return "fill-green-500";
  };

  return (
    <div className={cn("relative w-full max-w-xs aspect-[1/2]", className)}>
      <svg
        viewBox="0 0 100 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Head */}
        <circle
          cx="50"
          cy="25"
          r="15"
          className={cn("transition-colors duration-500", getPartColor("Head"))}
          data-testid="body-part-head"
          stroke="currentColor"
          strokeWidth="2"
        />
        
        {/* Torso */}
        <path
          d="M35 45H65L70 110H30L35 45Z"
          className={cn("transition-colors duration-500", getPartColor("Torso"))}
          data-testid="body-part-torso"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Left Arm */}
        <path
          d="M30 50L10 100L15 105L35 60"
          className={cn("transition-colors duration-500", getPartColor("LeftArm"))}
          data-testid="body-part-left-arm"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Right Arm */}
        <path
          d="M70 50L90 100L85 105L65 60"
          className={cn("transition-colors duration-500", getPartColor("RightArm"))}
          data-testid="body-part-right-arm"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Legs (Simplified as one unit for now, as per Lead Engineer's spec "Legs") */}
        <path
          d="M35 110L25 180H45L50 130L55 180H75L65 110"
          className={cn("transition-colors duration-500", getPartColor("Legs"))}
          data-testid="body-part-legs"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
