/**
 * Stable Lords — Multi-Slot Save/Load System
 * Manages up to 5 save slots in localStorage.
 */
import type { GameState } from "@/types/game";

const SLOTS_INDEX_KEY = "stablelords.slots";
const SLOT_PREFIX = "stablelords.slot.";
const ACTIVE_SLOT_KEY = "stablelords.activeSlot";
export const MAX_SAVE_SLOTS = 5;

export interface SaveSlotMeta {
  slotId: string;
  stableName: string;
  ownerName: string;
  week: number;
  season: string;
  rosterSize: number;
  fame: number;
  ftueComplete: boolean;
  savedAt: string;
  createdAt: string;
}

/** Get all save slot metadata */
export function listSaveSlots(): SaveSlotMeta[] {
  try {
    const raw = localStorage.getItem(SLOTS_INDEX_KEY);
    if (raw) return JSON.parse(raw) as SaveSlotMeta[];
  } catch { /* corrupt */ }
  return [];
}

function persistSlotIndex(slots: SaveSlotMeta[]) {
  localStorage.setItem(SLOTS_INDEX_KEY, JSON.stringify(slots));
}

/** Extract metadata from a game state for the slot index */
function metaFromState(slotId: string, state: GameState, existingCreatedAt?: string): SaveSlotMeta {
  return {
    slotId,
    stableName: state.player.stableName,
    ownerName: state.player.name,
    week: state.week,
    season: state.season,
    rosterSize: state.roster.length,
    fame: state.fame,
    ftueComplete: state.ftueComplete,
    savedAt: new Date().toISOString(),
    createdAt: existingCreatedAt ?? state.meta.createdAt,
  };
}

/** Save game state to a specific slot */
export function saveToSlot(slotId: string, state: GameState): void {
  localStorage.setItem(`${SLOT_PREFIX}${slotId}`, JSON.stringify(state));
  const slots = listSaveSlots();
  const existingIdx = slots.findIndex((s) => s.slotId === slotId);
  const existing = existingIdx >= 0 ? slots[existingIdx] : undefined;
  const meta = metaFromState(slotId, state, existing?.createdAt);
  if (existingIdx >= 0) {
    slots[existingIdx] = meta;
  } else {
    slots.push(meta);
  }
  persistSlotIndex(slots);
  setActiveSlot(slotId);
}

/** Load game state from a specific slot */
export function loadFromSlot(slotId: string): GameState | null {
  try {
    const raw = localStorage.getItem(`${SLOT_PREFIX}${slotId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.meta) {
        // Migration
        if (!parsed.graveyard) parsed.graveyard = [];
        if (!parsed.retired) parsed.retired = [];
        if (!parsed.crowdMood) parsed.crowdMood = "Calm";
        if (!parsed.tournaments) parsed.tournaments = [];
        if (!parsed.trainers) parsed.trainers = [];
        if (!parsed.hiringPool) parsed.hiringPool = [];
        if (parsed.ftueComplete === undefined) parsed.ftueComplete = true;
        if (!parsed.coachDismissed) parsed.coachDismissed = [];
        if (!parsed.rivals) parsed.rivals = [];
        if (!parsed.scoutReports) parsed.scoutReports = [];
        if (!parsed.trainingAssignments) parsed.trainingAssignments = [];
        if (!parsed.restStates) parsed.restStates = [];
        if (!parsed.rivalries) parsed.rivalries = [];
        if (!parsed.matchHistory) parsed.matchHistory = [];
        if (!parsed.recruitPool) parsed.recruitPool = [];
        if (parsed.gold === undefined) parsed.gold = 500;
        if (!parsed.ledger) parsed.ledger = [];
        if (!parsed.settings) parsed.settings = { featureFlags: { tournaments: true, scouting: true } };
        if (parsed.settings && !parsed.settings.featureFlags?.scouting) {
          parsed.settings.featureFlags = { ...parsed.settings.featureFlags, scouting: true };
        }
        if (!parsed.seasonalGrowth) parsed.seasonalGrowth = [];
        // Migrate old training assignments (add type field)
        if (parsed.trainingAssignments) {
          parsed.trainingAssignments = parsed.trainingAssignments.map((a: any) => ({
            ...a,
            type: a.type ?? "attribute",
          }));
        }
        parsed.roster = (parsed.roster || []).map((w: any) => ({ ...w, status: w.status || "Active" }));
        return parsed as GameState;
      }
    }
  } catch { /* corrupt */ }
  return null;
}

/** Delete a save slot */
export function deleteSlot(slotId: string): void {
  localStorage.removeItem(`${SLOT_PREFIX}${slotId}`);
  const slots = listSaveSlots().filter((s) => s.slotId !== slotId);
  persistSlotIndex(slots);
  // Clear active if it was this slot
  if (getActiveSlot() === slotId) {
    localStorage.removeItem(ACTIVE_SLOT_KEY);
  }
}

/** Get/set which slot is currently active */
export function getActiveSlot(): string | null {
  return localStorage.getItem(ACTIVE_SLOT_KEY);
}

export function setActiveSlot(slotId: string): void {
  localStorage.setItem(ACTIVE_SLOT_KEY, slotId);
}

/** Generate a unique slot ID */
export function newSlotId(): string {
  return `slot_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
}

/**
 * Migrate legacy single-save to slot system.
 * If old save exists and no slots exist, move it to slot 1.
 */
export function migrateLegacySave(): void {
  const LEGACY_KEY = "stablelords.save.v2";
  const slots = listSaveSlots();
  if (slots.length > 0) return; // already migrated

  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed?.meta) return;

    const slotId = "slot_legacy";
    localStorage.setItem(`${SLOT_PREFIX}${slotId}`, raw);

    // Migration fields
    if (parsed.ftueComplete === undefined) parsed.ftueComplete = true;
    if (!parsed.coachDismissed) parsed.coachDismissed = [];

    const meta = metaFromState(slotId, parsed as GameState);
    persistSlotIndex([meta]);
    setActiveSlot(slotId);

    // Clean up legacy key
    localStorage.removeItem(LEGACY_KEY);
  } catch { /* ignore */ }
}

