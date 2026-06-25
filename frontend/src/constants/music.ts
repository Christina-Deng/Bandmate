import type { Instrument } from '../types/band';

/** Curated genres common in band / rehearsal contexts (CN + international). */
export const MUSIC_STYLES = [
  { id: 'rock', label: '摇滚' },
  { id: 'pop', label: '流行' },
  { id: 'folk', label: '民谣' },
  { id: 'metal', label: '金属' },
  { id: 'punk', label: '朋克' },
  { id: 'indie', label: '独立' },
  { id: 'jazz', label: '爵士' },
  { id: 'blues', label: '蓝调' },
  { id: 'funk', label: '放克' },
  { id: 'rnb', label: 'R&B / Soul' },
  { id: 'acg', label: 'ACG（动漫/游戏）' },
  { id: 'hiphop', label: '嘻哈 / 说唱' },
  { id: 'electronic', label: '电子' },
  { id: 'postrock', label: '后摇' },
  { id: 'reggae', label: '雷鬼' },
  { id: 'country', label: '乡村' },
  { id: 'classical', label: '古典 / 融合' },
  { id: 'world', label: '世界音乐' },
] as const;

export type MusicStyleId = (typeof MUSIC_STYLES)[number]['id'];

const styleLabelMap = Object.fromEntries(MUSIC_STYLES.map((s) => [s.id, s.label])) as Record<
  MusicStyleId,
  string
>;

export function formatStylePreferences(ids: string[] | null | undefined): string {
  if (!ids?.length) return '';
  return ids.map((id) => styleLabelMap[id as MusicStyleId] ?? id).join('、');
}

export const INSTRUMENT_LABELS: Record<Instrument, string> = {
  GUITAR: '吉他',
  BASS: '贝斯',
  DRUMS: '鼓',
  VOCALS: '主唱',
  KEYBOARD: '键盘',
  OTHER: '其他',
};

/**
 * Progressive skill checkpoints per instrument (aligned with common curricula /
 * ABRSM-adjacent milestones, adapted for self-assessment in a band context).
 */
export const INSTRUMENT_SKILL_QUESTIONS: Record<Instrument, string[]> = {
  GUITAR: [
    '开放和弦与稳定扫弦/分解',
    '横按和弦与流畅转换',
    '五声音阶或主音 solo 即兴',
    '推弦、闷音、滑音等 articulation',
    '视谱或准确跟 Tab/谱',
  ],
  BASS: [
    '根音跟弹与基本 groove',
    '音阶把位与跨弦移动',
    '切分、加花与 ghost note',
    '指弹与拨片技法',
    '视谱或准确跟谱',
  ],
  DRUMS: [
    '基本四拍 / 常见 rock-pop 节奏型',
    '军鼓技法与滚奏控制',
    '手脚分离（踩镲 + 底鼓独立）',
    '复合拍与切分节奏',
    '动态控制与段落 fill',
  ],
  VOCALS: [
    '音准稳定、少跑调',
    '气息支撑与长句控制',
    '真假声 / 混声转换',
    '和声叠唱与双声部',
    '话筒技巧与舞台表现',
  ],
  KEYBOARD: [
    '三和弦及基本分解伴奏',
    '左右手独立与常见 comping 型',
    '大小调音阶与简单即兴',
    '延音踏板与触键力度控制',
    '视谱或准确跟谱',
  ],
  OTHER: [
    '基本音色与正确演奏姿势',
    '节奏稳定、能跟 band',
    '完整演奏简单曲目',
    '本乐器基础技法',
    '视谱或跟谱',
  ],
};

export const PLAYING_EXPERIENCE_OPTIONS = [
  ['<1', '新手（不到 1 年）'],
  ['1-3', '1–3 年'],
  ['3-5', '3–5 年'],
  ['5+', '5 年以上'],
] as const;

const experienceLabelMap = Object.fromEntries(
  PLAYING_EXPERIENCE_OPTIONS.map(([id, label]) => [id, label]),
) as Record<string, string>;

export function formatPlayingExperience(experience: string | undefined): string | null {
  if (!experience) return null;
  return experienceLabelMap[experience] ?? experience;
}

/** Resolve style ids from current or legacy questionnaire fields. */
export function resolveStylePreferenceIds(answers: {
  stylePreferences?: string[];
  stylePreference?: string;
}): string[] {
  if (answers.stylePreferences?.length) return answers.stylePreferences;
  if (answers.stylePreference && answers.stylePreference !== 'any') {
    return [answers.stylePreference];
  }
  return [];
}
