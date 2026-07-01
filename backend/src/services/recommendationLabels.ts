import type { AppLocale } from '../lib/locale.js';
import type { KeyboardRequirement, SongPartId } from '../types/seedSong.js';

const PART_LABELS_ZH: Record<SongPartId, string> = {
  vocals: '主唱',
  rhythmGuitar: '节奏吉他',
  leadGuitar: '主音吉他',
  bass: '贝斯',
  drums: '鼓',
  keyboard: '键盘',
};

const PART_LABELS_EN: Record<SongPartId, string> = {
  vocals: 'Vocals',
  rhythmGuitar: 'Rhythm guitar',
  leadGuitar: 'Lead guitar',
  bass: 'Bass',
  drums: 'Drums',
  keyboard: 'Keyboard',
};

const FALLBACK_LABELS_ZH: Record<string, string> = {
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

const FALLBACK_LABELS_EN: Record<string, string> = {
  omit: 'Part can be omitted',
  program_lead: 'Program lead guitar',
  combine_into_rhythm: 'Rhythm guitar covers lead lines',
  program_rhythm: 'Program rhythm guitar',
  keyboard_fill: 'Keyboard fills rhythm',
  program_bass: 'Program bass',
  keyboard_bass: 'Keyboard bass line',
  program_drums: 'Program / drum machine',
  cajon: 'Cajón instead',
  program_pad: 'Program pad',
  guitar_cover: 'Guitar covers keyboard layer',
  instrumental_ok: 'Instrumental version OK',
  program_guide: 'Guide vocal track',
  not_applicable: 'N/A',
};

const KEYBOARD_LABELS_ZH: Record<KeyboardRequirement, string> = {
  none: '无需键盘',
  optional_pad: '键盘铺底（可省略）',
  important: '键盘较重要',
  required: '需要键盘',
};

const KEYBOARD_LABELS_EN: Record<KeyboardRequirement, string> = {
  none: 'No keyboard',
  optional_pad: 'Optional pad',
  important: 'Keyboard important',
  required: 'Keyboard required',
};

export function getPartLabel(part: SongPartId, locale: AppLocale): string {
  return locale === 'en' ? PART_LABELS_EN[part] : PART_LABELS_ZH[part];
}

export function getFallbackLabel(key: string, locale: AppLocale): string {
  const map = locale === 'en' ? FALLBACK_LABELS_EN : FALLBACK_LABELS_ZH;
  return map[key] ?? key;
}

export function getKeyboardRequirementLabel(
  requirement: KeyboardRequirement,
  locale: AppLocale,
): string {
  return locale === 'en' ? KEYBOARD_LABELS_EN[requirement] : KEYBOARD_LABELS_ZH[requirement];
}

export function getPartLabelsMap(locale: AppLocale): Record<SongPartId, string> {
  return locale === 'en' ? PART_LABELS_EN : PART_LABELS_ZH;
}
