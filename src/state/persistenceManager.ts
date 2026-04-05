import { GameState } from "@/types/game";
import { saveToSlot } from "./saveSlots";

/**
 * PersistenceManager
 * Handles debounced, background saving of game state to prevent UI stutter.
 */
class PersistenceManager {
  private debounceTimer: number | null = null;
  private pendingState: GameState | null = null;
  private pendingSlotId: string | null = null;
  private isSaving = false;
  private lastSaveTime = 0;
  private readonly DEBOUNCE_MS = 2000; // 2 seconds
  private readonly MIN_SAVE_INTERVAL = 5000; // 5 seconds between disk writes

  /**
   * Schedule a save operation.
   * If a save is already in progress, it will queue the latest state.
   */
  public scheduleSave(slotId: string, state: GameState) {
    this.pendingState = state;
    this.pendingSlotId = slotId;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.executeSave();
    }, this.DEBOUNCE_MS);
  }

  /**
   * Immediate save (e.g. before closing or after major milestone)
   */
  public async saveNow(slotId: string, state: GameState) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingState = state;
    this.pendingSlotId = slotId;
    await this.executeSave();
  }

  private async executeSave() {
    if (this.isSaving || !this.pendingState || !this.pendingSlotId) {
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - this.lastSaveTime < this.MIN_SAVE_INTERVAL && !this.isForcedValue()) {
       // Wait a bit longer if we just saved
       this.debounceTimer = window.setTimeout(() => this.executeSave(), this.MIN_SAVE_INTERVAL - (now - this.lastSaveTime));
       return;
    }

    this.isSaving = true;
    const stateToSave = this.pendingState;
    const slotId = this.pendingSlotId;
    
    // Clear pending before starting to avoid overwriting newer state if save takes long
    this.pendingState = null;
    this.pendingSlotId = null;

    try {
      // Use requestIdleCallback if available to avoid blocking main thread frames
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(async () => {
          await saveToSlot(slotId, stateToSave);
          this.finalizeSave();
        });
      } else {
        await saveToSlot(slotId, stateToSave);
        this.finalizeSave();
      }
    } catch (error) {
      console.error("PersistenceManager: Save failed", error);
      this.isSaving = false;
    }
  }

  private finalizeSave() {
    this.isSaving = false;
    this.lastSaveTime = Date.now();
    
    // If more state arrived during save, schedule another one
    if (this.pendingState) {
      this.scheduleSave(this.pendingSlotId!, this.pendingState);
    }
  }

  private isForcedValue() {
    // Logic to detect if we should bypass rate limit (e.g. major state change)
    return false;
  }
}

export const persistenceManager = new PersistenceManager();
