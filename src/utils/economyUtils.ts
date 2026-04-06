/**
 * Stable Lords — Economy Utilities
 * Centralized business logic for financial validation.
 */

/**
 * Validates if the current treasury can afford a specific cost.
 * @param treasury - The current amount of gold available.
 * @param cost - The amount of gold to deduct.
 * @throws Error if cost is negative.
 * @returns boolean - true if affordable.
 */
export const canTransact = (treasury: number, cost: number): boolean => {
  if (cost < 0) {
    throw new Error("Economy Error: Cannot transact a negative cost.");
  }
  return treasury >= cost;
};
