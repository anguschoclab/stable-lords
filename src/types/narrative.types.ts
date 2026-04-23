/**
 * Narrative Content Types
 * Comprehensive TypeScript interfaces for narrativeContent.json
 */

import type { CrowdMoodType } from './shared.types';

// ─── UX Metadata ────────────────────────────────────────────────────────

export interface MoodToneRecord {
  adjectives: string[];
  opener: string[];
  closer: string[];
}

export interface UxMetadata {
  version: string;
  description: string;
  mood_tone: Record<CrowdMoodType, MoodToneRecord>;
}

// ─── Persona Descriptors ─────────────────────────────────────────────────

export interface PersonaDescriptor {
  min: number;
  text: string;
}

export interface PersonaSkill {
  high: PersonaDescriptor[];
  low: PersonaDescriptor[];
}

export interface PersonaGood {
  initiative: PersonaSkill;
  riposte: PersonaSkill;
  attack: PersonaSkill;
  parry: PersonaSkill;
  defense: PersonaSkill;
  endurance: PersonaSkill;
}

export interface PersonaBad {
  initiative: PersonaSkill;
  attack: PersonaSkill;
}

export interface PersonaDescriptors {
  coordination: Record<string, string>;
  activity: Record<string, string>;
}

export interface Persona {
  good: PersonaGood;
  bad: PersonaBad;
  descriptors: PersonaDescriptors;
}

// ─── Strike Narratives ────────────────────────────────────────────────────

export interface StrikeCategory {
  glancing: string[];
  solid: string[];
  mastery: string[];
  critical_human: string[];
  critical_supernatural: string[];
  fatal: string[];
}

export interface StrikesCollection {
  generic: string[];
  slashing: StrikeCategory;
  bashing: StrikeCategory;
  piercing: StrikeCategory;
  fist: StrikeCategory;
}

// ─── Play-by-Play Narratives ─────────────────────────────────────────────

export interface HitLocations {
  head: string[];
  chest: string[];
  abdomen: string[];
  'right arm': string[];
  'left arm': string[];
  'right leg': string[];
  'left leg': string[];
}

export interface DamageSeverity {
  deadly: string[];
  terrific: string[];
  powerful: string[];
  glancing: string[];
}

export interface StatusChanges {
  severe: string[];
  desperate: string[];
  serious: string[];
}

export interface Defenses {
  dodge: { success: string[] };
  parry: { success: string[] };
  shield: { success: string[] };
}

export interface Pacing {
  stalemate: string[];
  trading_blows: string[];
  pressing: string[];
}

export interface Reactions {
  positive: string[];
  negative: string[];
  encourage: string[];
}

export interface Taunts {
  winner: string[];
  loser: string[];
}

export interface Insights {
  ST: string[];
  SP: string[];
  DF: string[];
  WL: string[];
}

export interface PbpNarratives {
  openers: string[];
  whiffs: string[];
  hit_locations: HitLocations;
  damage_severity: DamageSeverity;
  status_changes: StatusChanges;
  defenses: Defenses;
  pacing: Pacing;
  reactions: Reactions;
  taunts: Taunts;
  initiative: string[];
  feints: string[];
  insights: Insights;
}

// ─── Conclusions ──────────────────────────────────────────────────────────

export interface Conclusions {
  Kill: string | string[];
  KO: string | string[];
  Stoppage: string | string[];
  Exhaustion: string | string[];
}

// ─── Events ────────────────────────────────────────────────────────────────

export interface EventNarrative {
  title: string;
  newsletter: string[];
}

export interface Events {
  tavern_brawl: EventNarrative;
  celestial_blessing: EventNarrative;
}

// ─── Gazette Narratives ───────────────────────────────────────────────────

export interface GazetteFights {
  Kill: string[];
  KO: string[];
  Stoppage: string[];
  Exhaustion: string[];
  Draw: string[];
  Default: string[];
}

export interface GazetteHeadlines {
  LegendaryStreak: string[];
  HotStreak: string[];
  Streak: string[];
  LegacyRivalry: string[];
  Rivalry: string[];
  RisingStar: string[];
  Upset: string[];
  MultipleKills: string[];
  Kill: string[];
  MultipleKOs: string[];
  Standard: string[];
  Empty: string[];
  Graveyard: string[];
}

export interface GazetteFeatured {
  LegendaryStreak: string[];
  HotStreak: string[];
  Streak: string[];
  LegacyRivalry: string[];
  Rivalry: string[];
  RisingStar: string[];
  Upset: string[];
  Graveyard: string[];
}

export interface SeasonSummary {
  headline: string;
  body: string[];
}

export interface GazetteNarratives {
  fights: GazetteFights;
  headlines: GazetteHeadlines;
  featured: GazetteFeatured;
  season_summary: SeasonSummary;
}

// ─── Fanfare ─────────────────────────────────────────────────────────────

export interface Fanfare {
  resolution_title: string;
  gazette_empty: string;
  report_medical: string;
  report_combat: string;
  report_combat_empty: string;
  report_math: string;
  memorial_title: string;
  memorial_default: string;
  btn_honor: string;
  btn_planning: string;
  btn_next: string;
  armor_intro_verbs: string[];
  weapon_intro_verbs: string[];
}

// ─── Memorials ────────────────────────────────────────────────────────────

export interface Memorials {
  tributes: string[];
}

// ─── Recruitment ───────────────────────────────────────────────────────────

export interface TierConfig {
  points: number[];
  cost: number;
  stars: number;
}

export interface Recruitment {
  names: string[];
  rival_stable_names: string[];
  tiers: Record<string, TierConfig>;
  origin: string[];
  style_blurbs: Record<string, string[]>;
}

// ─── Meta ─────────────────────────────────────────────────────────────────

export interface Meta {
  flair: Record<string, string>;
  title: Record<string, string>;
  injury: Record<string, string>;
  status: Record<string, string>;
}

// ─── Passives ─────────────────────────────────────────────────────────────

export interface Passives {
  [key: string]: string[];
}

// ─── Root Narrative Content Interface ───────────────────────────────────────

export interface KillText {
  [key: string]: string[];
}

export interface NarrativeContent {
  ux_metadata: UxMetadata;
  persona: Persona;
  strikes: StrikesCollection;
  pbp: PbpNarratives;
  conclusions: Conclusions;
  events: Events;
  gazette: GazetteNarratives;
  fanfare: Fanfare;
  memorials: Memorials;
  recruitment: Recruitment;
  meta: Meta;
  passives: Passives;
  kill_text?: KillText;
}
