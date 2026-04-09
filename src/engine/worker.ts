import * as Comlink from "comlink";
import { advanceWeek } from "./pipeline/services/weekPipelineService";
import { advanceDay } from "./dayPipeline";
import { PatronTokenService } from "./tokens/patronTokenService";
import { 
  createFreshState
} from "./factories";
import {
  updateWarriorEquipment
} from "@/state/mutations/rosterMutations";
import {
  initializeStable,
  draftInitialRoster,
  appendFightToHistory,
  updateWarriorAfterFight
} from "@/state/mutations/worldMutations";

import { TournamentSelectionService } from "./matchmaking/tournamentSelection";

/**
 * Stable Lords — Engine Worker
 * Offloads heavy simulation and logic processing to a background thread.
 */
const engine = {
  advanceWeek,
  advanceDay,
  assignToken: PatronTokenService.assignToken,
  resolveTournamentRound: TournamentSelectionService.resolveRound.bind(TournamentSelectionService),
  createFreshState,
  initializeStable,
  draftInitialRoster,
  updateWarriorAfterFight,
  appendFightToHistory,
  updateWarriorEquipment
};

export type EngineWorker = typeof engine;

Comlink.expose(engine);
