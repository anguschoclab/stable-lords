/**
 * Storage Utility Functions
 * Provides common operations for localStorage with quota error handling
 * Eliminates DRY violations of localStorage quota error patterns
 */

/**
 * Handles localStorage quota exceeded errors with retry logic
 * Eliminates DRY violation of localStorage error handling patterns
 */
export function handleLocalStorageQuotaError(operation: string, data: unknown): void {
  try {
    localStorage.setItem(operation, JSON.stringify(data));
  } catch (error) {
    console.error(`localStorage quota exceeded when saving ${operation}`, error);

    // Attempt to recover by trimming the specific array data being saved
    // rather than indiscriminately deleting unrelated localStorage keys
    try {
      if (Array.isArray(data) && data.length > 0) {
        // Trim the oldest 20% of the array (at least 1 item)
        const trimCount = Math.max(1, Math.floor(data.length * 0.2));
        const trimmedData = data.slice(trimCount);

        // Retry after clearing space in the specific entry
        localStorage.setItem(operation, JSON.stringify(trimmedData));
      } else {
        throw new Error(`Data is not an array or is empty, cannot trim to save space`, {
          cause: error,
        });
      }
    } catch (retryError) {
      console.error(`Failed to recover from localStorage quota error for ${operation}`, retryError);

      throw new Error(`Unable to save ${operation} to localStorage due to quota limits`, {
        cause: retryError,
      });
    }
  }
}
