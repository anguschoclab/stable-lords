import narrativeContent from "@/data/narrativeContent.json";
import type { NarrativeContent } from "@/types/narrative.types";
/**
 * Gazette Narrative Engine — generates crowd-mood-toned prose from simulation events.
 * Synthesizes weekly fight data into procedural stories.
 */
import type { FightSummary } from "@/types/combat.types";
import type { CrowdMoodType } from "@/types/shared.types";
import type { Warrior } from "@/types/warrior.types";
import type { GazetteStory } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { STYLE_DISPLAY_NAMES } from "@/types/shared.types";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";



const MOOD_TONE: Record<CrowdMoodType, { adjectives: string[]; opener: string[]; closer: string[] }> = (narrativeContent as NarrativeContent).ux_metadata.mood_tone;

function styleName(style: string): string {
  return STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style;
}

function t(template: string | string[], data: Record<string, any>, rng?: IRNGService): string {
  let result = Array.isArray(template)
    ? (rng ? rng.pick(template) : template[Math.floor(new SeededRNGService(Date.now()).next() * template.length)] || "")
    : template;
  if (!result) return "";
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }
  return result;
}

export function generateFightNarrative(fight: FightSummary, mood: CrowdMoodType, rng?: IRNGService): string {
  const safeRng = rng || new SeededRNGService(fight.week * 42);
  const toneResource = MOOD_TONE[mood] || MOOD_TONE["Calm"];
  // Log warning for debugging if a new mood type is added without tone data
  if (!MOOD_TONE[mood] && mood !== "Calm") console.error(`Missing mood tone logic for: ${mood}, falling back to Calm`);
  const adj = safeRng.pick(toneResource.adjectives);
  const winner = fight.winner === "A" ? fight.a : fight.winner === "D" ? fight.d : null;
  const loser = fight.winner === "A" ? fight.d : fight.winner === "D" ? fight.a : null;
  const g = (narrativeContent as NarrativeContent).gazette.fights;

  const data = {
    adj,
    winner,
    loser,
    styleW: styleName(fight.winner === "A" ? fight.styleA : fight.styleD),
    styleL: styleName(fight.winner === "A" ? fight.styleD : fight.styleA),
    a: fight.a,
    d: fight.d
  };

  if (fight.by === "Kill" && winner && loser) {
    return t(safeRng.pick(g.Kill), data);
  }

  if (fight.by === "KO" && winner && loser) {
    return t(safeRng.pick(g.KO), data);
  }

  if (fight.by === "Stoppage" && winner) {
    return t(safeRng.pick(g.Stoppage), data);
  }

  if (fight.by === "Exhaustion") {
    return winner
      ? t(safeRng.pick(g.Exhaustion), data)
      : t(safeRng.pick(g.Draw), data);
  }

  if (!winner) {
    return t(safeRng.pick(g.Draw), data);
  }

  return t(safeRng.pick(g.Default), data);
}

/** Compute current win streaks from fight history */
export function computeStreaks(allFights: FightSummary[]): Map<string, number> {
  const streaks = new Map<string, number>();
  // ⚡ Bolt: Avoid spreading and sorting the massive allFights array.
  // arenaHistory is append-only and chronological by definition.
  for (let i = 0; i < allFights.length; i++) {
    const f = allFights[i];
    if (!f) continue;
    if (f.winner === "A") {
      const aStreak = streaks.get(f.a) ?? 0;
      const dStreak = streaks.get(f.d) ?? 0;
      streaks.set(f.a, aStreak >= 0 ? aStreak + 1 : 1);
      streaks.set(f.d, dStreak <= 0 ? dStreak - 1 : -1);
    } else if (f.winner === "D") {
      const aStreak = streaks.get(f.a) ?? 0;
      const dStreak = streaks.get(f.d) ?? 0;
      streaks.set(f.d, dStreak >= 0 ? dStreak + 1 : 1);
      streaks.set(f.a, aStreak <= 0 ? aStreak - 1 : -1);
    } else {
      streaks.set(f.a, 0);
      streaks.set(f.d, 0);
    }
  }
  return streaks;
}

