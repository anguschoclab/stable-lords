/**
 * Simple logger to centralize console output and satisfy ESLint.
 */
export const logger = {
  log: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(...args);
  },
  error: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(...args);
  },
  warn: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.warn(...args);
  },
};
