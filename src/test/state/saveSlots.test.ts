import { describe, it, expect } from "vitest";
import { parseImportedSave } from "../../state/saveSlots";

describe("saveSlots", () => {
  describe("parseImportedSave", () => {
    it("should parse a valid legacy save object", () => {
      const json = JSON.stringify({
        meta: { gameName: "Stable Lords", version: "1.0" },
        player: { stableName: "Test Stable" },
      });
      const parsed = parseImportedSave(json);
      expect(parsed.player.stableName).toBe("Test Stable");
    });

    it("should parse a valid wrapped exported save object", () => {
      const json = JSON.stringify({
        _format: "stablelords-save-v1",
        state: {
          meta: { gameName: "Stable Lords", version: "1.0" },
          player: { stableName: "Test Stable" },
        }
      });
      const parsed = parseImportedSave(json);
      expect(parsed.player.stableName).toBe("Test Stable");
    });

    it("should throw if invalid JSON", () => {
      expect(() => parseImportedSave("invalid json")).toThrow("Invalid file \u2014 could not parse JSON.");
    });

    it("should throw if missing required fields", () => {
      const json = JSON.stringify({
        meta: { gameName: "Stable Lords", version: "1.0" },
      });
      expect(() => parseImportedSave(json)).toThrow("Save file is missing required fields (player/meta).");
    });
  });
});