/** Detect if any fight this week involves warriors who have faced each other 3+ times */
function detectRivalryMatchup(
  weekFights: FightSummary[],
  allFights: FightSummary[]
): { a: string; b: string; count: number } | null {
  // Optimization: Only count pairs that fought this week
  const candidatePairs = new Set<string>();
  const names = new Set<string>();
  for (let i = 0; i < weekFights.length; i++) {
    const f = weekFights[i];
    if (!f) continue;
    candidatePairs.add(f.a < f.d ? `${f.a}||${f.d}` : `${f.d}||${f.a}`);
    names.add(f.a);
    names.add(f.d);
  }

  const pairCounts = new Map<string, number>();
  for (const key of candidatePairs) {
    pairCounts.set(key, 0);
  }

  // ⚡ Bolt: Fast existence check using names Set before template literal string allocation
  for (let i = 0; i < allFights.length; i++) {
    const f = allFights[i];
    if (!f) continue;
    if (names.has(f.a) && names.has(f.d)) {
      const key = f.a < f.d ? `${f.a}||${f.d}` : `${f.d}||${f.a}`;
      if (pairCounts.has(key)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        pairCounts.set(key, pairCounts.get(key)! + 1);
      }
    }
  }

  let best: { a: string; b: string; count: number } | null = null;
  for (let i = 0; i < weekFights.length; i++) {
    const f = weekFights[i];
    if (!f) continue;
    const key = f.a < f.d ? `${f.a}||${f.d}` : `${f.d}||${f.a}`;
    const count = pairCounts.get(key) ?? 0;
    if (count >= 3 && (!best || count > best.count)) {
      best = { a: f.a, b: f.d, count };
    }
  }
  return best;
}

export function generateWeeklyGazette(
  fights: FightSummary[],
  mood: CrowdMoodType,
  week: number,
  graveyard: Warrior[],
  allFights?: FightSummary[],
  rng?: IRNGService
): GazetteStory {
  const rngService = rng || new SeededRNGService(week * 7919 + 55);
  const storyId = rngService.uuid();
  const moodKey = mood && MOOD_TONE[mood] ? mood : "Calm";
  const tone = MOOD_TONE[moodKey];

  // Run all detections
  const streaks = allFights ? computeStreaks(allFights) : new Map<string, number>();
  const hotStreakers = detectHotStreakers(fights, streaks);
  const rivalryPair = detectRivalryMatchup(fights, allFights ?? []);
  const risingStars = detectRisingStars(fights, allFights ?? []);
  const upsets = detectUpsets(fights);

  const detections: GazetteDetections = {
    tags: [],
    hotStreakers,
    rivalryPair,
    risingStars,
    upsets,
  };

  // Generate tags from detections
  detections.tags = detectGazetteTags(fights, detections);

  // Generate headline and body using helper functions
  const headline = generateGazetteHeadline(detections, fights, week, mood, rngService, tone);
  const body = generateGazetteBody(detections, fights, mood, week, graveyard, rngService, tone);

  return {
    id: storyId,
    headline,
    body,
    mood,
    tags: detections.tags,
    week,
  };
}

// ─── Gazette Detection Helpers ───────────────────────────────────────────────

interface GazetteDetections {
  tags: string[];
  hotStreakers: { name: string; streak: number }[];
  rivalryPair: { a: string; b: string; count: number } | null;
  risingStars: string[];
  upsets: { winner: string; loser: string; winnerFame: number; loserFame: number }[];
}

function detectGazetteTags(fights: FightSummary[], detections: GazetteDetections): string[] {
  const tags: string[] = [];
  const kills = fights.filter(f => f.by === "Kill");
  const knockouts = fights.filter(f => f.by === "KO");

  if (kills.length >= 2) tags.push("Bloodbath");
  if (fights.some(f => f.flashyTags?.includes("Comeback"))) tags.push("Comeback");
  if (fights.some(f => f.flashyTags?.includes("Dominance"))) tags.push("Dominance");
  if (knockouts.length >= 3) tags.push("KO Fest");
  if (detections.hotStreakers.length > 0) tags.push("Hot Streak");
  if (detections.rivalryPair) tags.push("Rivalry");
  if (detections.risingStars.length > 0) tags.push("Rising Star");
  if (detections.upsets.length > 0) tags.push("Upset");

  return tags;
}

