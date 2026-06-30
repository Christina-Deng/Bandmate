import type { SeedSong } from '../types/seedSong.js';
import {
  computeStyleScore,
  evaluateSong,
  type RuleEngineInput,
  type RuleEngineMember,
} from './recommendationRuleEngine.js';

type FailureKind = 'style' | 'skill' | 'arrangement';

function classifyFailure(song: SeedSong, input: RuleEngineInput): FailureKind | 'ok' {
  if (computeStyleScore(song, input.stylePreferences) <= 0) return 'style';
  if (evaluateSong(song, input.members, 0)) return 'ok';
  if (evaluateSong(song, input.members, 1)) return 'skill';
  return 'arrangement';
}

function countMembersWithoutInstrument(members: RuleEngineMember[]): number {
  return members.filter((m) => m.instrument === 'OTHER').length;
}

export interface RecommendationDiagnosis {
  message: string;
  hints: string[];
}

export function diagnoseEmptyRecommendations(
  songs: SeedSong[],
  input: RuleEngineInput,
): RecommendationDiagnosis {
  const counts: Record<FailureKind, number> = { style: 0, skill: 0, arrangement: 0 };
  let okStretchOnly = 0;

  for (const song of songs) {
    const kind = classifyFailure(song, input);
    if (kind === 'ok') continue;
    if (kind === 'skill') okStretchOnly += 1;
    else counts[kind] += 1;
  }

  const hints: string[] = [];
  const { members, stylePreferences } = input;
  const unassigned = countMembersWithoutInstrument(members);
  const lowSkill = members.filter((m) => m.skillLevel <= 1).length;

  if (unassigned > 0) {
    hints.push(
      `${unassigned} 名成员尚未填写问卷（乐器显示为「其他」），推荐无法匹配编制，请完善「我的资料」`,
    );
  }

  if (lowSkill > 0 && members.length > 0) {
    hints.push(`${lowSkill} 名成员技能为 1 级，曲库中多数曲目要求 2 级及以上，填问卷后可提升匹配数`);
  }

  if (stylePreferences.length > 0 && counts.style > counts.arrangement) {
    hints.push(
      '当前乐队风格与曲库标签交集较少，试试在乐队设置里多选 2–3 个流派（如摇滚 + 流行 + 独立）',
    );
  } else if (stylePreferences.length === 0) {
    hints.push('乐队尚未设置风格偏好，可在乐队页编辑并勾选常排练的流派');
  } else if (input.stylePreferenceSource === 'members') {
    hints.push(
      '乐队尚未在设置里统一风格，当前根据成员问卷合并匹配；建议在乐队页编辑并勾选常排练流派',
    );
  }

  if (counts.arrangement >= counts.style && counts.arrangement > 0) {
    hints.push('现有编制缺少必需声部（如鼓、主唱），可补成员或使用 Program 方案的歌');
  }

  if (okStretchOnly > 0 && hints.length < 4) {
    hints.push(
      `有 ${okStretchOnly} 首风格匹配的歌因技能差 1 级未纳入；若放宽「偏难」规则可显示（需成员已正确填写乐器）`,
    );
  }

  if (members.length <= 1) {
    hints.push('乐队目前人数较少，建议至少凑齐吉他、贝斯、鼓或选用「小编制友好」曲目');
  }

  const message =
    hints.length > 0 ?
      '暂无匹配曲目，可参考以下建议调整后重试'
    : '暂无匹配曲目，试试调整乐队风格或完善成员资料';

  return { message, hints: hints.slice(0, 4) };
}
