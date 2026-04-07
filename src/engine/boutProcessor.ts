import type { Warrior, InjuryData, InjurySeverity } from "@/types/warrior.types";
import type { GameState } from "@/types/state.types";

export { generatePairings, type BoutPairing } from "./bout/core/pairings";
export {
  resolveBout,
  processWeekBouts,
  type BoutResult,
  type BoutImpact,
  type WeekBoutSummary,
  type BoutContext
} from "./bout/services/boutProcessorService";
