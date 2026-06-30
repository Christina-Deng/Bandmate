import type { getBand } from './bandService.js';
import type { RuleEngineInput } from './recommendationRuleEngine.js';

type BandWithMembers = Awaited<ReturnType<typeof getBand>>;

export type StylePreferenceSource = 'band' | 'members' | 'none';

function parseStylePreferences(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === 'string');
}

function stylesFromQuestionnaire(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return [];
  const answers = raw as Record<string, unknown>;
  if (Array.isArray(answers.stylePreferences)) {
    return answers.stylePreferences.filter((v): v is string => typeof v === 'string');
  }
  if (typeof answers.stylePreference === 'string' && answers.stylePreference !== 'any') {
    return [answers.stylePreference];
  }
  return [];
}

function resolveStylePreferences(band: BandWithMembers): {
  styles: string[];
  source: StylePreferenceSource;
} {
  const bandStyles = parseStylePreferences(band.stylePreferences);
  if (bandStyles.length > 0) {
    return { styles: bandStyles, source: 'band' };
  }

  const memberStyles = new Set<string>();
  for (const member of band.members) {
    for (const style of stylesFromQuestionnaire(member.questionnaireAnswers)) {
      memberStyles.add(style);
    }
  }

  if (memberStyles.size > 0) {
    return { styles: [...memberStyles], source: 'members' };
  }

  return { styles: [], source: 'none' };
}

export function bandToRuleEngineInput(
  band: BandWithMembers,
): RuleEngineInput & { bandName: string } {
  const { styles, source } = resolveStylePreferences(band);

  return {
    bandName: band.name,
    stylePreferences: styles,
    stylePreferenceSource: source,
    members: band.members.map((m) => ({
      displayName: m.user.displayName,
      instrument: m.instrument,
      skillLevel: m.skillLevel,
    })),
  };
}
