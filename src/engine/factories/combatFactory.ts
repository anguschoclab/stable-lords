/**
 * Combat Factory - Creates fight summaries for testing
 * Extracted from factories.ts to follow SRP
 */
import type { FightSummary } from "@/types/state.types";
import { generateId } from "@/utils/idUtils";

/**
 * Creates a fight summary for testing purposes.
 */
export function makeFightSummary(overrides: Partial<FightSummary> = {}, createdAt: string = new Date().toISOString()): FightSummary {
  return {
    id: generateId(undefined, "fight"),
    week: 1,
    a: "Attacker",
    d: "Defender",
    warriorIdA: "warrior-a",
    warriorIdD: "warrior-d",
    styleA: "Brawler" as any,
    styleD: "Balanced" as any,
    winner: "A",
    by: "KO",
    title: "Practice Match",
    transcript: [],
    createdAt,
    ...overrides,
  };
}
