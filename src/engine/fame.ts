/**
 * Fame/Popularity calculation from fight outcome tags.
 */

export interface FamePop {
  fame: number;
  pop: number;
  labels: string[];
}

export function fameFromTags(tags: string[] = []): FamePop {
  let fame = 0;
  let pop = 0;
  const labels: string[] = [];
  const has = (t: string) => tags.includes(t);

  if (has('Kill')) {
    fame += 3;
    labels.push('Infamy +3 (Kill)');
  }
  if (has('KO')) {
    fame += 2;
    pop += 1;
    labels.push('Fame +2 (KO)');
  }
  if (has('Flashy')) {
    pop += 2;
    labels.push('Popularity +2 (Flashy)');
  }
  if (has('Comeback')) {
    fame += 1;
    pop += 1;
    labels.push('Clutch +1/+1');
  }
  if (has('RiposteChain')) {
    fame += 1;
    labels.push('Counter Mastery +1');
  }
  if (has('Dominance')) {
    fame += 1;
    labels.push('Dominant Win +1');
  }

  // New tags for population bumps
  if (has('bloody')) {
    pop += 2;
    labels.push('Popularity +2 (Bloody)');
  }
  if (has('upset')) {
    pop += 5;
    labels.push('Popularity +5 (Upset)');
  }
  if (has('quick')) {
    pop -= 1;
    labels.push('Popularity -1 (Quick)');
  }
  if (has('epic')) {
    pop += 10;
    labels.push('Popularity +10 (Epic)');
  }

  // Dampener to avoid runaway
  if (fame > 5) fame = 5 + Math.floor((fame - 5) * 0.5);
  if (pop > 5) pop = 5 + Math.floor((pop - 5) * 0.5);

  return { fame, pop, labels };
}
