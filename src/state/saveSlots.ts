import type { GameState } from "@/types/state.types";
import { opfsArchive } from "@/engine/storage/opfsArchive";
import { truncateState } from "@/engine/storage/truncation";

export interface SaveSlotMeta {
  id: string;
  name: string;
  week: number;
  year: number;
  timestamp: string;
  version: string;
}

const STORAGE_KEY = "stable-lords-save-slots";
export const MAX_SAVE_SLOTS = 10;

function getStoredMeta(): SaveSlotMeta[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse save slot metadata", e);
    return [];
  }
}

function setStoredMeta(meta: SaveSlotMeta[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch (error) {
    if ((error as Error)?.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded when saving save slot metadata', error);
      // Attempt to clear old save slots to free up space
      try {
        const existing = getStoredMeta();
        if (existing.length > 0) {
          // Keep only the most recent save slot
          const mostRecent = existing.slice(-1);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mostRecent));
        }
      } catch (retryError) {
        console.error('Failed to recover from localStorage quota error', retryError);
      }
    } else {
      console.error('Failed to save save slot metadata', error);
    }
  }
}

export function listSaveSlots(): SaveSlotMeta[] {
  return getStoredMeta();
}

export async function saveToSlot(slotId: string, name: string, state: GameState) {
  const meta: SaveSlotMeta = {
    id: slotId,
    name,
    week: state.week,
    year: state.year,
    timestamp: new Date().toISOString(),
    version: state.meta.version
  };

  const currentMeta = getStoredMeta();
  const index = currentMeta.findIndex(m => m.id === slotId);

  if (index !== -1) {
    currentMeta[index] = meta;
  } else {
    currentMeta.push(meta);
  }

  setStoredMeta(currentMeta);

  // Truncate state to keep save file size manageable
  const truncatedState = truncateState(state);
  await opfsArchive.archiveHotState(slotId, truncatedState);
}

export async function loadFromSlot(slotId: string): Promise<GameState | null> {
  return await opfsArchive.retrieveHotState(slotId);
}

export async function deleteSlot(slotId: string) {
  const currentMeta = getStoredMeta();
  const filtered = currentMeta.filter(m => m.id !== slotId);
  setStoredMeta(filtered);
  // Note: OPFS deletion is implicit if we just don't load it, 
  // but a real implementation might want to unlink the file.
  // For now, removing meta is enough to "delete" it from UI.
}

export function newSlotId(): string {
  return `slot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function exportSlot(slotId: string): Promise<string | null> {
  const state = await loadFromSlot(slotId);
  if (!state) return null;
  return JSON.stringify(state);
}

export async function importSaveToNewSlot(data: any): Promise<string | null> {
  try {
    const state = typeof data === 'string' ? JSON.parse(data) : data;
    if (!state.meta || !state.week) throw new Error("Invalid save data");
    
    const slotId = newSlotId();
    await saveToSlot(slotId, `Imported: ${state.player.stableName}`, state);
    return slotId;
  } catch (e) {
    console.error("Import failed", e);
    return null;
  }
}
