/**
 * TelemetryDashboard — dev-only aggregate view over a bout's structured
 * `ExchangeLogEntry[]`. Gated by the `telemetryDashboard` feature flag;
 * used to validate kill-rate distribution, reason-code frequency, and
 * hit/miss balance against the Unified 1.0 baseline (~10% mortality).
 *
 * Not shown to end users — keep the styling utilitarian.
 */
import type { ExchangeLogEntry } from '@/types/combat.types';
import { getFeatureFlags } from '@/engine/featureFlags';

interface Props {
  exchangeLog?: ExchangeLogEntry[];
}

export default function TelemetryDashboard({ exchangeLog }: Props) {
  if (!getFeatureFlags().telemetryDashboard) return null;
  if (!exchangeLog || exchangeLog.length === 0) return null;

  const total = exchangeLog.length;
  const byPhase: Record<string, number> = { OPENING: 0, MID: 0, LATE: 0 };
  const attResult: Record<string, number> = { hit: 0, miss: 0, crit: 0, fumble: 0 };
  const reasons: Record<string, number> = {};
  let iniA = 0,
    iniD = 0;
  let parries = 0,
    dodges = 0,
    ripostes = 0;
  let kills = 0,
    killWindows = 0;
  let totalDamage = 0;

  for (const e of exchangeLog) {
    if (e.phase) byPhase[e.phase] = (byPhase[e.phase] ?? 0) + 1;
    if (e.attResult) attResult[e.attResult] = (attResult[e.attResult] ?? 0) + 1;
    if (e.iniWinner === 'A') iniA++;
    else if (e.iniWinner === 'D') iniD++;
    if (e.parResult === 'success') parries++;
    if (e.defResult === 'dodge') dodges++;
    if (e.ripResult === 'hit') ripostes++;
    if (e.killWindow) killWindows++;
    if (e.executionFlag) kills++;
    if (e.damage) totalDamage += e.damage;
    for (const r of e.reasonCodes ?? []) reasons[r] = (reasons[r] ?? 0) + 1;
  }

  const row = (label: string, value: string | number) => (
    <div className="flex justify-between px-2 py-0.5 text-[11px] font-mono">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );

  return (
    <details className="mx-4 my-3 rounded border border-amber-500/30 bg-amber-950/10 text-xs">
      <summary className="cursor-pointer px-3 py-2 font-mono uppercase tracking-wider text-amber-400/80">
        ⚙ telemetry · {total} exchanges
      </summary>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0 px-2 py-2">
        <div>
          {row('Total exchanges', total)}
          {row('Opening/Mid/Late', `${byPhase.OPENING}/${byPhase.MID}/${byPhase.LATE}`)}
          {row('Initiative A/D', `${iniA}/${iniD}`)}
          {row('Kill windows opened', killWindows)}
          {row('Executions', kills)}
        </div>
        <div>
          {row('Hits', attResult.hit ?? 0)}
          {row('Misses', attResult.miss ?? 0)}
          {row('Crits', attResult.crit ?? 0)}
          {row('Parries / Dodges / Ripostes', `${parries}/${dodges}/${ripostes}`)}
          {row('Total damage', totalDamage)}
        </div>
      </div>
      {Object.keys(reasons).length > 0 && (
        <div className="border-t border-amber-500/20 px-2 py-2">
          <div className="px-2 pb-1 text-[10px] uppercase tracking-wider text-amber-400/60">
            reason codes
          </div>
          {Object.entries(reasons)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => (
              <div key={k}>{row(k, v)}</div>
            ))}
        </div>
      )}
    </details>
  );
}