function detectHotStreakers(fights: FightSummary[], streaks: Map<string, number>): { name: string; streak: number }[] {
  const hotStreakers: { name: string; streak: number }[] = [];
  for (const f of fights) {
    if (!f.winner) continue;
    const winnerName = f.winner === "A" ? f.a : f.d;
    const s = streaks.get(winnerName) ?? 0;
    if (s >= 5) hotStreakers.push({ name: winnerName, streak: s });
  }
  return hotStreakers;
}

function detectRisingStars(fights: FightSummary[], allFights: FightSummary[]): string[] {
  const risingStars: string[] = [];
  if (!allFights || fights.length === 0) return risingStars;

  const candidates = new Set<string>();
  for (const f of fights) {
    if (f.winner) {
      candidates.add(f.winner === "A" ? f.a : f.d);
    }
  }

  const stats = new Map<string, { total: number; wins: number }>();
  for (const c of candidates) {
    stats.set(c, { total: 0, wins: 0 });
  }

  for (const af of allFights) {
    if (candidates.has(af.a)) {
      const s = stats.get(af.a)!;
      s.total++;
      if (af.winner === "A") s.wins++;
    }
    if (candidates.has(af.d)) {
      const s = stats.get(af.d)!;
      s.total++;
      if (af.winner === "D") s.wins++;
    }
  }

  for (const c of candidates) {
    const s = stats.get(c)!;
    if (s.total === 3 && s.wins === 3) {
      risingStars.push(c);
    }
  }

  return risingStars;
}

function detectUpsets(fights: FightSummary[]): { winner: string; loser: string; winnerFame: number; loserFame: number }[] {
  const upsets: { winner: string; loser: string; winnerFame: number; loserFame: number }[] = [];
  for (const f of fights) {
    if (!f.winner || f.fameA == null || f.fameD == null) continue;
    const winnerFame = f.winner === "A" ? f.fameA : f.fameD;
    const loserFame = f.winner === "A" ? f.fameD : f.fameA;
    const winnerName = f.winner === "A" ? f.a : f.d;
    const loserName = f.winner === "A" ? f.d : f.a;
    if (loserFame >= winnerFame + 10 && loserFame >= winnerFame * 2) {
      upsets.push({ winner: winnerName, loser: loserName, winnerFame, loserFame });
    }
  }
  return upsets;
}

function generateGazetteHeadline(
  detections: GazetteDetections,
  fights: FightSummary[],
  week: number,
  mood: CrowdMoodType,
  rngService: IRNGService,
  tone: { adjectives: string[] }
): string {
  const gh = (narrativeContent as NarrativeContent).gazette.headlines;
  const kills = fights.filter(f => f.by === "Kill");
  const knockouts = fights.filter(f => f.by === "KO");

  if (detections.hotStreakers.length > 0) {
    const top = detections.hotStreakers.reduce((max, curr) => curr.streak > max.streak ? curr : max, detections.hotStreakers[0] as { name: string; streak: number });
    if (!top) {
      return t(rngService.pick(gh.Standard), { week, adj: rngService.pick(tone.adjectives) });
    } else if (top.streak >= 10) {
      return t(rngService.pick(gh.LegendaryStreak), { week, name: top.name, streak: top.streak });
    } else if (top.streak >= 7) {
      return t(rngService.pick(gh.HotStreak), { week, name: top.name, streak: top.streak });
    } else {
      return t(rngService.pick((gh as any).win_streak ? (gh as any).win_streak : gh.Streak), { week, name: top.name, streak: top.streak });
    }
  } else if (detections.rivalryPair) {
    const rivalryHeadline = detections.rivalryPair.count >= 5 ? (gh.LegacyRivalry || gh.Rivalry) : (gh.Rivalry || gh.Rivalry);
    return t(rngService.pick(rivalryHeadline), {
      week, a: detections.rivalryPair.a, b: detections.rivalryPair.b, count: detections.rivalryPair.count 
    });
  } else if (detections.risingStars.length > 0) {
    return t(rngService.pick(gh.RisingStar || gh.Standard), { week, name: detections.risingStars[0] });
  } else if (detections.upsets.length > 0) {
    const [upset] = detections.upsets;
    if (!upset) {
      return t(rngService.pick(gh.Standard), { week, adj: rngService.pick(tone.adjectives) });
    }
    const upsetHeadline = (gh as any).major_upset && upset.loserFame / upset.winnerFame >= 3 ? (gh as any).major_upset : gh.Upset;
    return t(rngService.pick(upsetHeadline), { week, winner: upset.winner, loser: upset.loser });
  } else if (kills.length >= 2) {
    return t(rngService.pick(gh.MultipleKills), { week, count: kills.length });
  } else if (kills.length === 1) {
    return t(rngService.pick(gh.Kill), { week, killer: kills[0]?.winner === "A" ? kills[0]?.a : kills[0]?.d });
  } else if (knockouts.length >= 2) {
    return t(rngService.pick(gh.MultipleKOs), { week, adj: rngService.pick(tone.adjectives) });
  } else if (fights.length > 0) {
    return t(rngService.pick(gh.Standard), { week, adj: rngService.pick(tone.adjectives) });
  } else {
    return t(rngService.pick(gh.Empty), { week });
  }
}

