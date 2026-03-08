/**
 * Gazette Narrative Engine — generates crowd-mood-toned prose from simulation events.
 * Synthesizes weekly fight data into procedural stories.
 */
import type { FightSummary, CrowdMoodType, Warrior } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";

export interface GazetteStory {
  headline: string;
  body: string;
  mood: CrowdMoodType;
  tags: string[];
}

const MOOD_TONE: Record<CrowdMoodType, { adjectives: string[]; opener: string[]; closer: string[] }> = {
  Calm: {
    adjectives: ["measured", "disciplined", "calculated", "precise"],
    opener: [
      "The arena operated with quiet efficiency this week.",
      "A week of steady competition unfolded in the coliseum.",
      "The crowds watched with studied attention as the week's bouts concluded.",
    ],
    closer: [
      "The arena sleeps peacefully tonight.",
      "Order reigns in the halls of combat.",
      "Another measured week draws to a close.",
    ],
  },
  Bloodthirsty: {
    adjectives: ["savage", "brutal", "merciless", "vicious"],
    opener: [
      "Blood painted the sands this week as the arena demanded sacrifice!",
      "The crowd bayed for blood — and the fighters delivered!",
      "Violence ruled the coliseum in a week of savage combat!",
    ],
    closer: [
      "The sands drink deep tonight.",
      "The crowd's thirst is satisfied — for now.",
      "Death stalks the arena, and the people love it.",
    ],
  },
  Theatrical: {
    adjectives: ["dramatic", "spectacular", "breathtaking", "legendary"],
    opener: [
      "What a spectacle! The arena delivered drama worthy of the old legends!",
      "The poets will write songs about this week's extraordinary bouts!",
      "Pure theater! Every bout was a performance for the ages!",
    ],
    closer: [
      "The bards already compose their verses.",
      "What stories will be told of this week!",
      "The crowd departs buzzing with tales of glory.",
    ],
  },
  Solemn: {
    adjectives: ["somber", "grave", "reverent", "heavy"],
    opener: [
      "A heavy silence hung over the arena this week.",
      "The weight of loss and sacrifice defined the week's combat.",
      "The coliseum bore witness to solemn displays of warrior resolve.",
    ],
    closer: [
      "The fallen are remembered. The living carry on.",
      "Torches burn low in the hall of warriors tonight.",
      "In silence, the arena honors those who gave everything.",
    ],
  },
  Festive: {
    adjectives: ["jubilant", "electrifying", "glorious", "triumphant"],
    opener: [
      "What a celebration! The arena erupted with joy this week!",
      "Festive energy crackled through every bout this week!",
      "The crowd was on its feet from first bout to last!",
    ],
    closer: [
      "The celebrations continue long into the night!",
      "Glory to the victors — and drinks for all!",
      "A week to remember, a festival of steel and valor!",
    ],
  },
};

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function styleName(style: string): string {
  return STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style;
}

function generateFightNarrative(fight: FightSummary, mood: CrowdMoodType): string {
  const tone = MOOD_TONE[mood];
  const adj = pick(tone.adjectives);
  const winner = fight.winner === "A" ? fight.a : fight.winner === "D" ? fight.d : null;
  const loser = fight.winner === "A" ? fight.d : fight.winner === "D" ? fight.a : null;

  if (fight.by === "Kill" && winner && loser) {
    const templates = [
      `In a ${adj} display of combat, ${winner} (${styleName(fight.winner === "A" ? fight.styleA : fight.styleD)}) struck down ${loser} with a killing blow. The ${styleName(fight.winner === "A" ? fight.styleD : fight.styleA)} fighter will be missed — but not mourned for long in this arena.`,
      `${winner} delivered a ${adj} execution of ${loser}! The crowd gasped as the finishing strike landed. Another warrior returns to the dust.`,
      `Death claimed ${loser} at the hands of ${winner}. A ${adj} end to what was a hard-fought bout.`,
    ];
    return pick(templates);
  }

  if (fight.by === "KO" && winner && loser) {
    return pick([
      `${winner} battered ${loser} into unconsciousness with ${adj} efficiency. The ${styleName(fight.winner === "A" ? fight.styleA : fight.styleD)}'s power was on full display.`,
      `A ${adj} knockout! ${winner} overwhelmed ${loser}'s defenses and left them crumpled on the sand.`,
    ]);
  }

  if (fight.by === "Stoppage" && winner) {
    return `${winner} ground ${loser ?? "the opponent"} down in a ${adj} bout of attrition. The Arenamaster called the stoppage to merciful applause.`;
  }

  if (fight.by === "Exhaustion") {
    return winner
      ? `Both fighters pushed to total exhaustion in a ${adj} endurance contest. ${winner} was awarded the bout by the narrowest of margins.`
      : `A ${adj} bout ended in mutual exhaustion — neither warrior could claim victory.`;
  }

  if (!winner) {
    return `The bout between ${fight.a} and ${fight.d} ended in a ${adj} draw. Neither fighter could gain the decisive advantage.`;
  }

  return `${winner} defeated ${loser ?? fight.d} in a ${adj} contest.`;
}

