import { Warrior, ATTRIBUTE_KEYS } from "@/types/game";

/**
 * Narrative descriptors for growth headroom.
 * These hint at potential without showing numbers.
 */
export function growthNarrative(current: number, potential: number | undefined): {
  label: string;
  color: string;
  tooltip: string;
} {
  if (potential === undefined) {
    return { label: "", color: "", tooltip: "Growth potential unknown" };
  }
  const gap = potential - current;
  if (gap <= 0) return {
    label: "Mastered",
    color: "text-muted-foreground",
    tooltip: "This warrior has reached their natural ceiling in this area.",
  };
  if (gap === 1) return {
    label: "Nearing peak",
    color: "text-arena-gold/70",
    tooltip: "Little room left to grow. Training gains will be rare.",
  };
  if (gap === 2) return {
    label: "Maturing",
    color: "text-arena-gold",
    tooltip: "Some growth remains, but progress is slowing.",
  };
  if (gap <= 5) return {
    label: "Developing",
    color: "text-primary",
    tooltip: "Solid room for improvement through training and experience.",
  };
  return {
    label: "Raw talent",
    color: "text-accent glow-neon-blue drop-shadow-md",
    tooltip: "Tremendous untapped potential. This warrior could become exceptional.",
  };
}

/** Overall narrative assessment of a warrior's growth ceiling */
export function overallGrowthNarrative(warrior: Warrior): string {
  if (!warrior.potential) return "This warrior's limits are unknown.";
  const gaps = ATTRIBUTE_KEYS.map(k => (warrior.potential![k] || 0) - warrior.attributes[k]);
  const totalGap = gaps.reduce((s, g) => s + Math.max(0, g), 0);
  const maxedCount = gaps.filter(g => g <= 0).length;

  if (maxedCount === 7) return "A fully realized warrior — there is nothing more the arena can teach.";
  if (maxedCount >= 5) return "Nearing the end of their growth. Focus training on what remains.";
  if (totalGap >= 30) return "Brimming with untapped potential. The right training could forge a legend.";
  if (totalGap >= 15) return "Still growing. There are gains to be made across the board.";
  return "Approaching their natural limits, but a few areas can still sharpen.";
}
