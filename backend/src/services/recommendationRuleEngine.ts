import { FALLBACK_LABELS, type SeedSong, type SongPartId } from '../types/seedSong.js';

export type RuleEngineInstrument = 'GUITAR' | 'BASS' | 'DRUMS' | 'VOCALS' | 'KEYBOARD' | 'OTHER';

export interface RuleEngineMember {
  displayName: string;
  instrument: RuleEngineInstrument;
  skillLevel: number;
}

export interface RuleEngineInput {
  stylePreferences: string[];
  members: RuleEngineMember[];
}

export interface ScoredCandidate {
  song: SeedSong;
  styleScore: number;
  headroom: number;
  arrangementHints: string[];
  programHints: string[];
}

const PART_LABELS: Record<SongPartId, string> = {
  vocals: '主唱',
  rhythmGuitar: '节奏吉他',
  leadGuitar: '主音吉他',
  bass: '贝斯',
  drums: '鼓',
  keyboard: '键盘',
};

interface BandCoverage {
  vocals?: RuleEngineMember;
  rhythmGuitar?: RuleEngineMember;
  leadGuitar?: RuleEngineMember;
  bass?: RuleEngineMember;
  drums?: RuleEngineMember;
  keyboard?: RuleEngineMember;
}

function songStyles(song: SeedSong): string[] {
  return [song.style, ...(song.styles ?? [])];
}

export function computeStyleScore(song: SeedSong, preferences: string[]): number {
  const styles = songStyles(song);
  const hits = preferences.filter((p) => styles.includes(p)).length;
  return hits > 0 ? hits : preferences.length > 0 ? 0 : 1;
}

function assignCoverage(members: RuleEngineMember[]): BandCoverage {
  const coverage: BandCoverage = {};
  const guitarists = members.filter((m) => m.instrument === 'GUITAR');

  for (const m of members) {
    if (m.instrument === 'VOCALS') coverage.vocals = m;
    if (m.instrument === 'BASS') coverage.bass = m;
    if (m.instrument === 'DRUMS') coverage.drums = m;
    if (m.instrument === 'KEYBOARD') coverage.keyboard = m;
  }
  if (guitarists[0]) coverage.rhythmGuitar = guitarists[0];
  if (guitarists[1]) coverage.leadGuitar = guitarists[1];

  return coverage;
}

function partRequired(song: SeedSong, part: SongPartId): boolean {
  const { arrangement, parts } = song;
  if (!parts[part]) return false;

  switch (part) {
    case 'vocals':
      return arrangement.vocals === 'required';
    case 'rhythmGuitar':
      return arrangement.guitars.rhythm === 'required';
    case 'leadGuitar':
      return arrangement.guitars.lead === 'required';
    case 'bass':
      return arrangement.bass === 'required';
    case 'drums':
      return arrangement.drums === 'required';
    case 'keyboard':
      return arrangement.keyboard === 'required';
    default:
      return false;
  }
}

function fallbackKeyForPart(part: SongPartId): keyof SeedSong['fallbacks'] {
  const map: Record<SongPartId, keyof SeedSong['fallbacks']> = {
    vocals: 'missingVocals',
    rhythmGuitar: 'missingRhythmGuitar',
    leadGuitar: 'missingLeadGuitar',
    bass: 'missingBass',
    drums: 'missingDrums',
    keyboard: 'missingKeyboard',
  };
  return map[part];
}

function evaluateSong(song: SeedSong, members: RuleEngineMember[]): ScoredCandidate | null {
  const coverage = assignCoverage(members);
  const arrangementHints: string[] = [];
  const programHints: string[] = [];
  let headroom = 0;

  const partIds = Object.keys(song.parts) as SongPartId[];

  for (const part of partIds) {
    const minLevel = song.parts[part]!.minLevel;
    const player = coverage[part];
    const required = partRequired(song, part);

    if (player) {
      const gap = player.skillLevel - minLevel;
      if (gap < 0) return null;
      headroom += gap;
      continue;
    }

    const fallback = song.fallbacks[fallbackKeyForPart(part)];
    const fbLabel = fallback ? FALLBACK_LABELS[fallback] : undefined;

    if (required) {
      if (!fallback || fallback === 'omit' || fallback === 'not_applicable') {
        return null;
      }
      arrangementHints.push(`缺${PART_LABELS[part]} → ${fbLabel ?? fallback}`);
      if (fallback.startsWith('program') || fallback === 'cajon' || fallback === 'keyboard_bass') {
        programHints.push(`${PART_LABELS[part]}：${fbLabel}`);
      }
    } else if (fallback && fallback !== 'not_applicable' && fallback !== 'omit') {
      arrangementHints.push(`可选${PART_LABELS[part]} → ${fbLabel ?? fallback}`);
    }
  }

  return {
    song,
    styleScore: 0,
    headroom,
    arrangementHints,
    programHints,
  };
}

export function scoreCandidates(songs: SeedSong[], input: RuleEngineInput): ScoredCandidate[] {
  return songs
    .map((song) => {
      const scored = evaluateSong(song, input.members);
      if (!scored) return null;
      scored.styleScore = computeStyleScore(song, input.stylePreferences);
      return scored;
    })
    .filter((s): s is ScoredCandidate => s !== null && s.styleScore > 0);
}

export function rankCandidates(candidates: ScoredCandidate[]): ScoredCandidate[] {
  return [...candidates].sort((a, b) => {
    if (b.styleScore !== a.styleScore) return b.styleScore - a.styleScore;
    if (b.headroom !== a.headroom) return b.headroom - a.headroom;
    return (a.song.bpm ?? 999) - (b.song.bpm ?? 999);
  });
}
