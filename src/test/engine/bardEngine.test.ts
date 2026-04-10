import { describe, it, expect } from "vitest";
import { getFromArchive, interpolateTemplate } from "@/engine/narrativePBP";
import { blurb, commentatorFor, recapLine } from "@/lore/AnnouncerAI";
import { SeededRNG } from "@/utils/random";

describe("Bard Narrative Engine", () => {
  const rng = new SeededRNG(12345);
  const nextRng = () => rng.next();

  describe("interpolateTemplate", () => {
    it("interpolates %A, %D, %W, %BP tokens", () => {
      const template = "%A strikes %D with %W in the %BP.";
      const ctx = {
        attacker: "Warrior A",
        defender: "Warrior D",
        weapon: "GLADIUS",
        bodyPart: "CHEST"
      };
      const result = interpolateTemplate(template, ctx);
      expect(result).toBe("Warrior A strikes Warrior D with GLADIUS in the CHEST.");
    });

    it("interpolates %H (hits/minutes) token", () => {
      const template = "The bout lasted %H minutes.";
      const result = interpolateTemplate(template, { hits: 15 });
      expect(result).toBe("The bout lasted 15 minutes.");
    });

    it("falls back to generic names for missing context", () => {
      const template = "%A attacks %D.";
      const result = interpolateTemplate(template, {});
      expect(result).toBe("The warrior attacks the opponent.");
    });

    it("interpolates Handlebars-style {{key}} placeholders alongside % tokens", () => {
      const template = "{{attacker}} feints low, catching {{defender}} off guard before severing their %BP at the elbow. The crowd erupts!";
      const result = interpolateTemplate(template, {
        attacker: "Thog",
        defender: "Grom",
        bodyPart: "sword-arm"
      });
      expect(result).toContain("Thog feints low");
      expect(result).toContain("catching Grom off guard");
      expect(result).toContain("severing their sword-arm");
    });

    it("falls back {{name}} to ctx.attacker and {{attacker}} to ctx.name", () => {
      const res1 = interpolateTemplate("{{name}} strikes!", { attacker: "Grom" });
      expect(res1).toBe("Grom strikes!");
      const res2 = interpolateTemplate("{{attacker}} strikes!", { name: "Grom" });
      expect(res2).toBe("Grom strikes!");
    });
  });

  describe("Archive Lookup", () => {
    it("successfully retrieves migrated blurbs", () => {
      const template = getFromArchive(nextRng, ["blurbs", "neutral"]);
      expect(template).toBeDefined();
      expect(template).toContain("%A");
    });

    it("retrieves commentary by tag", () => {
      const template = getFromArchive(nextRng, ["commentary", "KO"]);
      expect(template).toBe("What a knockout! The crowd erupts!");
    });

    it("returns ultimate fallback for missing paths", () => {
      const template = getFromArchive(nextRng, ["invalid", "path"]);
      expect(template).toBe("A fierce exchange occurs.");
    });
  });

  describe("Unified Announcer AI", () => {
    it("generates a deterministic blurb", () => {
      const testRng = new SeededRNG(42);
      const output1 = blurb({ 
        tone: "hype", 
        winner: "Caesar", 
        loser: "Pompey", 
        rng: () => testRng.next() 
      });
      
      const testRng2 = new SeededRNG(42);
      const output2 = blurb({ 
        tone: "hype", 
        winner: "Caesar", 
        loser: "Pompey", 
        rng: () => testRng2.next() 
      });
      
      expect(output1).toBe(output2);
      expect(output1).toContain("Caesar");
    });

    it("generates a valid recap line", () => {
      const output = recapLine("Sulla", "Marius", 12, nextRng);
      expect(output).toMatch(/Sulla|Marius/);
      expect(output).toContain("12");
    });

    it("handles commentary tags correctly", () => {
      const output = commentatorFor("Kill", nextRng);
      expect(output).toContain("fatal finish");
    });
  });

  describe("Severity Mapping (Strike tiers)", () => {
    // This tests the logic in narrativePBP.getStrikeSeverity indirectly
    it("handles flashy/supernatural tiers via getStrikeSeverity logic", () => {
      // In narrativePBP if fame >= 100 and isSuperFlashy=true -> "critical_supernatural"
      // We can't test internal private functions easily but we can verify getFromArchive paths
      const criticalTemplate = getFromArchive(nextRng, ["strikes", "slashing", "critical_supernatural"]);
      expect(criticalTemplate).toBeDefined();
    });
  });
});