// ─── Export / Import ────────────────────────────────────────────────────────

export interface ExportedSave {
  _format: "stablelords-save-v1";
  exportedAt: string;
  state: GameState;
}

/** Export a slot's game state as a downloadable JSON file */
export function exportSlot(slotId: string): void {
  const state = loadFromSlot(slotId);
  if (!state) return;
  const payload: ExportedSave = {
    _format: "stablelords-save-v1",
    exportedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.player.stableName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Wk${state.week}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Export current active slot */
export function exportActiveSlot(): void {
  const slotId = getActiveSlot();
  if (slotId) exportSlot(slotId);
}

/**
 * Validate and parse an imported JSON file.
 * Returns the GameState or throws with a user-friendly message.
 */
export function parseImportedSave(json: string): GameState {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid file — could not parse JSON.");
  }

  // Support both wrapped format and raw GameState
  let state: any;
  if (parsed?._format === "stablelords-save-v1" && parsed.state) {
    state = parsed.state;
  } else if (parsed?.meta?.gameName) {
    state = parsed;
  } else {
    throw new Error("Unrecognized save format. Expected a Stable Lords save file.");
  }

  // Basic validation
  if (!state.player?.stableName || !state.meta?.version) {
    throw new Error("Save file is missing required fields (player/meta).");
  }

  // Apply migrations
  if (!state.graveyard) state.graveyard = [];
  if (!state.retired) state.retired = [];
  if (!state.crowdMood) state.crowdMood = "Calm";
  if (!state.tournaments) state.tournaments = [];
  if (!state.trainers) state.trainers = [];
  if (!state.hiringPool) state.hiringPool = [];
  if (state.ftueComplete === undefined) state.ftueComplete = true;
  if (!state.coachDismissed) state.coachDismissed = [];
  if (!state.rivals) state.rivals = [];
  if (!state.scoutReports) state.scoutReports = [];
  if (!state.trainingAssignments) state.trainingAssignments = [];
  if (state.gold === undefined) state.gold = 500;
  if (!state.ledger) state.ledger = [];
  if (!state.restStates) state.restStates = [];
  if (!state.rivalries) state.rivalries = [];
  if (!state.matchHistory) state.matchHistory = [];
  if (!state.recruitPool) state.recruitPool = [];
  if (!state.settings) state.settings = { featureFlags: { tournaments: true, scouting: true } };
  if (state.settings && !state.settings.featureFlags?.scouting) {
    state.settings.featureFlags = { ...state.settings.featureFlags, scouting: true };
  }
  state.roster = (state.roster || []).map((w: any) => ({ ...w, status: w.status || "Active" }));

  return state as GameState;
}

/**
 * Import a save file, creating a new slot for it.
 * Returns the new slotId or throws on error.
 */
export function importSaveToNewSlot(json: string): string {
  const slots = listSaveSlots();
  if (slots.length >= MAX_SAVE_SLOTS) {
    throw new Error(`Maximum ${MAX_SAVE_SLOTS} save slots reached. Delete one first.`);
  }
  const state = parseImportedSave(json);
  const slotId = newSlotId();
  saveToSlot(slotId, state);
  return slotId;
}
