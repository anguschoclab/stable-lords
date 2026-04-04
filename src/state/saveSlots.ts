/**
 * Stable Lords — Multi-Slot Save/Load System
 * Manages up to 5 save slots in localStorage.
 */
import type { GameState } from "@/types/game";
import { z } from "zod";
import { migrateGameState, sanitizeReviver } from "./migrations";
import { OPFSArchiveService } from "@/engine/storage/opfsArchive";

const archiveService = new OPFSArchiveService();

const SLOTS_INDEX_KEY = "stablelords.slots";
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
    if (raw) return JSON.parse(raw, sanitizeReviver) as SaveSlotMeta[];
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
  archiveService.archiveHotState(slotId, state).catch(console.error);
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
export async function loadFromSlot(slotId: string): Promise<GameState | null> {
  try {
    const parsed = await archiveService.retrieveHotState(slotId);
    if (parsed && parsed.meta) {
      return migrateGameState(parsed);
    }
  } catch (err) {
    console.error("Error loading slot", err);
  }
  return null;
}

/** Delete a save slot */
export function deleteSlot(slotId: string): void {
  // replaced with archiveService
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
  return `slot_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0]}`;
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
    const parsed = JSON.parse(raw, sanitizeReviver);
    if (!parsed?.meta) return;

    const slotId = "slot_legacy";


    // Migration fields
    if (parsed.ftueComplete === undefined) parsed.ftueComplete = true;
    if (!parsed.coachDismissed) parsed.coachDismissed = [];

    archiveService.archiveHotState(slotId, parsed).catch(console.error);
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
export async function exportSlot(slotId: string): Promise<void> {
  const state = await loadFromSlot(slotId);
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
  if (slotId) exportSlot(slotId).catch(console.error);
}

const BaseSaveSchema = z.object({
  meta: z.object({
    gameName: z.string().optional(),
    version: z.string(),
  }).passthrough(),
  player: z.object({
    stableName: z.string(),
  }).passthrough(),
}).passthrough();

const ExportedSaveSchema = z.object({
  _format: z.literal("stablelords-save-v1"),
  state: BaseSaveSchema,
}).passthrough();

const AnySaveSchema = z.union([
  ExportedSaveSchema,
  BaseSaveSchema,
]);

/**
 * Validate and parse an imported JSON file.
 * Returns the GameState or throws with a user-friendly message.
 */
export function parseImportedSave(json: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json, sanitizeReviver);
  } catch {
    throw new Error("Invalid file — could not parse JSON.");
  }

  let validated;
  try {
    validated = AnySaveSchema.parse(parsed);
  } catch (err) {
    console.error("Save validation failed:", err);
    throw new Error("Save file is missing required fields (player/meta).");
  }

  // Support both wrapped format and raw GameState
  let state: Record<string, unknown>;
  if ("_format" in validated && validated._format === "stablelords-save-v1") {
    state = validated.state as Record<string, unknown>;
  } else {
    state = validated as Record<string, unknown>;
  }

  // Apply migrations
  return migrateGameState(state);
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

// ─── Owner Persistence Helpers ────────────────────────────────────────────
// (Migrated from src/state/saveOwners.ts)

import type { OwnerPersonality } from "@/types/game";

export type OwnerPersist = {
  id: string;
  name: string;
  stableName: string;
  fame: number;
  renown: number;
  titles: number;
  personality?: OwnerPersonality;
};

const OWNERS_KEY = "sl.owners.v1";

export function loadOwners(): OwnerPersist[] {
  try {
    const raw = localStorage.getItem(OWNERS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw, sanitizeReviver);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveOwners(list: OwnerPersist[]) {
  try {
    localStorage.setItem(OWNERS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function upsertOwner(owner: OwnerPersist) {
  const list = loadOwners();
  const idx = list.findIndex((o) => o.id === owner.id);
  if (idx >= 0) list[idx] = owner;
  else list.push(owner);
  saveOwners(list);
}

export function bumpOwnerFame(id: string, amt: number) {
  const list = loadOwners();
  const o = list.find((x) => x.id === id);
  if (o) {
    o.fame = Math.max(0, (o.fame || 0) + amt);
    saveOwners(list);
  }
}

export function bumpOwnerRenown(id: string, amt: number) {
  const list = loadOwners();
  const o = list.find((x) => x.id === id);
  if (o) {
    o.renown = Math.max(0, (o.renown || 0) + amt);
    saveOwners(list);
  }
}

export function addOwnerTitle(id: string) {
  const list = loadOwners();
  const o = list.find((x) => x.id === id);
  if (o) {
    o.titles = (o.titles || 0) + 1;
    saveOwners(list);
  }
}
