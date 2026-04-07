/**
 * Stable Lords — Tag/Badge Tooltip Descriptions
 * Describes the gameplay impact of flair, titles, injuries, and status tags.
 * Decoupled from hardcoded strings and migrated to narrativeContent.json.
 */
import narrativeContent from "@/data/narrativeContent.json";

export const FLAIR_DESCRIPTIONS: Record<string, string> = narrativeContent.meta.flair;
export const TITLE_DESCRIPTIONS: Record<string, string> = narrativeContent.meta.title;
export const INJURY_DESCRIPTIONS: Record<string, string> = narrativeContent.meta.injury;
export const STATUS_DESCRIPTIONS: Record<string, string> = (narrativeContent.meta as any).status;

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
