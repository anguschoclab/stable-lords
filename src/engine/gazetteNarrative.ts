/**
 * Gazette Narrative Module - Re-exports from split gazette modules
 * This file maintains backward compatibility while following SRP
 */

// Re-export from split modules
export { styleName, t, MOOD_TONE } from "./gazette/gazetteTemplateHelpers";
export {
  computeStreaks,
  detectRivalryMatchup,
  detectGazetteTags,
  detectHotStreakers,
  detectRisingStars,
  detectUpsets,
  type GazetteDetections
} from "./gazette/gazetteDetections";
export {
  generateFightNarrative,
  generateGazetteHeadline,
  generateGazetteBody,
  generateSeasonSummary
} from "./gazette/gazetteNarrative";
export { generateWeeklyGazette } from "./gazette/gazetteFactory";
