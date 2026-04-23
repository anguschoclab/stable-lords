import type { Gear, FightingStyle } from './game';

export interface FighterPose {
  /** Position 0-100 across the arena (left to right) */
  x: number;
  /** Vertical offset for lunges/jumps (-10 to 10) */
  y: number;
  /** Facing direction */
  facing: 'left' | 'right';
  /** Current combat stance */
  stance:
    | 'neutral'
    | 'advancing'
    | 'retreating'
    | 'lunging'
    | 'defending'
    | 'stunned'
    | 'victorious'
    | 'defeated';
}

export interface SpeechBubble {
  id: string;
  text: string;
  speaker: 'A' | 'D';
  duration: number;
  type: 'taunt' | 'hit' | 'crit' | 'death' | 'victory';
}

export interface ArenaState {
  fighterA: FighterPose;
  fighterD: FighterPose;
  bubbles: SpeechBubble[];
  hpA: number;
  hpD: number;
  fpA: number;
  fpD: number;
}

export interface FighterStats {
  maxHp: number;
  currentHp: number;
  maxFp: number;
  currentFp: number;
}

export interface ArenaFighterData {
  name: string;
  style: FightingStyle;
  gear: Gear;
  stats: FighterStats;
  isWinner: boolean;
  isDead: boolean;
}
