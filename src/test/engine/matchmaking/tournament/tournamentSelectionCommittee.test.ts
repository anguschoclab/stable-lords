import { describe, it, expect, beforeEach } from "vitest";
import { createFreshState } from "@/engine/factories";
import { populateTestState } from "@/test/testHelpers";
import { runRankingsPass } from "@/engine/pipeline/passes/RankingsPass";
import { committeeSelection, TOURNAMENT_TIERS } from "@/engine/matchmaking/tournament/tournamentSelectionCommittee";
import { resolveImpacts } from "@/engine/impacts";
import { GameState } from "@/types/state.types";
import { FightingStyle } from "@/types/shared.types";

describe("TournamentSelectionCommittee", () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState("test-seed");
    state = populateTestState(state);
    const rankingsImpact = runRankingsPass(state);
    state = resolveImpacts(state, [rankingsImpact]);
  });

  describe("committeeSelection", () => {
    it("should select 64 warriors for the Gold Tier", () => {
      const { warriors } = committeeSelection(state, "Gold", 1, new Set());
      expect(warriors.length).toBe(64);
    });

    it("should select 64 warriors for the Silver Tier", () => {
      const { warriors } = committeeSelection(state, "Silver", 2, new Set());
      expect(warriors.length).toBe(64);
    });

    it("should select 64 warriors for the Bronze Tier", () => {
      const { warriors } = committeeSelection(state, "Bronze", 3, new Set());
      expect(warriors.length).toBe(64);
    });

    it("should select 64 warriors for the Iron Tier", () => {
      const { warriors } = committeeSelection(state, "Iron", 4, new Set());
      expect(warriors.length).toBe(64);
    });

    it("should include the best ranked warrior", () => {
      const { warriors } = committeeSelection(state, "Gold", 1, new Set());
      const bestRankedId = Object.keys(state.realmRankings).find(id => state.realmRankings[id].overallRank === 1);
      expect(warriors.some(w => w.id === bestRankedId)).toBe(true);
    });

    it("should respect locked warrior IDs", () => {
      const { warriors: goldWarriors, updatedLockedIds: goldLocks } = committeeSelection(state, "Gold", 1, new Set());
      const goldIds = goldWarriors.map(w => w.id);
      
      const { warriors: silverWarriors } = committeeSelection(state, "Silver", 2, goldLocks);
      const overlapping = silverWarriors.filter(w => goldIds.includes(w.id));
      
      expect(overlapping.length).toBe(0);
    });

    it("should exclude warriors on rest", () => {
      state.restStates = [{ warriorId: state.roster[0].id, restUntilWeek: state.week + 1 }];
      const { warriors } = committeeSelection(state, "Gold", 1, new Set());
      expect(warriors.some(w => w.id === state.roster[0].id)).toBe(false);
    });

    it("should apply weather skepticism for rainy weather", () => {
      state.weather = "Rainy";
      const { warriors } = committeeSelection(state, "Gold", 1, new Set());
      const lungingWarriors = warriors.filter(w => w.style === FightingStyle.LungingAttack);
      // Should have fewer or no lunging attack warriors in rainy weather
      expect(lungingWarriors.length).toBeLessThanOrEqual(5);
    });

    it("should apply weather skepticism for scalding weather", () => {
      state.weather = "Sweltering";
      const { warriors } = committeeSelection(state, "Gold", 1, new Set());
      const lowCNWarriors = warriors.filter(w => (w.attributes.CN || 0) < 10);
      // Should have fewer or no low CN warriors in scalding weather
      expect(lowCNWarriors.length).toBeLessThanOrEqual(5);
    });

    it("should include style champions", () => {
      const { warriors } = committeeSelection(state, "Gold", 1, new Set());
      const styles = new Set(warriors.map(w => w.style));
      // Should have at least 6 different styles (all major styles)
      expect(styles.size).toBeGreaterThanOrEqual(6);
    });

    it("should generate emergency fillers if pool is insufficient", () => {
      // Create a state with very few warriors
      const smallState = createFreshState("small-seed");
      smallState.roster = smallState.roster.slice(0, 5);
      smallState.rivals = smallState.rivals.map(r => ({ ...r, roster: r.roster.slice(0, 2) }));
      
      const { warriors } = committeeSelection(smallState, "Gold", 1, new Set());
      expect(warriors.length).toBe(64);
    });

    it("should return updated locked IDs", () => {
      const { updatedLockedIds } = committeeSelection(state, "Gold", 1, new Set());
      expect(updatedLockedIds.size).toBe(64);
    });
  });

  describe("TOURNAMENT_TIERS", () => {
    it("should export 4 tournament tiers", () => {
      expect(TOURNAMENT_TIERS.length).toBe(4);
    });

    it("should have correct tier IDs", () => {
      const tierIds = TOURNAMENT_TIERS.map(t => t.id);
      expect(tierIds).toContain("Gold");
      expect(tierIds).toContain("Silver");
      expect(tierIds).toContain("Bronze");
      expect(tierIds).toContain("Iron");
    });

    it("should have correct rank ranges", () => {
      const gold = TOURNAMENT_TIERS.find(t => t.id === "Gold");
      expect(gold?.minRank).toBe(1);
      expect(gold?.maxRank).toBe(64);

      const silver = TOURNAMENT_TIERS.find(t => t.id === "Silver");
      expect(silver?.minRank).toBe(65);
      expect(silver?.maxRank).toBe(128);

      const bronze = TOURNAMENT_TIERS.find(t => t.id === "Bronze");
      expect(bronze?.minRank).toBe(129);
      expect(bronze?.maxRank).toBe(192);

      const iron = TOURNAMENT_TIERS.find(t => t.id === "Iron");
      expect(iron?.minRank).toBe(193);
      expect(iron?.maxRank).toBe(256);
    });
  });
});
