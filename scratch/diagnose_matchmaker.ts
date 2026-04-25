import { createFreshState } from "../src/engine/factories";
import { advanceWeek } from "../src/engine/pipeline/services/weekPipelineService";

const origLog = console.log;
console.log = (...args: any[]) => {
  const s = String(args[0] ?? '');
  if (s.startsWith('>>>') || s.startsWith('[DEBUG-STATE]') || s.startsWith('[DEBUG] No pairings') || s.startsWith('[DEBUG] Pairing')) {
    origLog(...args);
  }
};

let state = createFreshState("diag-seed");

// Don't seed player, just observe rival world
state.roster = [];

for (let w = 1; w <= 12; w++) {
  state = advanceWeek(state);

  const offers = Object.values(state.boutOffers || {});
  const byStatus: Record<string, number> = {};
  const byBoutWeek: Record<string, number> = {};
  offers.forEach(o => {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    const k = `bw=${o.boutWeek}`;
    byBoutWeek[k] = (byBoutWeek[k] || 0) + 1;
  });

  const rivalRosterSizes = (state.rivals || []).map(r => r.roster.length);
  origLog(`AFTER W${w}: rivals=[${rivalRosterSizes.join(',')}] offers=${offers.length} byStatus=${JSON.stringify(byStatus)} byBoutWeek=${JSON.stringify(byBoutWeek)}`);
}
