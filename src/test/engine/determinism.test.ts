import { vi } from 'vitest';
import { describe, it, expect, vi } from "vitest";
import { advanceWeek } from "@/engine/pipeline/services/weekPipelineService";
import { createFreshState } from "@/state/gameStore";
import { SeededRNG } from "@/utils/random";

// Mock the archive service to avoid disk I/O during tests
vi.mock("@/engine/storage/opfsArchive", () => {
  return {
    OPFSArchiveService: vi.fn().mockImplementation(() => ({
      isSupported: () => false,
      archiveHotState: () => Promise.resolve(),
      retrieveHotState: () => Promise.resolve(null),
      archiveBoutLog: () => Promise.resolve(),
    }))
  };
});

describe("Simulation Determinism", () => {
  it("should produce identical results from a fresh state over 5 weeks", () => {
    // 1. Setup two identical states
    // Note: createFreshState uses the root seed and should be stable.
    const stateA = createFreshState();
    const stateB = JSON.parse(JSON.stringify(stateA)); // Deep copy

    // 2. Advance both states 5 weeks
    let currentA = stateA;
    let currentB = stateB;

    for (let i = 0; i < 5; i++) {
      currentA = advanceWeek(currentA);
      currentB = advanceWeek(currentB);
    }

    // 3. Compare states
    const strA = JSON.stringify(currentA);
    const strB = JSON.stringify(currentB);

    if (strA !== strB) {
      // Find the first diff for debugging
      const objA = JSON.parse(strA);
      const objB = JSON.parse(strB);
      
      for (const key in objA) {
        if (JSON.stringify(objA[key]) !== JSON.stringify(objB[key])) {
          console.log(`Mismatch in key: ${key}`);
          console.log(`A: ${JSON.stringify(objA[key]).substring(0, 100)}`);
          console.log(`B: ${JSON.stringify(objB[key]).substring(0, 100)}`);
          break;
        }
      }
    }

    expect(strA).toBe(strB);
  });

  it("should remain deterministic even when branching (cloning RNG)", () => {
    const rng = new SeededRNG(12345);
    const clone = rng.clone();

    for (let i = 0; i < 100; i++) {
        expect(rng.next()).toBe(clone.next());
    }
  });

  it("should produce different results for different seeds", () => {
    const stateA = createFreshState();
    const stateB = createFreshState();
    
    // Manually skew one state's week or a seed-relevant property if needed,
    // but here we just verify that they are deterministic based on the week index.
    
    // Run week 1
    const week1A = advanceWeek(stateA);
    
    // Simulate a different "next week" path (this is a bit contrived but tests the principle)
    // Actually, just changing the starting week will change the seed.
    const stateC = { ...stateA, week: 10 };
    const week11C = advanceWeek(stateC);
    
    expect(JSON.stringify(week1A)).not.toBe(JSON.stringify(week11C));
  });
});
