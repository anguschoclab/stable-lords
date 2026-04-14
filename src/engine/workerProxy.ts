import * as Comlink from "comlink";
import type { EngineWorker } from "./worker";

/**
 * Stable Lords — Engine Worker Proxy
 * Manages the connection to the simulation worker.
 * 
 * Note: Web Workers work in Electron's renderer process.
 * For full Electron integration with IPC, the worker logic could be moved
 * to the main process, but that requires significant refactoring.
 * Current implementation uses Web Worker which is supported in Electron.
 */

// Create the worker instance using Vite's worker support
const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});

// Wrap the worker with Comlink
export const engineProxy = Comlink.wrap<EngineWorker>(worker);
