/**
 * Pure state transformation utilities to maintain immutability and reduce duplication.
 */

/**
 * Updates a specific item in an array based on its ID.
 * Replaces the repetitive .map(item => item.id === id ? { ...item, ...updates } : item) pattern.
 *
 * @param list - The array to search
 * @param id - The ID of the item to update
 * @param updater - A function that returns the updated item
 * @returns A new array with the item updated (or original array if not found)
 */
export function updateEntityInList<T extends { id: string }>(
  list: T[],
  id: string,
  updater: (item: T) => T
): T[] {
  return list.map((item) => (item.id === id ? updater(item) : item));
}

/**
 * Ensures an array doesn't exceed a specific length (slicing from the end).
 * Used for history truncation throughout the game store.
 *
 * @param list - The array to truncate
 * @param limit - The maximum number of elements to keep
 * @returns Truncated array
 */
export function truncateArray<T>(list: T[], limit: number): T[] {
  if (list.length <= limit) return list;
  return list.slice(-limit);
}
