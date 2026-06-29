import {
  FALLBACK_LABELS,
  KEYBOARD_REQUIREMENT_LABELS,
  type SeedSong,
  type SongPartId,
} from '../types/seedSong.js';
import type { ScoredCandidate } from './recommendationRuleEngine.js';

const PART_LABELS: Record<SongPartId, string> = {
  vocals: '主唱',
  rhythmGuitar: '节奏吉他',
  leadGuitar: '主音吉他',
  bass: '贝斯',
  drums: '鼓',
  keyboard: '键盘',
};

export function buildNeteaseSearchUrl(title: string, artist: string): string {
  return `https://music.163.com/#/search/m/?s=${encodeURIComponent(`${title} ${artist}`)}&type=1`;
}

export function formatArrangementSummary(song: SeedSong): string {
  const a = song.arrangement;
  const bits: string[] = [];

  if (a.vocals === 'instrumental_ok') bits.push('可纯器乐');
  else if (a.vocals === 'required') bits.push('需要主唱');

  if (a.guitars.count === 2) bits.push('双吉他');
  else if (a.guitars.count === 1) bits.push('单吉他');
  else bits.push('无吉他');

  if (a.bass === 'required') bits.push('要贝斯');
  else if (a.bass === 'optional') bits.push('贝斯可选');
  if (a.drums === 'required') bits.push('要鼓');
  else if (a.drums === 'program_ok') bits.push('鼓可用 program');
  bits.push(KEYBOARD_REQUIREMENT_LABELS[a.keyboard]);

  return bits.join(' · ');
}

export function formatPartsSummary(song: SeedSong): string {
  return (Object.entries(song.parts) as [SongPartId, { minLevel: number }][])
    .map(([part, { minLevel }]) => `${PART_LABELS[part]}${minLevel}`)
    .join(' ');
}

export function buildFallbackReason(candidate: ScoredCandidate, bandName: string): string {
  const hints =
    candidate.arrangementHints.length > 0
      ? `注意编制提示：${candidate.arrangementHints[0]}。`
      : '';
  return `适合「${bandName}」排练：风格匹配，全员 skill 达标。${hints}`.trim();
}