/** Compute current win streaks from fight history */
function computeStreaks(allFights: FightSummary[]): Map<string, number> {
  const streaks = new Map<string, number>();
  const sorted = [...allFights].sort((a, b) => a.week - b.week);
  for (const f of sorted) {
    if (f.winner === "A") {
      streaks.set(f.a, (streaks.get(f.a) ?? 0) >= 0 ? (streaks.get(f.a) ?? 0) + 1 : 1);
      streaks.set(f.d, (streaks.get(f.d) ?? 0) <= 0 ? (streaks.get(f.d) ?? 0) - 1 : -1);
    } else if (f.winner === "D") {
      streaks.set(f.d, (streaks.get(f.d) ?? 0) >= 0 ? (streaks.get(f.d) ?? 0) + 1 : 1);
      streaks.set(f.a, (streaks.get(f.a) ?? 0) <= 0 ? (streaks.get(f.a) ?? 0) - 1 : -1);
    } else {
      streaks.set(f.a, 0);
      streaks.set(f.d, 0);
    }
  }
  return streaks;
}

export function generateWeeklyGazette(
  fights: FightSummary[],
  mood: CrowdMoodType,
  week: number,
  graveyard: Warrior[],
  allFights?: FightSummary[]
): GazetteStory {
  const tone = MOOD_TONE[mood];
  const kills = fights.filter(f => f.by === "Kill");
  const knockouts = fights.filter(f => f.by === "KO");
  const tags: string[] = [];

  if (kills.length >= 2) tags.push("Bloodbath");
  if (fights.some(f => f.flashyTags?.includes("Comeback"))) tags.push("Comeback");
  if (fights.some(f => f.flashyTags?.includes("Dominance"))) tags.push("Dominance");
  if (knockouts.length >= 3) tags.push("KO Fest");

  // Detect active streaks (5+) among this week's winners
  const streaks = allFights ? computeStreaks(allFights) : new Map<string, number>();
  const hotStreakers: { name: string; streak: number }[] = [];
  for (const f of fights) {
    if (!f.winner) continue;
    const winnerName = f.winner === "A" ? f.a : f.d;
    const s = streaks.get(winnerName) ?? 0;
    if (s >= 5) hotStreakers.push({ name: winnerName, streak: s });
  }
  if (hotStreakers.length > 0) tags.push("Hot Streak");

  // Headline — streak headlines take priority over standard ones
  let headline: string;
  if (hotStreakers.length > 0) {
    const top = hotStreakers.sort((a, b) => b.streak - a.streak)[0];
    if (top.streak >= 10) {
      headline = `Week ${week}: UNSTOPPABLE! ${top.name} Extends Legendary ${top.streak}-Win Streak!`;
    } else if (top.streak >= 7) {
      headline = `Week ${week}: ${top.name} Is On Fire — ${top.streak} Consecutive Victories!`;
    } else {
      headline = `Week ${week}: ${top.name} Rides a ${top.streak}-Win Streak Into Glory!`;
    }
  } else if (kills.length >= 2) {
    headline = `Week ${week}: Blood Runs Deep — ${kills.length} Warriors Fall!`;
  } else if (kills.length === 1) {
    const k = kills[0];
    const killer = k.winner === "A" ? k.a : k.d;
    headline = `Week ${week}: ${killer} Claims a Life in the Arena`;
  } else if (knockouts.length >= 2) {
    headline = `Week ${week}: ${pick(tone.adjectives).charAt(0).toUpperCase() + pick(tone.adjectives).slice(1)} Knockouts Rock the Arena`;
  } else if (fights.length > 0) {
    headline = `Week ${week}: A ${pick(tone.adjectives).charAt(0).toUpperCase() + pick(tone.adjectives).slice(1)} Week in the Coliseum`;
  } else {
    headline = `Week ${week}: Silence in the Arena`;
  }

  // Body
  const paragraphs: string[] = [pick(tone.opener)];

  // Summary stats
  if (fights.length > 0) {
    paragraphs.push(`${fights.length} bout${fights.length !== 1 ? "s" : ""} were contested this week${kills.length > 0 ? `, with ${kills.length} ending in death` : ""}.`);
  }

  // Individual fight narratives (top 3 by "score")
  const scoredFights = fights
    .map(f => ({
      fight: f,
      score: (f.by === "Kill" ? 5 : f.by === "KO" ? 3 : 1) + (f.flashyTags?.length ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  for (const { fight } of scoredFights) {
    paragraphs.push(generateFightNarrative(fight, mood));
  }

  // Streak narratives
  for (const s of hotStreakers) {
    if (s.streak >= 10) {
      paragraphs.push(`The arena trembles before ${s.name}, who has now won an astonishing ${s.streak} bouts in a row! Legends speak of such dominance only in whispers.`);
    } else if (s.streak >= 7) {
      paragraphs.push(`${s.name} continues an incredible run of form with ${s.streak} consecutive victories. Can anyone stop this warrior?`);
    } else {
      paragraphs.push(`${s.name} is building momentum with ${s.streak} wins in a row — a warrior to watch closely.`);
    }
  }

  // Graveyard mention
  if (graveyard.length > 0) {
    const recent = graveyard.filter(w => w.deathWeek === week);
    if (recent.length > 0) {
      paragraphs.push(`The Hall of Warriors receives ${recent.length} new name${recent.length !== 1 ? "s" : ""} this week. Their sacrifice is not forgotten.`);
    }
  }

  paragraphs.push(pick(tone.closer));

  return {
    headline,
    body: paragraphs.join("\n\n"),
    mood,
    tags,
  };
}

/** Generate a season-end retrospective */
export function generateSeasonSummary(
  fights: FightSummary[],
  mood: CrowdMoodType,
  season: string
): GazetteStory {
  const kills = fights.filter(f => f.by === "Kill").length;
  const total = fights.length;
  const killRate = total > 0 ? Math.round((kills / total) * 100) : 0;

  // Determine style dominance
  const styleWins: Record<string, number> = {};
  for (const f of fights) {
    if (f.winner === "A") styleWins[f.styleA] = (styleWins[f.styleA] ?? 0) + 1;
    if (f.winner === "D") styleWins[f.styleD] = (styleWins[f.styleD] ?? 0) + 1;
  }
  const topStyle = Object.entries(styleWins).sort(([, a], [, b]) => b - a)[0];

  const headline = `${season} Season in Review: ${total} Bouts, ${kills} Deaths`;
  const body = [
    `The ${season} season concludes with ${total} bouts fought and a ${killRate}% fatality rate.`,
    topStyle ? `${styleName(topStyle[0])} dominated the meta with ${topStyle[1]} victories.` : "",
    kills >= 5 ? "It was a particularly deadly season — many promising careers cut short." : "",
    "The arena turns its gaze to the next season. What legends will emerge?",
  ].filter(Boolean).join("\n\n");

  return { headline, body, mood, tags: ["Season Review"] };
}
