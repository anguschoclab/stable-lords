/**
 * Announcer AI — generates flavourful blurbs, hype lines, and recap narration.
 * Consolidated from: AnnouncerAI.ts, ui/commentator.ts, ui/fightVariety.ts
 */

// ── Tone-aware blurbs ─────────────────────────────────────────────────────

const exclaim = [
  "Great heavens!",
  "By the gods!",
  "Mercy!",
  "Hark!",
  "Witness!",
  "What a clash!",
];
const flourish = [
  "in a blur",
  "with a deft twist",
  "after a feint",
  "despite the odds",
  "to the crowd's delight",
];
const finishers = [
  "drops the guard",
  "finds the opening",
  "presses the advantage",
  "seals the bout",
  "drives the point home",
];

export type AnnounceTone = "neutral" | "hype" | "grim";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function blurb(opts: {
  tone?: AnnounceTone;
  winner?: string;
  loser?: string;
  by?: string;
}): string {
  const t = opts.tone || "neutral";
  const w = opts.winner || "The victor";
  const l = opts.loser || "his foe";
  const by = opts.by ? ` by ${opts.by.toLowerCase()}` : "";

  if (t === "hype")
    return `${pick(exclaim)} ${w} ${pick(finishers)} ${pick(flourish)}!`;
  if (t === "grim")
    return `${w} overcomes ${l}${by}, the arena falls hushed.`;
  return `${w} bests ${l}${by}.`;
}

// ── Short hype lines (formerly ui/commentator.ts) ─────────────────────────

export function commentatorFor(
  tag: "KO" | "Kill" | "Flashy" | "Upset"
): string {
  switch (tag) {
    case "KO":
      return "What a knockout! The crowd erupts!";
    case "Kill":
      return "A fatal finish—steel and silence. The arena gasps.";
    case "Flashy":
      return "Spectacle! Flourishes and feints—pure theatre!";
    case "Upset":
      return "An upset for the ages! The favorite falls.";
  }
}

// ── Recap narration (formerly ui/fightVariety.ts) ─────────────────────────

export function recapLine(
  winner: string,
  loser: string,
  minutes: number
): string {
  const choices = [
    `${winner} dismantled ${loser} in a brisk ${minutes}-minute clash.`,
    `${loser} could not weather ${winner}'s onslaught—done in ${minutes}.`,
    `${winner} outfoxed ${loser} and sealed it in ${minutes}.`,
    `${winner} turned the tide and toppled ${loser} after ${minutes} minutes.`,
    `${winner} took center stage, leaving ${loser} reeling in ${minutes}.`,
  ];
  return choices[Math.floor(Math.random() * choices.length)];
}
