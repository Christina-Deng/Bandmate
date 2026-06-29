/**
 * Phase 2 song seed — canonical shape for songs.seed.json (v2).
 * Used by seed loader, rule engine, and AI recommendation grounding.
 */

/** Matches frontend MUSIC_STYLES ids. */
export type MusicStyleId =
  | 'rock'
  | 'pop'
  | 'folk'
  | 'metal'
  | 'punk'
  | 'indie'
  | 'jazz'
  | 'blues'
  | 'funk'
  | 'rnb'
  | 'acg'
  | 'electronic'
  | 'postrock'
  | 'postpunk'
  | 'hardcore'
  | 'emo'
  | 'grunge'
  | 'mathrock'
  | 'prog'
  | 'shoegaze'
  | 'deathcore'
  | 'reggae'
  | 'country'
  | 'classical'
  | 'world';

export type VocalRequirement = 'required' | 'optional' | 'instrumental_ok';

export type GuitarLeadRequirement = 'none' | 'optional' | 'required';
export type GuitarRhythmRequirement = 'none' | 'optional' | 'required';

export type BassRequirement = 'required' | 'optional' | 'none';
export type DrumsRequirement = 'required' | 'optional' | 'program_ok';
export type KeyboardRequirement = 'none' | 'optional_pad' | 'important' | 'required';

export type SongPartId =
  | 'vocals'
  | 'rhythmGuitar'
  | 'leadGuitar'
  | 'bass'
  | 'drums'
  | 'keyboard';

export interface SongArrangement {
  /** Full-band vocal expectation. */
  vocals: VocalRequirement;
  guitars: {
    count: 0 | 1 | 2;
    lead: GuitarLeadRequirement;
    rhythm: GuitarRhythmRequirement;
  };
  bass: BassRequirement;
  drums: DrumsRequirement;
  /** Keyboard / pad / piano — many rock songs use `none`. */
  keyboard: KeyboardRequirement;
}

export interface PartSkill {
  /** Minimum skill level 1–5 for this part (not the band Instrument enum). */
  minLevel: number;
}

/** Per-part difficulty; omit parts not used in this song. */
export interface SongParts {
  vocals?: PartSkill;
  rhythmGuitar?: PartSkill;
  leadGuitar?: PartSkill;
  bass?: PartSkill;
  drums?: PartSkill;
  keyboard?: PartSkill;
}

export type FallbackLeadGuitar = 'omit' | 'program_lead' | 'combine_into_rhythm' | 'not_applicable';

export type FallbackRhythmGuitar = 'omit' | 'program_rhythm' | 'keyboard_fill' | 'not_applicable';

export type FallbackBass = 'omit' | 'program_bass' | 'keyboard_bass' | 'not_applicable';

export type FallbackDrums = 'omit' | 'program_drums' | 'cajon' | 'not_applicable';

export type FallbackKeyboard = 'omit' | 'program_pad' | 'guitar_cover' | 'not_applicable';

export type FallbackVocals = 'instrumental_ok' | 'program_guide' | 'not_applicable';

/** What to do when the band is missing a role — surfaced on recommendation cards. */
export interface SongFallbacks {
  missingLeadGuitar?: FallbackLeadGuitar;
  missingRhythmGuitar?: FallbackRhythmGuitar;
  missingBass?: FallbackBass;
  missingDrums?: FallbackDrums;
  missingKeyboard?: FallbackKeyboard;
  missingVocals?: FallbackVocals;
}

export interface SeedSong {
  id: string;
  title: string;
  artist: string;
  style: MusicStyleId | string;
  styles?: string[];
  bpm?: number;
  /** Maintainer-only curation notes (not shown to users directly). */
  notes?: string;
  arrangement: SongArrangement;
  parts: SongParts;
  fallbacks: SongFallbacks;
}

export interface SongSeedFile {
  version: number;
  generatedAt?: string;
  description?: string;
  songs: SeedSong[];
}

/** Human-readable labels for recommendation UI / preview script. */
export const FALLBACK_LABELS: Record<string, string> = {
  omit: '可省略该声部',
  program_lead: '可用 Program 补主音吉他',
  combine_into_rhythm: '节奏吉他兼弹主音段',
  program_rhythm: '可用 Program 补节奏吉他',
  keyboard_fill: '可用键盘铺 rhythm',
  program_bass: '可用 Program 贝斯',
  keyboard_bass: '可用键盘弹贝斯线',
  program_drums: '可用 Program / 鼓机',
  cajon: '可用箱鼓代替',
  program_pad: '可用 Program 铺底 Pad',
  guitar_cover: '吉他可大致覆盖键盘层',
  instrumental_ok: '可做纯器乐版',
  program_guide: '可用原唱 guide track',
  not_applicable: '不适用',
};

export const KEYBOARD_REQUIREMENT_LABELS: Record<KeyboardRequirement, string> = {
  none: '无需键盘',
  optional_pad: '键盘铺底（可省略）',
  important: '键盘较重要',
  required: '需要键盘',
};
