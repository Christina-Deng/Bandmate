import type { AppLocale } from '../lib/locale.js';
import type { SeedSong, SongPartId } from '../types/seedSong.js';
import { getFallbackLabel, getPartLabel } from './recommendationLabels.js';

export type RuleEngineInstrument = 'GUITAR' | 'BASS' | 'DRUMS' | 'VOCALS' | 'KEYBOARD' | 'OTHER';

export interface RuleEngineMember {
  displayName: string;
  instrument: RuleEngineInstrument;
  skillLevel: number;
}

export interface RuleEngineInput {
  stylePreferences: string[];
  stylePreferenceSource?: 'band' | 'members' | 'none';
  members: RuleEngineMember[];
  locale?: AppLocale;
}

export interface ScoredCandidate {
  song: SeedSong;
  styleScore: number;
  headroom: number;
  arrangementHints: string[];
  programHints: string[];
  stretchHints: string[];
  isStretch: boolean;
  isStyleStretch?: boolean;
}

/** When style-matched candidates fall below this, include skill-fit songs outside band styles. */
export const STYLE_MATCH_MIN = 6;

function resolveLocale(locale?: AppLocale): AppLocale {
  return locale ?? 'zh';
}

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
  if (!Array.isArray(preferences)) return 1;
  const styles = songStyles(song);
  const hits = preferences.filter((p) => styles.includes(p)).length;
  return hits > 0 ? hits : preferences.length > 0 ? 0 : 1;
}

function pickBestMember(
  members: RuleEngineMember[],
  instrument: RuleEngineInstrument,
): RuleEngineMember | undefined {
  return members
    .filter((m) => m.instrument === instrument)
    .sort((a, b) => b.skillLevel - a.skillLevel)[0];
}

export function assignCoverage(members: RuleEngineMember[]): BandCoverage {
  const guitarists = members
    .filter((m) => m.instrument === 'GUITAR')
    .sort((a, b) => b.skillLevel - a.skillLevel);

  return {
    vocals: pickBestMember(members, 'VOCALS'),
    bass: pickBestMember(members, 'BASS'),
    drums: pickBestMember(members, 'DRUMS'),
    keyboard: pickBestMember(members, 'KEYBOARD'),
    rhythmGuitar: guitarists[0],
    leadGuitar: guitarists[1],
  };
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

/** @param maxSkillShortfall 0 = strict; 1 = allow one level below minLevel on assigned parts */
export function evaluateSong(
  song: SeedSong,
  members: RuleEngineMember[],
  maxSkillShortfall = 0,
  locale: AppLocale = 'zh',
): ScoredCandidate | null {
  const coverage = assignCoverage(members);
  const arrangementHints: string[] = [];
  const programHints: string[] = [];
  const stretchHints: string[] = [];
  let headroom = 0;
  let isStretch = false;

  const partIds = Object.keys(song.parts) as SongPartId[];

  for (const part of partIds) {
    const minLevel = song.parts[part]!.minLevel;
    const player = coverage[part];
    const required = partRequired(song, part);

    if (player) {
      const gap = player.skillLevel - minLevel;
      if (gap < -maxSkillShortfall) return null;
      if (gap < 0) {
        isStretch = true;
        stretchHints.push(
          locale === 'en' ?
            `${getPartLabel(part, locale)} (${player.displayName}) is level ${player.skillLevel}; song suggests ${minLevel} — extra prep needed`
          : `${getPartLabel(part, locale)}（${player.displayName}）当前 ${player.skillLevel} 级，本曲建议 ${minLevel} 级，排练前需加强`,
        );
      }
      headroom += gap;
      continue;
    }

    const fallback = song.fallbacks[fallbackKeyForPart(part)];
    const fbLabel = fallback ? getFallbackLabel(fallback, locale) : undefined;
    const partLabel = getPartLabel(part, locale);

    if (required) {
      if (!fallback || fallback === 'omit' || fallback === 'not_applicable') {
        return null;
      }
      arrangementHints.push(
        locale === 'en' ?
          `Missing ${partLabel} → ${fbLabel ?? fallback}`
        : `缺${partLabel} → ${fbLabel ?? fallback}`,
      );
      if (fallback.startsWith('program') || fallback === 'cajon' || fallback === 'keyboard_bass') {
        programHints.push(
          locale === 'en' ? `${partLabel}: ${fbLabel}` : `${partLabel}：${fbLabel}`,
        );
      }
    } else if (fallback && fallback !== 'not_applicable' && fallback !== 'omit') {
      arrangementHints.push(
        locale === 'en' ?
          `Optional ${partLabel} → ${fbLabel ?? fallback}`
        : `可选${partLabel} → ${fbLabel ?? fallback}`,
      );
    }
  }

  return {
    song,
    styleScore: 0,
    headroom,
    arrangementHints,
    programHints,
    stretchHints,
    isStretch,
  };
}

export function scoreCandidates(songs: SeedSong[], input: RuleEngineInput): ScoredCandidate[] {
  const { stylePreferences: preferences } = input;
  const locale = resolveLocale(input.locale);
  const strictStyleMatch: ScoredCandidate[] = [];
  const strictStyleMiss: ScoredCandidate[] = [];
  const strictIds = new Set<string>();

  for (const song of songs) {
    const scored = evaluateSong(song, input.members, 0, locale);
    if (!scored) continue;
    scored.styleScore = computeStyleScore(song, preferences);
    strictIds.add(song.id);
    if (scored.styleScore > 0) strictStyleMatch.push(scored);
    else strictStyleMiss.push(scored);
  }

  const skillStretchStyleMatch: ScoredCandidate[] = [];
  const skillStretchStyleMiss: ScoredCandidate[] = [];

  for (const song of songs) {
    if (strictIds.has(song.id)) continue;
    const scored = evaluateSong(song, input.members, 1, locale);
    if (!scored || !scored.isStretch) continue;
    scored.styleScore = computeStyleScore(song, preferences);
    if (scored.styleScore > 0) {
      skillStretchStyleMatch.push(scored);
    } else {
      skillStretchStyleMiss.push(scored);
    }
  }

  const styleMatched = [...strictStyleMatch, ...skillStretchStyleMatch];
  if (preferences.length === 0 || styleMatched.length >= STYLE_MATCH_MIN) {
    return styleMatched;
  }

  const styleStretch = [...strictStyleMiss, ...skillStretchStyleMiss].map((scored) => ({
    ...scored,
    isStyleStretch: true,
  }));

  return [...styleMatched, ...styleStretch];
}

export function rankCandidates(candidates: ScoredCandidate[]): ScoredCandidate[] {
  return [...candidates].sort((a, b) => {
    if (a.isStretch !== b.isStretch) return a.isStretch ? 1 : -1;
    if (Boolean(a.isStyleStretch) !== Boolean(b.isStyleStretch)) {
      return a.isStyleStretch ? 1 : -1;
    }
    if (b.styleScore !== a.styleScore) return b.styleScore - a.styleScore;
    if (b.headroom !== a.headroom) return b.headroom - a.headroom;
    return (a.song.bpm ?? 999) - (b.song.bpm ?? 999);
  });
}
