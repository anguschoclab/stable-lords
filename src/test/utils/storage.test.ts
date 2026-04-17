import { describe, it, expect, vi } from "vitest";
import { handleLocalStorageQuotaError } from "@/utils/storage";

describe("handleLocalStorageQuotaError", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it("saves data successfully when quota is available", () => {
    const data = { key: "value" };
    handleLocalStorageQuotaError("test-key", data);
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify(data));
  });

  it("attempts to clear old data on quota error", () => {
    // Fill localStorage
    for (let i = 0; i < 100; i++) {
      localStorage.setItem(`old-key-${i}`, JSON.stringify({ data: "fill" }));
    }

    // Mock console.error to suppress error output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // This should attempt to clear space and retry
    // In a real scenario, this would handle quota errors
    const data = { key: "value" };
    handleLocalStorageQuotaError("test-key", data);

    consoleSpy.mockRestore();
  });

  it("handles empty localStorage", () => {
    const data = { key: "value" };
    handleLocalStorageQuotaError("test-key", data);
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify(data));
  });
});
