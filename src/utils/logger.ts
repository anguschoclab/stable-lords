/**
 * Simple logger to centralize console output.
 * Console usage is permitted by ESLint config for this file only.
 */
export const logger = {
  log: (...args: unknown[]) => {
    console.log(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
};
