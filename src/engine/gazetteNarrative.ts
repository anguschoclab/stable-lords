/**
 * Gazette Narrative Engine — generates crowd-mood-toned prose from simulation events.
 * Synthesizes weekly fight data into procedural stories.
 */
import type { FightSummary, CrowdMoodType, Warrior, GazetteStory } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/shared.types";
import { SeededRNG } from "@/utils/random";



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
    adjectives: ["savage", "brutal", "merciless", "vicious", "gruesome", "blood-drenched"],
    opener: [
      "Gore soaked the arena floor as an unprecedented wave of violence swept the week's bouts!",
      "The crowd's hunger for death was finally satiated by a horrifying display of brutality!",
      "Blood painted the sands this week as the arena demanded sacrifice!",
      "The crowd bayed for blood — and the fighters delivered!",
      "Violence ruled the coliseum in a week of savage combat!",
      "A horrifying symphony of steel and slaughter opened this week's bouts!",
      "No mercy was shown, and none was asked for in a week of absolute carnage!",
      "The sands ran thick with gore as fighters were mercilessly butchered this week!",
      "A terrifying festival of slaughter unfolded in the coliseum!",
      "The stench of fresh blood and terror defined a grueling week in the coliseum!",
      "Gore rained upon the sands as the warriors delivered an unprecedented display of savagery!"
    ],
    closer: [
      "The cleaners will be scrubbing blood from the stones for weeks.",
      "A haunting silence falls over the blood-soaked pit until next week.",
      "The sands drink deep tonight.",
      "The crowd's thirst is satisfied — for now.",
      "Death stalks the arena, and the people love it.",
      "A trail of shattered bones and ruined armor litters the coliseum.",
      "The arena echoes with the dying screams of the defeated.",
      "The crows feast well upon the shattered remains tonight.",
      "A thick stench of blood and death permanently stains the coliseum.",
      "The undertakers will be working overtime tonight.",
      "The ravenous crowd departs, faces spattered with the crimson proof of this week's carnage."
    ],
  },
  Theatrical: {
    adjectives: ["dramatic", "spectacular", "breathtaking", "legendary", "mythic", "awe-inspiring"],
    opener: [
      "What a spectacle! The arena delivered drama worthy of the old legends!",
      "The poets will write songs about this week's extraordinary bouts!",
      "Pure theater! Every bout was a performance for the ages!",
      "A breathtaking showcase of martial prowess captivated the roaring stands!",
      "From the first strike to the last fall, the arena was a stage for demigods!",
      "A breathtaking opera of violence and valor commanded the arena this week!",
      "Epic rivalries and glorious final stands painted a masterpiece on the sands!",
      "A tapestry of valor and violence was woven on the sands this week!"
    ],
    closer: [
      "The bards already compose their verses.",
      "What stories will be told of this week!",
      "The crowd departs buzzing with tales of glory.",
      "Legends were forged in blood and steel today.",
      "The crowd leaves exhausted, their voices hoarse from cheering this epic drama.",
      "The tale of this week's battles will be sung for generations.",
      "A breathtaking finale to a week of mythical combat.",
      "The echo of clashing steel and legendary deeds will linger in the air for ages."
    ],
  },
  Solemn: {
    adjectives: ["somber", "grave", "reverent", "heavy"],
    opener: [
      "A heavy silence hung over the arena this week.",
      "The weight of loss and sacrifice defined the week's combat.",
      "The coliseum bore witness to solemn displays of warrior resolve.",
      "With grim determination, the fighters took to the sands to face their destiny.",
      "A somber mood prevailed as steel met steel in a test of pure survival."
    ],
    closer: [
      "The fallen are remembered. The living carry on.",
      "Torches burn low in the hall of warriors tonight.",
      "In silence, the arena honors those who gave everything.",
      "A heavy toll was exacted upon the brave souls of the coliseum.",
      "The sands conceal the final rest of those who fought to the bitter end."
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

function pick(rng: SeededRNG, arr: string[]): string {
  return rng.pick(arr);
}

function styleName(style: string): string {
  return STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style;
}

export function generateFightNarrative(fight: FightSummary, mood: CrowdMoodType, rng?: SeededRNG): string {
  const safeRng = rng ?? new SeededRNG(fight.week * 42);
  const tone = MOOD_TONE[mood];
  const adj = pick(safeRng, tone.adjectives);
  const winner = fight.winner === "A" ? fight.a : fight.winner === "D" ? fight.d : null;
  const loser = fight.winner === "A" ? fight.d : fight.winner === "D" ? fight.a : null;

  if (fight.by === "Kill" && winner && loser) {
    const templates = [
      `In a ${adj} display of combat, ${winner} (${styleName(fight.winner === "A" ? fight.styleA : fight.styleD)}) struck down ${loser} with a killing blow. The ${styleName(fight.winner === "A" ? fight.styleD : fight.styleA)} fighter will be missed — but not mourned for long in this arena.`,
      `${winner} delivered a ${adj} execution of ${loser}! The crowd gasped as the finishing strike landed. Another warrior returns to the dust.`,
      `Death claimed ${loser} at the hands of ${winner}. A ${adj} end to what was a hard-fought bout.`,
    ];
    return pick(safeRng, templates);
  }

  if (fight.by === "KO" && winner && loser) {
    return pick(safeRng, [
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
export function computeStreaks(allFights: FightSummary[]): Map<string, number> {
  const streaks = new Map<string, number>();
  // ⚡ Bolt: Avoid spreading and sorting the massive allFights array.
  // arenaHistory is append-only and chronological by definition.
  for (let i = 0; i < allFights.length; i++) {
    const f = allFights[i];
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
    if (names.has(f.a) && names.has(f.d)) {
      const key = f.a < f.d ? `${f.a}||${f.d}` : `${f.d}||${f.a}`;
      if (pairCounts.has(key)) {
        pairCounts.set(key, pairCounts.get(key)! + 1);
      }
    }
  }

  let best: { a: string; b: string; count: number } | null = null;
  for (let i = 0; i < weekFights.length; i++) {
    const f = weekFights[i];
    const key = f.a < f.d ? `${f.a}||${f.d}` : `${f.d}||${f.a}`;
    const count = pairCounts.get(key) ?? 0;
    if (count >= 3 && (!best || count > best.count)) {
      best = { a: f.a, b: f.d, count };
    }
  }
  return best;
}


function detectHotStreaks(fights: FightSummary[], allFights?: FightSummary[]): { name: string; streak: number }[] {
  const streaks = allFights ? computeStreaks(allFights) : new Map<string, number>();
  const hotStreakers: { name: string; streak: number }[] = [];
  for (const f of fights) {
    if (!f.winner) continue;
    const winnerName = f.winner === "A" ? f.a : f.d;
    const s = streaks.get(winnerName) ?? 0;
    if (s >= 5) hotStreakers.push({ name: winnerName, streak: s });
  }
  return hotStreakers;
}

function detectRisingStars(fights: FightSummary[], allFights?: FightSummary[]): string[] {
  const risingStars: string[] = [];
  if (allFights && fights.length > 0) {
    const candidates = new Set<string>();
    for (let i = 0; i < fights.length; i++) {
      const f = fights[i];
      if (f.winner) candidates.add(f.winner === "A" ? f.a : f.d);
    }

    const stats = new Map<string, { total: number; wins: number }>();
    for (const c of candidates) stats.set(c, { total: 0, wins: 0 });

    for (let i = 0; i < allFights.length; i++) {
      const af = allFights[i];
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
      if (s.total === 3 && s.wins === 3) risingStars.push(c);
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

function generateHeadline(
  week: number,
  killsCount: number,
  knockoutsCount: number,
  fightsCount: number,
  hotStreakers: { name: string; streak: number }[],
  rivalryPair: { a: string; b: string; count: number } | null,
  risingStars: string[],
  upsets: { winner: string; loser: string; winnerFame: number; loserFame: number }[],
  rng: SeededRNG,
  toneAdjectives: string[],
  kills: FightSummary[]
): string {
  if (hotStreakers.length > 0) {
    const top = hotStreakers.sort((a, b) => b.streak - a.streak)[0];
    if (top.streak >= 10) return `Week ${week}: UNSTOPPABLE! ${top.name} Extends Legendary ${top.streak}-Win Streak!`;
    if (top.streak >= 7) return `Week ${week}: ${top.name} Is On Fire — ${top.streak} Consecutive Victories!`;
    return `Week ${week}: ${top.name} Rides a ${top.streak}-Win Streak Into Glory!`;
  }
  if (rivalryPair) {
    if (rivalryPair.count >= 5) return `Week ${week}: RIVALRY ERUPTS! ${rivalryPair.a} vs ${rivalryPair.b} — Chapter ${rivalryPair.count}!`;
    return `Week ${week}: Old Foes Meet Again — ${rivalryPair.a} vs ${rivalryPair.b} (Bout ${rivalryPair.count})`;
  }
  if (risingStars.length > 0) return `Week ${week}: RISING STAR! ${risingStars[0]} Opens Career with a Perfect 3-0!`;
  if (upsets.length > 0) {
    const u = upsets[0];
    return `Week ${week}: UPSET! ${u.winner} Topples the Mighty ${u.loser}!`;
  }
  if (killsCount >= 2) return `Week ${week}: Blood Runs Deep — ${killsCount} Warriors Fall!`;
  if (killsCount === 1) {
    const k = kills[0];
    return `Week ${week}: ${k.winner === "A" ? k.a : k.d} Claims a Life in the Arena`;
  }
  if (knockoutsCount >= 2) return `Week ${week}: ${pick(rng, toneAdjectives).charAt(0).toUpperCase() + pick(rng, toneAdjectives).slice(1)} Knockouts Rock the Arena`;
  if (fightsCount > 0) return `Week ${week}: A ${pick(rng, toneAdjectives).charAt(0).toUpperCase() + pick(rng, toneAdjectives).slice(1)} Week in the Coliseum`;
  return `Week ${week}: Silence in the Arena`;
}

function generateBody(
  rng: SeededRNG,
  tone: { adjectives: string[]; opener: string[]; closer: string[] },
  fights: FightSummary[],
  killsCount: number,
  mood: CrowdMoodType,
  hotStreakers: { name: string; streak: number }[],
  rivalryPair: { a: string; b: string; count: number } | null,
  risingStars: string[],
  upsets: { winner: string; loser: string; winnerFame: number; loserFame: number }[],
  graveyard: Warrior[],
  week: number
): string {
  const paragraphs: string[] = [pick(rng, tone.opener)];

  if (fights.length > 0) {
    paragraphs.push(`${fights.length} bout${fights.length !== 1 ? "s" : ""} were contested this week${killsCount > 0 ? `, with ${killsCount} ending in death` : ""}.`);
  }

  const scoredFights = fights
    .map(f => ({ fight: f, score: (f.by === "Kill" ? 5 : f.by === "KO" ? 3 : 1) + (f.flashyTags?.length ?? 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  for (const { fight } of scoredFights) paragraphs.push(generateFightNarrative(fight, mood, rng));

  for (const s of hotStreakers) {
    if (s.streak >= 10) paragraphs.push(`The arena trembles before ${s.name}, who has now won an astonishing ${s.streak} bouts in a row! Legends speak of such dominance only in whispers.`);
    else if (s.streak >= 7) paragraphs.push(`${s.name} continues an incredible run of form with ${s.streak} consecutive victories. Can anyone stop this warrior?`);
    else paragraphs.push(`${s.name} is building momentum with ${s.streak} wins in a row — a warrior to watch closely.`);
  }

  if (rivalryPair) {
    if (rivalryPair.count >= 5) paragraphs.push(`The bitter feud between ${rivalryPair.a} and ${rivalryPair.b} continues to captivate the arena! This marks their ${rivalryPair.count}th meeting — a rivalry for the ages.`);
    else paragraphs.push(`${rivalryPair.a} and ${rivalryPair.b} crossed blades for the ${rivalryPair.count}${rivalryPair.count === 3 ? "rd" : "th"} time. The crowd senses a budding rivalry.`);
  }

  for (const star of risingStars) paragraphs.push(`All eyes turn to ${star}, who has burst onto the scene with three consecutive victories to open their career. A rising star — or a flash in the pan? Only the arena will tell.`);

  for (const u of upsets) paragraphs.push(`In a stunning upset, ${u.winner} (fame: ${u.winnerFame}) defeated the celebrated ${u.loser} (fame: ${u.loserFame})! The crowd roared in disbelief as the underdog proved that fame means nothing once steel is drawn.`);

  if (graveyard.length > 0) {
    const recent = graveyard.filter(w => w.deathWeek === week);
    if (recent.length > 0) paragraphs.push(`The Hall of Warriors receives ${recent.length} new name${recent.length !== 1 ? "s" : ""} this week. Their sacrifice is not forgotten.`);
  }

  paragraphs.push(pick(rng, tone.closer));
  return paragraphs.join("\n\n");
}

export function generateWeeklyGazette(
  fights: FightSummary[],
  mood: CrowdMoodType,
  week: number,
  graveyard: Warrior[],
  allFights?: FightSummary[],
  seed?: number
): GazetteStory {
  const rng = new SeededRNG(seed ?? (week * 7919 + 55));
  const tone = MOOD_TONE[mood && MOOD_TONE[mood] ? mood : "Calm"];
  const kills = fights.filter(f => f.by === "Kill");
  const knockouts = fights.filter(f => f.by === "KO");
  const tags: string[] = [];

  if (kills.length >= 2) tags.push("Bloodbath");
  if (fights.some(f => f.flashyTags?.includes("Comeback"))) tags.push("Comeback");
  if (fights.some(f => f.flashyTags?.includes("Dominance"))) tags.push("Dominance");
  if (knockouts.length >= 3) tags.push("KO Fest");

  const hotStreakers = detectHotStreaks(fights, allFights);
  if (hotStreakers.length > 0) tags.push("Hot Streak");

  const rivalryPair = detectRivalryMatchup(fights, allFights ?? []);
  if (rivalryPair) tags.push("Rivalry");

  const risingStars = detectRisingStars(fights, allFights);
  if (risingStars.length > 0) tags.push("Rising Star");

  const upsets = detectUpsets(fights);
  if (upsets.length > 0) tags.push("Upset");

  const headline = generateHeadline(week, kills.length, knockouts.length, fights.length, hotStreakers, rivalryPair, risingStars, upsets, rng, tone.adjectives, kills);
  const body = generateBody(rng, tone, fights, kills.length, mood, hotStreakers, rivalryPair, risingStars, upsets, graveyard, week);

  return { headline, body, mood, tags, week };
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

  const headline = `${season} Season in Review: ${total} Bouts, ${kills} Deaths`;
  const body = [
    `The ${season} season concludes with ${total} bouts fought and a ${killRate}% fatality rate.`,
    topStyle ? `${styleName(topStyle[0])} dominated the meta with ${topStyle[1]} victories.` : "",
    kills >= 5 ? "It was a particularly deadly season — many promising careers cut short." : "",
    "The arena turns its gaze to the next season. What legends will emerge?",
  ].filter(Boolean).join("\n\n");

  return { headline, body, mood, tags: ["Season Review"], week: -1 };
}
