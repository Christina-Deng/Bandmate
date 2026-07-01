import type { AppLocale } from '../lib/locale.js';
import type { SeedSong } from '../types/seedSong.js';
import type { ScoredCandidate } from './recommendationRuleEngine.js';
import {
  getKeyboardRequirementLabel,
  getPartLabelsMap,
  getPartLabel,
} from './recommendationLabels.js';

export { getFallbackLabel, getPartLabel } from './recommendationLabels.js';

export function buildNeteaseSearchUrl(title: string, artist: string): string {
  return `https://music.163.com/#/search/m/?s=${encodeURIComponent(`${title} ${artist}`)}&type=1`;
}

export function formatArrangementSummary(song: SeedSong, locale: AppLocale = 'zh'): string {
  const a = song.arrangement;
  const sep = ' · ';
  const bits: string[] = [];

  if (locale === 'en') {
    if (a.vocals === 'instrumental_ok') bits.push('Instrumental OK');
    else if (a.vocals === 'required') bits.push('Vocals required');

    if (a.guitars.count === 2) bits.push('Dual guitar');
    else if (a.guitars.count === 1) bits.push('Single guitar');
    else bits.push('No guitar');

    if (a.bass === 'required') bits.push('Bass required');
    else if (a.bass === 'optional') bits.push('Bass optional');
    if (a.drums === 'required') bits.push('Drums required');
    else if (a.drums === 'program_ok') bits.push('Drums via program OK');
    bits.push(getKeyboardRequirementLabel(a.keyboard, locale));
  } else {
    if (a.vocals === 'instrumental_ok') bits.push('可纯器乐');
    else if (a.vocals === 'required') bits.push('需要主唱');

    if (a.guitars.count === 2) bits.push('双吉他');
    else if (a.guitars.count === 1) bits.push('单吉他');
    else bits.push('无吉他');

    if (a.bass === 'required') bits.push('要贝斯');
    else if (a.bass === 'optional') bits.push('贝斯可选');
    if (a.drums === 'required') bits.push('要鼓');
    else if (a.drums === 'program_ok') bits.push('鼓可用 program');
    bits.push(getKeyboardRequirementLabel(a.keyboard, locale));
  }

  return bits.join(sep);
}

export function formatPartsSummary(song: SeedSong, locale: AppLocale = 'zh'): string {
  const labels = getPartLabelsMap(locale);
  const sep = locale === 'en' ? ' · ' : ' ';
  return (Object.entries(song.parts) as [keyof typeof labels, { minLevel: number }][])
    .map(([part, { minLevel }]) =>
      locale === 'en' ? `${labels[part]} L${minLevel}` : `${labels[part]}${minLevel}`,
    )
    .join(sep);
}

export function buildFallbackReason(
  candidate: ScoredCandidate,
  bandName: string,
  locale: AppLocale = 'zh',
): string {
  const hints =
    candidate.arrangementHints.length > 0 ?
      locale === 'en' ?
        ` Lineup note: ${candidate.arrangementHints[0]}.`
      : `注意编制提示：${candidate.arrangementHints[0]}。`
    : '';

  if (locale === 'en') {
    const stretch =
      candidate.isStretch ?
        'Challenging for some members — see skill stretch notes below.'
      : candidate.isStyleStretch ?
        'Style differs slightly from band prefs, but lineup and skills fit.'
      : 'Style match; everyone meets skill requirements.';
    return `Good fit for “${bandName}”: ${stretch}${hints}`.trim();
  }

  const stretch =
    candidate.isStretch ?
      '本曲对部分成员偏难，见下方「技能挑战」提示。'
    : candidate.isStyleStretch ?
      '风格与乐队偏好不完全一致，但编制与技能适合。'
    : '风格匹配，全员 skill 达标。';
  return `适合「${bandName}」排练：${stretch}${hints}`.trim();
}
