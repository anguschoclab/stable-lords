/**
 * Storage Utility Functions
 * Provides common operations for localStorage with quota error handling
 * Eliminates DRY violations of localStorage quota error patterns
 */

/**
 * Handles localStorage quota exceeded errors with retry logic
 * Eliminates DRY violation of localStorage error handling patterns
 */
export function handleLocalStorageQuotaError(operation: string, data: any): void {
  try {
    localStorage.setItem(operation, JSON.stringify(data));
  } catch (error) {
    console.error(`localStorage quota exceeded when saving ${operation}`, error);

    // Attempt to recover by clearing old data
    try {
      const keys = Object.keys(localStorage);
      // Remove oldest entries (assuming keys are timestamps)
      keys
        .sort()
        .slice(0, keys.length / 2)
        .forEach((key) => localStorage.removeItem(key));

      // Retry after clearing space
      localStorage.setItem(operation, JSON.stringify(data));
    } catch (retryError) {
      console.error(`Failed to recover from localStorage quota error for ${operation}`, retryError);
      throw new Error(`Unable to save ${operation} to localStorage due to quota limits`);
    }
  }
}
