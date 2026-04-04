import { describe, it, expect, vi } from "vitest";
import { parseImportedSave, newSlotId } from "../../state/saveSlots";

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
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const json = JSON.stringify({
        meta: { gameName: "Stable Lords", version: "1.0" },
      });
      expect(() => parseImportedSave(json)).toThrow("Save file is missing required fields (player/meta).");
      errorSpy.mockRestore();
    });
  });

  describe("newSlotId", () => {
    it("should generate a unique slot ID securely", () => {
      const id1 = newSlotId();
      const id2 = newSlotId();
      expect(id1).toMatch(/^slot_\d+_\d+$/);
      expect(id2).toMatch(/^slot_\d+_\d+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
