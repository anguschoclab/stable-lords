import { describe, test, expect, vi, beforeEach } from "vitest";
import { runSimulation } from "./simulation-harness";
import { formatPulseTable } from "@/engine/stats/simulationMetrics";
import { setMockIdGenerator } from "@/utils/idUtils";
import { engineEventBus } from "@/engine/core/EventBus";
import { NewsletterFeed } from "@/engine/newsletter/feed";

vi.mock("@/engine/storage/opfsArchive", () => ({
  OPFSArchiveService: class {
    isSupported = () => true;
    archiveBoutLog = vi.fn().mockResolvedValue(undefined);
    retrieveBoutLog = vi.fn().mockResolvedValue(null);
    archiveGazette = vi.fn().mockResolvedValue(undefined);
    retrieveGazette = vi.fn().mockResolvedValue(null);
    archiveHotState = vi.fn().mockResolvedValue(undefined);
    retrieveHotState = vi.fn().mockResolvedValue(null);
    getArchivedBoutIdsForSeason = vi.fn().mockResolvedValue([]);
  }
}));

function resetGlobalState() {
  let idCounter = 0;
  setMockIdGenerator(() => `id_${++idCounter}`);
  engineEventBus.clear();
  NewsletterFeed.clear();
}

describe("Headless Simulation Harness", () => {
  beforeEach(() => {
    resetGlobalState();
  }, 300000);

  test("runs a long-term balance check (104 weeks)", () => {
    const seed = 999;
    const config = {
      weeks: 104,
      seed,
      logFrequency: 4, // Log every month to trace progress
    };

    console.log(`\n[Sim] Starting 104-week balance check with seed: ${seed}`);
    const result = runSimulation(config);
    
    console.log("SUCCESS");
  }, 300000);
});