function generateGazetteBody(
  detections: GazetteDetections,
  fights: FightSummary[],
  mood: CrowdMoodType,
  week: number,
  graveyard: Warrior[],
  rngService: IRNGService,
  tone: { adjectives: string[]; opener: string[]; closer: string[] }
): string {
  const paragraphs: string[] = [rngService.pick(tone.opener)];
  const gf = (narrativeContent as NarrativeContent).gazette.featured;
  const kills = fights.filter(f => f.by === "Kill");

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
    paragraphs.push(generateFightNarrative(fight, mood, rngService));
  }

  // Streak narratives
  for (const s of detections.hotStreakers) {
    if (s.streak >= 10) {
      paragraphs.push(t(rngService.pick(gf.LegendaryStreak), { name: s.name, streak: s.streak }));
    } else if (s.streak >= 7) {
      paragraphs.push(t(rngService.pick(gf.HotStreak), { name: s.name, streak: s.streak }));
    } else {
      paragraphs.push(t(rngService.pick(gf.Streak), { name: s.name, streak: s.streak }));
    }
  }

  // Rivalry narrative
  if (detections.rivalryPair) {
    paragraphs.push(t(rngService.pick(detections.rivalryPair.count >= 5 ? gf.LegacyRivalry : gf.Rivalry), {
      a: detections.rivalryPair.a, b: detections.rivalryPair.b, count: detections.rivalryPair.count, suffix: detections.rivalryPair.count === 3 ? "rd" : "th" 
    }));
  }

  // Rising star narrative
  for (const star of detections.risingStars) {
    paragraphs.push(t(rngService.pick(gf.RisingStar), { name: star }));
  }

  // Upset narrative
  for (const u of detections.upsets) {
    paragraphs.push(t(rngService.pick(gf.Upset), { winner: u.winner, loser: u.loser, fameW: u.winnerFame, fameL: u.loserFame }));
  }

  // Graveyard mention
  if (graveyard.length > 0) {
    const recent = graveyard.filter(w => w.deathWeek === week);
    if (recent.length > 0) {
      paragraphs.push(t(rngService.pick(gf.Graveyard), { count: recent.length, plural: recent.length !== 1 ? "s" : "" }));
    }
  }

  paragraphs.push(rngService.pick(tone.closer));

  return paragraphs.join("\n\n");
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

  // ⚡ Bolt: Use a single-pass linear scan to track the maximum value, avoiding O(N log N) operations and unnecessary array allocations.
  let topStyle: [string, number] | undefined = undefined;
  for (const [style, wins] of Object.entries(styleWins)) {
    if (!topStyle || wins > topStyle[1]) {
      topStyle = [style, wins];
    }
  }

  const gs = (narrativeContent as NarrativeContent).gazette.season_summary;
  const headline = t(gs.headline, { season, total, kills });
  const body = [
    gs.body[0] ? t(gs.body[0], { season, total, killRate }) : "",
    topStyle && gs.body[1] ? t(gs.body[1], { style: styleName(topStyle[0]), wins: topStyle[1] }) : "",
    kills >= 5 && gs.body[2] ? gs.body[2] : "",
    gs.body[3] || "",
  ].filter(Boolean).join("\n\n");

  return { id: `summary_${season}`, headline, body, mood, tags: ["Season Review"], week: -1 };
}
