/**
 * Stable Lords — Tag/Badge Tooltip Descriptions
 * Describes the gameplay impact of flair, titles, injuries, and status tags.
 */

export const FLAIR_DESCRIPTIONS: Record<string, string> = {
  Flashy: "Crowd favorite — earns +2 Popularity per flashy fight. Theatrical crowd moods amplify this further.",
  Comeback: "Survived near-death to win — earns +1 Fame and +1 Popularity when triggered.",
  RiposteChain: "Master counter-fighter — earned by landing 3+ ripostes in a single bout. +1 Fame.",
  Dominance: "Overwhelming victor — earned by landing 5+ hits in a winning bout. +1 Fame.",
};

export const TITLE_DESCRIPTIONS: Record<string, string> = {
  "Tournament Champion": "Won a seasonal tournament. A mark of elite combat prowess.",
  Champion: "Reigning arena champion — commands respect and higher Fame gains.",
};

export const INJURY_DESCRIPTIONS: Record<string, string> = {
  "Broken Arm": "Reduces Attack and Parry effectiveness until healed.",
  "Cracked Ribs": "Lowers Endurance and increases vulnerability to body shots.",
  "Concussion": "Reduces Initiative and Wit-based skills temporarily.",
  "Torn Muscle": "Strength penalty — lower damage output until recovered.",
  "Sprained Ankle": "Speed and Defense are penalized until healed.",
  "Deep Laceration": "Ongoing HP loss risk in future bouts until healed.",
  "Fractured Skull": "Severe — major penalties to all skills. May end a career.",
  "Dislocated Shoulder": "Reduces Attack and weapon handling until healed.",
};

export const STATUS_DESCRIPTIONS: Record<string, string> = {
  Active: "Ready for combat — can be assigned to bouts and tournaments.",
  Dead: "Fallen in the arena. Their legacy lives on in the Graveyard.",
  Retired: "Honorably withdrawn from combat. May become a trainer.",
};

/**
 * Get a tooltip description for any warrior tag.
 * Falls back to a generic message if the tag isn't specifically documented.
 */
export function getTagDescription(tag: string): string {
  return (
    FLAIR_DESCRIPTIONS[tag] ??
    TITLE_DESCRIPTIONS[tag] ??
    INJURY_DESCRIPTIONS[tag] ??
    STATUS_DESCRIPTIONS[tag] ??
    `${tag} — a notable trait earned through arena combat.`
  );
}
