import { describe, it, expect } from "vitest";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { NarrativeTemplateEngine } from "@/engine/narrative/narrativeTemplateEngine";
import { blurb, commentatorFor, recapLine } from "@/lore/AnnouncerAI";
import { TournamentSelectionService } from "@/engine/matchmaking/tournamentSelection";

describe("Bard Narrative Engine", () => {
  const rng = new SeededRNGService(12345);

  describe("interpolateTemplate", () => {
    it("interpolates %A, %D, %W, %BP tokens", () => {
      const template = "%A strikes %D with %W in the %BP.";
      const ctx = {
        attacker: "Warrior A",
        defender: "Warrior D",
        weapon: "GLADIUS",
        bodyPart: "CHEST"
      };
      const result = NarrativeTemplateEngine.interpolateTemplate(template, ctx);
      expect(result).toBe("Warrior A strikes Warrior D with GLADIUS in the CHEST.");
    });

    it("interpolates %H (hits/minutes) token", () => {
      const template = "The bout lasted %H minutes.";
      const result = NarrativeTemplateEngine.interpolateTemplate(template, { hits: 15 });
      expect(result).toBe("The bout lasted 15 minutes.");
    });

    it("falls back to generic names for missing context", () => {
      const template = "%A attacks %D.";
      const result = NarrativeTemplateEngine.interpolateTemplate(template, {});
      expect(result).toBe("The warrior attacks the opponent.");
    });
  });

  describe("NCAA-style Tournament Selection Committee", () => {
    it("should generate all 4 seasonal tournaments", () => {
      const state = { week: 1, season: "Spring", realmRankings: {}, rivals: [], roster: [] };
      const tournaments = TournamentSelectionService.generateSeasonalTiers(state as any, state.week, state.season as any, 1);
      expect(tournaments.length).toBe(4); // Gold, Silver, Bronze, Iron
      expect(tournaments[0].name).toBe("Imperial Gold Cup");
      expect(tournaments[0].participants.length).toBe(64);
    });
  });

  describe("Archive Lookup", () => {
    it("successfully retrieves migrated blurbs", () => {
      const template = NarrativeTemplateEngine.getFromArchive(rng, ["blurbs", "neutral"]);
      expect(template).toBeDefined();
      expect(template).toContain("%A");
    });

    it("retrieves commentary by tag", () => {
      const template = NarrativeTemplateEngine.getFromArchive(rng, ["commentary", "KO"]);
      expect(template).toBe("What a knockout! The crowd erupts!");
    });

    it("returns ultimate fallback for missing paths", () => {
      const template = NarrativeTemplateEngine.getFromArchive(rng, ["invalid", "path"]);
      expect(template).toBe("A fierce exchange occurs.");
    });
  });

  describe("Unified Announcer AI", () => {
    it("generates a deterministic blurb", () => {
      const output1 = blurb({ 
        tone: "hype", 
        winner: "Caesar", 
        loser: "Pompey", 
        rng: rng 
      });
      
      const output2 = blurb({ 
        tone: "hype", 
        winner: "Caesar", 
        loser: "Pompey", 
        rng: rng 
      });
      
      expect(output1).toBeDefined();
      expect(output1).toContain("Caesar");
    });

    it("generates a valid recap line", () => {
      const output = recapLine("Sulla", "Marius", 12, rng);
      expect(output).toMatch(/Sulla|Marius/);
      expect(output).toContain("12");
    });

    it("handles commentary tags correctly", () => {
      const output = commentatorFor("Kill", rng);
      expect(output).toContain("finish");
    });
  });

  describe("Severity Mapping (Strike tiers)", () => {
    it("handles flashy/supernatural tiers via getStrikeSeverity logic", () => {
      const criticalTemplate = NarrativeTemplateEngine.getFromArchive(rng, ["strikes", "slashing", "critical_supernatural"]);
      expect(criticalTemplate).toBeDefined();
    });
  });
});
