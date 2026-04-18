/**
 * Gazette Narrative Generation - Generates narrative text for gazette entries
 * Extracted from gazetteNarrative.ts to follow SRP
 */
import narrativeContent from "@/data/narrativeContent.json";
import type { NarrativeContent } from "@/types/narrative.types";
import type { FightSummary } from "@/types/combat.types";
import type { CrowdMoodType } from "@/types/shared.types";
import type { Warrior } from "@/types/warrior.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { styleName, t, MOOD_TONE } from "./gazetteTemplateHelpers";
import type { GazetteDetections } from "./gazetteDetections";

/**
 * Generates narrative for a single fight.
 */
export function generateFightNarrative(fight: FightSummary, mood: CrowdMoodType, rng?: IRNGService): string {
  const safeRng = rng || new SeededRNGService(fight.week * 42);
  const toneResource = MOOD_TONE[mood] || MOOD_TONE["Calm"];
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

/**
 * Generates gazette headline based on detections.
 */
export function generateGazetteHeadline(
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
    return t(rngService.pick(gh.Kill), { week, killer: kills[0]?.winner === "A" ? kills[0]?.a : kills[0]?.d, loser: kills[0]?.winner === "A" ? kills[0]?.d : kills[0]?.a });
  } else if (knockouts.length >= 2) {
    return t(rngService.pick(gh.MultipleKOs), { week, adj: rngService.pick(tone.adjectives) });
  } else if (fights.length > 0) {
    return t(rngService.pick(gh.Standard), { week, adj: rngService.pick(tone.adjectives) });
  } else {
    return t(rngService.pick(gh.Empty), { week });
  }
}

/**
 * Generates gazette body based on detections.
 */
export function generateGazetteBody(
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

/**
 * Generates a season-end retrospective.
 */
export function generateSeasonSummary(
  fights: FightSummary[],
  mood: CrowdMoodType,
  season: string
): { id: string; headline: string; body: string; mood: CrowdMoodType; tags: string[]; week: number } {
  const kills = fights.filter(f => f.by === "Kill").length;
  const total = fights.length;
  const killRate = total > 0 ? Math.round((kills / total) * 100) : 0;

  // Determine style dominance
  const styleWins: Record<string, number> = {};
  for (const f of fights) {
    if (f.winner === "A") styleWins[f.styleA] = (styleWins[f.styleA] ?? 0) + 1;
    if (f.winner === "D") styleWins[f.styleD] = (styleWins[f.styleD] ?? 0) + 1;
  }

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
