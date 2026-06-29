import type { getBand } from './bandService.js';
import type { RuleEngineInput } from './recommendationRuleEngine.js';

type BandWithMembers = Awaited<ReturnType<typeof getBand>>;

function parseStylePreferences(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === 'string');
}

export function bandToRuleEngineInput(
  band: BandWithMembers,
): RuleEngineInput & { bandName: string } {
  return {
    bandName: band.name,
    stylePreferences: parseStylePreferences(band.stylePreferences),
    members: band.members.map((m) => ({
      displayName: m.user.displayName,
      instrument: m.instrument,
      skillLevel: m.skillLevel,
    })),
  };
}
