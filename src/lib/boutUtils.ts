import { MinuteEvent } from '@/types/game';

export function classifyEvent(
  event: MinuteEvent | string
):
  | 'hit'
  | 'miss'
  | 'crit'
  | 'death'
  | 'ko'
  | 'exhaust'
  | 'status'
  | 'riposte'
  | 'initiative'
  | 'phase'
  | 'spatial' {
  const text = typeof event === 'string' ? event : event.text;

  if (text.startsWith('—') && text.includes('Phase')) return 'phase';

  if (typeof event !== 'string') {
    // Check raw events for metadata first
    const hasCrit = event.events?.some((e) => e.metadata?.critical || e.metadata?.lethal);
    if (hasCrit) return 'crit';
  }

  const t = text.toLowerCase();
  if (t.includes('kill') || t.includes('death') || t.includes('slain') || t.includes('fatal'))
    return 'death';
  if (
    t.includes('knocked out') ||
    t.includes('ko') ||
    t.includes('unconscious') ||
    t.includes('no longer continue')
  )
    return 'ko';
  if (
    t.includes('exhausted') ||
    t.includes('exhaustion') ||
    t.includes('tiring') ||
    t.includes('sluggish')
  )
    return 'exhaust';
  if (
    t.includes('devastating') ||
    t.includes('critical') ||
    t.includes('massive') ||
    t.includes('lethal')
  )
    return 'crit';
  if (t.includes('counter-attack') || t.includes('riposte')) return 'riposte';
  if (t.includes('initiative') || t.includes('seizes')) return 'initiative';
  if (
    t.includes('range') ||
    t.includes('feint') ||
    t.includes('closes in') ||
    t.includes('backs away') ||
    t.includes('pushes') ||
    t.includes('forced to') ||
    t.includes('corner') ||
    t.includes('edge of') ||
    t.includes('center of')
  )
    return 'spatial';
  if (
    t.includes('damage') ||
    t.includes('strikes') ||
    t.includes('hits') ||
    t.includes('lands') ||
    t.includes('striking')
  )
    return 'hit';
  if (
    t.includes('miss') ||
    t.includes('parr') ||
    t.includes('dodge') ||
    t.includes('turns') ||
    t.includes('no opening') ||
    t.includes('blocks')
  )
    return 'miss';
  return 'status';
}
