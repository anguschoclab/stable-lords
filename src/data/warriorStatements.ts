import { BaseSkills } from '@/types/shared.types';
import { computeCoordination, computeActivityRating } from './terrabloodCharts';
import narrativeContent from './narrativeContent.json';
import type { NarrativeContent } from '@/types/narrative.types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WarriorOverviewStatements {
  initiative: string;
  riposte: string;
  attack: string;
  parry: string;
  defense: string;
  endurance: string;
  coordination: string;
  quickness: string;
  activity: string;
}

type StatementEntry = { min: number; text: string };

// ─── Helpers ────────────────────────────────────────────────────────────────

function pickFromArchive(entries: StatementEntry[] | undefined, witValue: number): string {
  if (!entries || entries.length === 0) return '';
  // Sort descending by min so we find the first (highest) match
  const sorted = [...entries].sort((a, b) => b.min - a.min);
  for (const e of sorted) {
    if (witValue >= e.min) return e.text;
  }
  return entries[entries.length - 1].text;
}

function getQuicknessStatement(defBase: number, parBase: number, wt: number): string {
  if (wt <= 7) {
    if (defBase >= 15) return 'Is quick on his feet';
    if (defBase >= 5) return '';
    if (defBase >= -10) return 'Is slow on his feet';
    return 'Is very slow on his feet';
  }

  let speed;
  let qualifier;

  if (defBase >= 35) {
    speed = 'is incredibly quick and elusive on his feet';
    qualifier =
      parBase >= 30
        ? 'making even dangerous opponents look harmless'
        : parBase <= 0
          ? 'relying on speed to stay out of danger'
          : '';
  } else if (defBase >= 25) {
    speed = 'is very quick on his feet';
    qualifier =
      parBase >= 30
        ? 'often avoiding seemingly hopeless situations'
        : parBase <= 0
          ? 'avoiding rather than trading blows'
          : '';
  } else if (defBase >= 15) {
    speed = 'is quick on his feet';
    qualifier =
      parBase >= 30
        ? 'and is well able to protect himself'
        : parBase <= 0
          ? 'avoiding blows rather than parrying'
          : '';
  } else if (defBase >= 5) {
    return '';
  } else if (defBase >= -10) {
    speed = 'is slow on his feet';
    qualifier =
      parBase >= 30
        ? "finding it hard to avoid a blow he doesn't parry"
        : parBase <= 0
          ? 'with a marked inability to avoid or parry a blow'
          : '';
  } else {
    speed = 'is very slow on his feet';
    qualifier =
      parBase >= 30
        ? 'attempts to parry rather than dodge attacks'
        : parBase <= 0
          ? 'absolutely unable to avoid getting hurt'
          : '';
  }

  return qualifier ? `${speed}, ${qualifier}` : speed;
}

// ─── Generator ─────────────────────────────────────────────────────────────

export function generateWarriorStatements(
  wt: number,
  sp: number,
  df: number,
  skills: BaseSkills
): WarriorOverviewStatements {
  const isGoodWit = wt > 7;
  const p = (narrativeContent as NarrativeContent).persona;

  function getStatement(skillKey: string, baseValue: number, highThreshold: number): string {
    const witKey = isGoodWit ? 'good' : 'bad';
    const orderKey = baseValue >= highThreshold ? 'high' : 'low';
    const category = (p[witKey] as any)?.[skillKey];
    const entries = category?.[orderKey];
    // Personas in the archive use the WT itself for the sub-selection min values
    return pickFromArchive(entries, wt);
  }

  const initiative = getStatement('initiative', skills.INI, 13);
  const riposte = getStatement('riposte', skills.RIP, 13);
  const attack = getStatement('attack', skills.ATT, 10);
  const parry = getStatement('parry', skills.PAR, 10);
  const defense = getStatement('defense', skills.DEF, 7);
  const endurance = getStatement('endurance', skills.DEC, 10);

  // Descriptors
  const coordRating = computeCoordination(sp, df);
  const coordination = p.descriptors.coordination[coordRating] ?? '';

  const quickness = getQuicknessStatement(skills.DEF, skills.PAR, wt);

  const actRating = computeActivityRating(skills.INI, skills.RIP);
  let activity = '';
  if (actRating !== 'Normal') {
    // Basic mapping for activity descriptors
    activity = `Is ${actRating.toLowerCase()}`;
    // Future: pull from archive if we want more flavor
  }

  return {
    initiative,
    riposte,
    attack,
    parry,
    defense,
    endurance,
    coordination,
    quickness,
    activity,
  };
}
