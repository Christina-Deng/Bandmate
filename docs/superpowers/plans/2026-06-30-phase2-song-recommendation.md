# BandMate Phase 2 Song Recommendation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship working song recommendations on `/songs` — rule engine filters the v2 seed library by band profile; AI (optional) picks 5–8 songs and writes Chinese recommendation copy; frontend shows cards with arrangement/program hints and NetEase search links.

**Architecture:** Keep the curated library in `backend/data/songs.seed.json` (no Prisma `Song` table for MVP). Extract rule-engine logic from `scripts/preview-recommendations.ts` into testable services. `GET /songs/recommend?bandId=` loads band from DB, scores seed songs, optionally calls OpenAI with **candidate ids only** (no invented titles). Frontend replaces the placeholder page with recommendation cards. Degrades gracefully when `OPENAI_API_KEY` is unset.

**Tech Stack:** Existing Fastify + Prisma backend · React + Vite + Tailwind frontend · OpenAI Chat Completions API (optional) · Vitest for rule-engine unit tests

## Global Constraints

- UI copy: 中文
- Auth: JWT + httpOnly cookie; recommend route requires login + band membership
- CORS origin: `http://localhost:5173`
- Backend port: `3000`; frontend dev: `5173`
- Seed format: v2 (`arrangement` / `parts` / `fallbacks`) — see `backend/data/README.md`
- Recommendation pipeline: **code filters candidates → AI selects + writes copy** (AI never invents songs outside seed)
- External listen link: NetEase search URL only (no in-app player)
- `FEATURES.SONG_RECOMMENDATION`: set `true` when API + UI are wired
- Do not build: in-app keyword search, separate “AI search” tab, email reminders, Prisma song migrations (Phase 2b)

---

## File Map

```
bandmate/
├── backend/
│   ├── .env.example                          # + OPENAI_API_KEY, OPENAI_MODEL
│   ├── data/songs.seed.json                  # existing v2 library (65 songs)
│   ├── src/
│   │   ├── config/features.ts                # SONG_RECOMMENDATION: true
│   │   ├── lib/songSeedLoader.ts             # NEW: load + cache JSON seed
│   │   ├── services/
│   │   │   ├── recommendationRuleEngine.ts   # NEW: score/filter (from preview script)
│   │   │   ├── recommendationRuleEngine.test.ts
│   │   │   ├── bandProfileForRecommend.ts    # NEW: Prisma band → rule input
│   │   │   ├── recommendationFormatter.ts    # NEW: summaries + netease URL
│   │   │   ├── recommendationAiService.ts    # NEW: optional OpenAI call
│   │   │   └── recommendationService.ts      # NEW: orchestrator
│   │   ├── routes/songs.ts                   # real recommend handler
│   │   └── types/
│   │       ├── seedSong.ts                   # existing
│   │       └── song.ts                       # RecommendedSong + response types
│   └── scripts/preview-recommendations.ts    # thin wrapper importing rule engine
└── frontend/
    ├── src/
    │   ├── config/features.ts                # SONG_RECOMMENDATION: true
    │   ├── types/song.ts                     # match backend response
    │   ├── components/songs/RecommendationCard.tsx  # NEW
    │   └── pages/SongRecommend.tsx           # real UI
```

---

## API Contract (locked for all tasks)

### Request

`GET /songs/recommend?bandId=<cuid>`

- Auth required
- Caller must be member of `bandId`

### Response `200`

```typescript
interface RecommendationResponse {
  status: 'ok' | 'coming_soon' | 'empty';
  songs: RecommendedSong[];
  message?: string;
}

interface RecommendedSong {
  id: string;
  title: string;
  artist: string;
  style: string;
  bpm?: number;
  arrangementSummary: string;   // e.g. "需要主唱 · 单吉他 · 贝斯可选 · 无需键盘"
  partsSummary: string;         // e.g. "主唱2 节奏吉他2 贝斯2 鼓2"
  reason: string;               // AI or rule fallback (1–2 sentences, 中文)
  arrangementHints: string[];   // e.g. ["可选主音吉他 → 节奏吉他兼弹主音段"]
  programHints: string[];       // e.g. ["主音吉他：可用 Program 补主音吉他"]
  listenUrl: string;            // NetEase search
}
```

### Errors

| Code | When |
|------|------|
| `400` | missing `bandId` |
| `403` | not a band member |
| `503` | seed file missing/unreadable (should not happen in dev) |

### Constants

```typescript
export const RECOMMEND_CANDIDATE_POOL = 30;  // max scored candidates passed to AI
export const RECOMMEND_PICK_COUNT = 6;       // songs returned to client
```

---

### Task 1: Seed loader

**Files:**
- Create: `backend/src/lib/songSeedLoader.ts`
- Test: `backend/src/lib/songSeedLoader.test.ts`

**Interfaces:**
- Produces:
  - `loadSongSeed(): SeedSong[]` — reads `backend/data/songs.seed.json`, validates `version === 2`, caches in module scope
  - `clearSongSeedCache(): void` — for tests only

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/lib/songSeedLoader.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSongSeed, clearSongSeedCache } from './songSeedLoader.js';

describe('loadSongSeed', () => {
  beforeEach(() => clearSongSeedCache());

  it('loads v2 seed with songs', () => {
    const songs = loadSongSeed();
    expect(songs.length).toBeGreaterThanOrEqual(60);
    expect(songs[0]).toMatchObject({
      id: expect.stringMatching(/^song-/),
      title: expect.any(String),
      arrangement: expect.any(Object),
      parts: expect.any(Object),
      fallbacks: expect.any(Object),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- src/lib/songSeedLoader.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement loader**

```typescript
// backend/src/lib/songSeedLoader.ts
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SeedSong, SongSeedFile } from '../types/seedSong.js';

const seedPath = join(dirname(fileURLToPath(import.meta.url)), '../../data/songs.seed.json');

let cache: SeedSong[] | null = null;

export function clearSongSeedCache(): void {
  cache = null;
}

export function loadSongSeed(): SeedSong[] {
  if (cache) return cache;
  const raw = JSON.parse(readFileSync(seedPath, 'utf-8')) as SongSeedFile;
  if (raw.version !== 2) {
    throw new Error(`Unsupported songs.seed.json version: ${raw.version}`);
  }
  cache = raw.songs;
  return cache;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- src/lib/songSeedLoader.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/songSeedLoader.ts backend/src/lib/songSeedLoader.test.ts
git commit -m "feat: add song seed loader with v2 cache"
```

---

### Task 2: Rule engine (extract from preview script)

**Files:**
- Create: `backend/src/services/recommendationRuleEngine.ts`
- Create: `backend/src/services/recommendationRuleEngine.test.ts`
- Modify: `backend/scripts/preview-recommendations.ts` — import from service (keep CLI working)

**Interfaces:**
- Consumes: `SeedSong` from `seedSong.ts`
- Produces:

```typescript
export interface RuleEngineMember {
  displayName: string;
  instrument: 'GUITAR' | 'BASS' | 'DRUMS' | 'VOCALS' | 'KEYBOARD' | 'OTHER';
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

export function scoreCandidates(
  songs: SeedSong[],
  input: RuleEngineInput,
): ScoredCandidate[];

export function rankCandidates(candidates: ScoredCandidate[]): ScoredCandidate[];
```

Implementation: move `assignCoverage`, `evaluateSong`, `filterAndRank`, `styleScore`, `formatArrangement`, `formatParts` logic from `preview-recommendations.ts` into this module. Export `PART_LABELS` internally; use `FALLBACK_LABELS` from `seedSong.ts`.

- [ ] **Step 1: Write failing tests**

```typescript
// backend/src/services/recommendationRuleEngine.test.ts
import { describe, it, expect } from 'vitest';
import { loadSongSeed } from '../lib/songSeedLoader.js';
import { scoreCandidates, rankCandidates } from './recommendationRuleEngine.js';

const newbieBand = {
  stylePreferences: ['rock', 'pop', 'folk'],
  members: [
    { displayName: '阿杰', instrument: 'GUITAR' as const, skillLevel: 2 },
    { displayName: '大伟', instrument: 'BASS' as const, skillLevel: 2 },
    { displayName: '小雨', instrument: 'DRUMS' as const, skillLevel: 2 },
    { displayName: '小美', instrument: 'VOCALS' as const, skillLevel: 2 },
  ],
};

describe('recommendationRuleEngine', () => {
  it('returns candidates for a newbie rock band', () => {
    const scored = rankCandidates(scoreCandidates(loadSongSeed(), newbieBand));
    expect(scored.length).toBeGreaterThan(10);
    expect(scored.some((c) => c.song.title === '平凡之路')).toBe(true);
  });

  it('excludes songs above skill level', () => {
    const scored = rankCandidates(
      scoreCandidates(loadSongSeed(), {
        stylePreferences: ['rock'],
        members: [
          { displayName: 'A', instrument: 'GUITAR', skillLevel: 1 },
          { displayName: 'B', instrument: 'BASS', skillLevel: 1 },
          { displayName: 'C', instrument: 'DRUMS', skillLevel: 1 },
          { displayName: 'D', instrument: 'VOCALS', skillLevel: 1 },
        ],
      }),
    );
    expect(scored.some((c) => c.song.title === 'Stairway to Heaven')).toBe(false);
  });

  it('adds program hint when band has one guitarist and song wants two', () => {
    const indie = {
      stylePreferences: ['indie', 'rock'],
      members: [
        { displayName: '老陈', instrument: 'GUITAR' as const, skillLevel: 4 },
        { displayName: '阿贝', instrument: 'BASS' as const, skillLevel: 3 },
        { displayName: '鼓王', instrument: 'DRUMS' as const, skillLevel: 4 },
        { displayName: '主唱', instrument: 'VOCALS' as const, skillLevel: 3 },
      ],
    };
    const hotel = rankCandidates(scoreCandidates(loadSongSeed(), indie)).find(
      (c) => c.song.title === 'Hotel California',
    );
    expect(hotel).toBeDefined();
    expect(hotel!.arrangementHints.length + hotel!.programHints.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd backend && npm test -- src/services/recommendationRuleEngine.test.ts`

- [ ] **Step 3: Implement `recommendationRuleEngine.ts`**

Port logic from `backend/scripts/preview-recommendations.ts` lines 79–193. Rename `gaps` → `arrangementHints` in `ScoredCandidate`.

- [ ] **Step 4: Refactor preview script to import service**

```typescript
// backend/scripts/preview-recommendations.ts (top imports)
import { loadSongSeed } from '../src/lib/songSeedLoader.js';
import { scoreCandidates, rankCandidates } from '../src/services/recommendationRuleEngine.js';
// replace inline filterAndRank calls with rankCandidates(scoreCandidates(...))
```

Run: `cd backend && npm run preview:recommendations -- band-newbie-rock` — output should match previous behavior.

- [ ] **Step 5: Run tests — expect PASS**

Run: `cd backend && npm test -- src/services/recommendationRuleEngine.test.ts`

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/recommendationRuleEngine.ts \
        backend/src/services/recommendationRuleEngine.test.ts \
        backend/scripts/preview-recommendations.ts
git commit -m "feat: extract recommendation rule engine from preview script"
```

---

### Task 3: Formatter + band profile mapper

**Files:**
- Create: `backend/src/services/recommendationFormatter.ts`
- Create: `backend/src/services/bandProfileForRecommend.ts`

**Interfaces:**
- Consumes: `ScoredCandidate`, `SeedSong`
- Produces:

```typescript
// recommendationFormatter.ts
export function buildNeteaseSearchUrl(title: string, artist: string): string;
export function formatArrangementSummary(song: SeedSong): string;
export function formatPartsSummary(song: SeedSong): string;
export function buildFallbackReason(
  candidate: ScoredCandidate,
  bandName: string,
): string;

// bandProfileForRecommend.ts
import type { RuleEngineInput } from './recommendationRuleEngine.js';

type BandWithMembers = Awaited<ReturnType<typeof import('./bandService.js').getBand>>;

export function bandToRuleEngineInput(band: BandWithMembers): RuleEngineInput & { bandName: string };
```

`buildFallbackReason` example output:

```text
适合「车库新手队」排练：风格匹配，全员 skill 达标；注意编制提示中的可选声部。
```

- [ ] **Step 1: Write failing test for formatter**

```typescript
// backend/src/services/recommendationFormatter.test.ts
import { describe, it, expect } from 'vitest';
import { loadSongSeed } from '../lib/songSeedLoader.js';
import { buildNeteaseSearchUrl, formatArrangementSummary, formatPartsSummary } from './recommendationFormatter.js';

describe('recommendationFormatter', () => {
  const song = loadSongSeed().find((s) => s.id === 'song-001')!;

  it('builds netease search url', () => {
    expect(buildNeteaseSearchUrl('平凡之路', '朴树')).toContain(encodeURIComponent('平凡之路'));
  });

  it('formats arrangement and parts summaries', () => {
    expect(formatArrangementSummary(song)).toContain('主唱');
    expect(formatPartsSummary(song)).toContain('节奏吉他');
  });
});
```

- [ ] **Step 2: Implement formatter + band mapper**

`bandToRuleEngineInput` maps:
- `band.stylePreferences ?? []` → `stylePreferences` (parse JSON array from Prisma)
- each member → `{ displayName: user.displayName, instrument, skillLevel }`

- [ ] **Step 3: Run tests — expect PASS**

Run: `cd backend && npm test -- src/services/recommendationFormatter.test.ts`

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/recommendationFormatter.ts \
        backend/src/services/recommendationFormatter.test.ts \
        backend/src/services/bandProfileForRecommend.ts
git commit -m "feat: add recommendation formatter and band profile mapper"
```

---

### Task 4: Recommendation orchestrator + API route

**Files:**
- Create: `backend/src/services/recommendationService.ts`
- Modify: `backend/src/types/song.ts`
- Modify: `backend/src/routes/songs.ts`
- Modify: `backend/src/config/features.ts` — `SONG_RECOMMENDATION: true`

**Interfaces:**
- Produces:

```typescript
// recommendationService.ts
export async function getRecommendationsForBand(
  bandId: string,
  userId: string,
): Promise<RecommendationResponse>;
```

Flow inside `getRecommendationsForBand`:
1. If `!FEATURES.SONG_RECOMMENDATION` → `{ status: 'coming_soon', songs: [], message: '...' }`
2. `bandService.getBand(bandId, userId)`
3. `bandToRuleEngineInput(band)`
4. `rankCandidates(scoreCandidates(loadSongSeed(), input)).slice(0, RECOMMEND_CANDIDATE_POOL)`
5. If pool empty → `{ status: 'empty', songs: [], message: '暂无匹配曲目，试试调整乐队风格或完善成员资料' }`
6. Call `pickRecommendationsWithAi(pool, bandContext)` (Task 5) or interim rule-only pick
7. Map to `RecommendedSong[]` → `{ status: 'ok', songs }`

Interim rule-only pick (implement in Task 4 before AI):

```typescript
function pickTopRuleOnly(candidates: ScoredCandidate[], bandName: string, count: number): RecommendedSong[] {
  return candidates.slice(0, count).map((c) => ({
    id: c.song.id,
    title: c.song.title,
    artist: c.song.artist,
    style: c.song.style,
    bpm: c.song.bpm,
    arrangementSummary: formatArrangementSummary(c.song),
    partsSummary: formatPartsSummary(c.song),
    reason: buildFallbackReason(c, bandName),
    arrangementHints: c.arrangementHints,
    programHints: c.programHints,
    listenUrl: buildNeteaseSearchUrl(c.song.title, c.song.artist),
  }));
}
```

- [ ] **Step 1: Update types**

```typescript
// backend/src/types/song.ts
export interface RecommendedSong {
  id: string;
  title: string;
  artist: string;
  style: string;
  bpm?: number;
  arrangementSummary: string;
  partsSummary: string;
  reason: string;
  arrangementHints: string[];
  programHints: string[];
  listenUrl: string;
}

export interface RecommendationResponse {
  status: 'coming_soon' | 'ok' | 'empty';
  songs: RecommendedSong[];
  message?: string;
}
```

- [ ] **Step 2: Implement recommendationService with rule-only pick**

- [ ] **Step 3: Wire route**

```typescript
// backend/src/routes/songs.ts
app.get('/songs/recommend', { preHandler: authenticate }, async (request, reply) => {
  const { bandId } = request.query as { bandId?: string };
  if (!bandId) {
    return reply.status(400).send({
      error: { code: 'VALIDATION_ERROR', message: '请提供 bandId' },
    });
  }
  try {
    return await getRecommendationsForBand(bandId, request.userId!);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode === 403) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: e.message } });
    }
    throw err;
  }
});
```

- [ ] **Step 4: Manual API test**

Run backend: `cd backend && npm run dev`

```bash
# login first, then:
curl -s -b cookies.txt "http://localhost:3000/songs/recommend?bandId=<YOUR_BAND_ID>" | jq .
```

Expected: `{ "status": "ok", "songs": [ ...6 items ] }`

- [ ] **Step 5: Set feature flag**

```typescript
// backend/src/config/features.ts
export const FEATURES = {
  SONG_RECOMMENDATION: true,
} as const;
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/recommendationService.ts \
        backend/src/types/song.ts \
        backend/src/routes/songs.ts \
        backend/src/config/features.ts
git commit -m "feat: wire song recommendation API with rule-only fallback"
```

---

### Task 5: AI recommendation service (optional key)

**Files:**
- Create: `backend/src/services/recommendationAiService.ts`
- Modify: `backend/.env.example`
- Modify: `backend/src/services/recommendationService.ts` — call AI when key present

**Interfaces:**

```typescript
export interface AiPickInput {
  bandName: string;
  stylePreferences: string[];
  members: RuleEngineMember[];
  candidates: ScoredCandidate[]; // max 30
}

export interface AiPickResult {
  picks: { songId: string; reason: string }[];
}

export async function pickRecommendationsWithAi(
  input: AiPickInput,
): Promise<AiPickResult | null>;
// returns null when OPENAI_API_KEY unset → caller uses rule-only
```

- [ ] **Step 1: Add env vars**

```bash
# backend/.env.example
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
```

- [ ] **Step 2: Implement AI service**

Use `fetch('https://api.openai.com/v1/chat/completions', ...)`. System prompt (中文):

```text
你是 BandMate 乐队排练顾问。只能从 candidates 列表中选歌，禁止推荐列表外的歌名。
根据乐队编制、skill level、风格偏好，选 6 首并各写 1–2 句中文推荐理由。
可提及 program 建议。输出 JSON：{"picks":[{"songId":"song-001","reason":"..."}]}
```

User message: JSON.stringify `{ bandName, stylePreferences, members, candidates: candidates.map(c => ({ id, title, artist, arrangementSummary, partsSummary, arrangementHints, programHints })) }`

Parse response; validate every `songId` exists in candidates; on parse/validation failure → return `null` (fallback to rule-only).

- [ ] **Step 3: Integrate in recommendationService**

```typescript
const ai = await pickRecommendationsWithAi({ ... });
if (ai) {
  return ai.picks
    .map((p) => {
      const c = pool.find((x) => x.song.id === p.songId);
      if (!c) return null;
      return { ...mapCandidateToRecommendedSong(c), reason: p.reason };
    })
    .filter(Boolean);
}
return pickTopRuleOnly(pool, bandName, RECOMMEND_PICK_COUNT);
```

- [ ] **Step 4: Manual test with key**

Set `OPENAI_API_KEY` in `.env`, hit API, verify reasons are personalized Chinese text.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/recommendationAiService.ts \
        backend/src/services/recommendationService.ts \
        backend/.env.example
git commit -m "feat: add optional OpenAI song recommendation copy"
```

---

### Task 6: Frontend types + recommendation cards

**Files:**
- Modify: `frontend/src/types/song.ts`
- Create: `frontend/src/components/songs/RecommendationCard.tsx`
- Modify: `frontend/src/pages/SongRecommend.tsx`
- Modify: `frontend/src/config/features.ts` — `SONG_RECOMMENDATION: true`

**Interfaces:**
- Consumes: `RecommendationResponse` from API (same shape as backend)

- [ ] **Step 1: Sync frontend types** — copy `RecommendedSong` + updated `RecommendationResponse` from backend.

- [ ] **Step 2: Create RecommendationCard**

```tsx
// frontend/src/components/songs/RecommendationCard.tsx
import type { RecommendedSong } from '../../types/song';

export function RecommendationCard({ song }: { song: RecommendedSong }) {
  return (
    <article className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3">
      <header>
        <h3 className="text-lg font-semibold">{song.title}</h3>
        <p className="text-sm text-slate-400">{song.artist}</p>
      </header>
      <p className="text-sm text-slate-300">{song.reason}</p>
      <dl className="grid gap-1 text-xs text-slate-400">
        <div><dt className="inline text-slate-500">编制 · </dt><dd className="inline">{song.arrangementSummary}</dd></div>
        <div><dt className="inline text-slate-500">难度 · </dt><dd className="inline">{song.partsSummary}{song.bpm ? ` · ${song.bpm} BPM` : ''}</dd></div>
      </dl>
      {song.arrangementHints.length > 0 && (
        <p className="text-xs text-amber-200/90">编制提示：{song.arrangementHints.join('；')}</p>
      )}
      {song.programHints.length > 0 && (
        <p className="text-xs text-sky-200/90">Program 建议：{song.programHints.join('；')}</p>
      )}
      <a
        href={song.listenUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex text-sm text-accent-400 hover:underline"
      >
        去网易云搜索
      </a>
    </article>
  );
}
```

- [ ] **Step 3: Rewrite SongRecommend page**

Remove `badge-stamp`「即将上线」、disabled filters. States:
- loading spinner
- `status === 'empty'` → empty state with message
- `status === 'ok'` → grid of `RecommendationCard`
- error toast on fetch failure

Keep `BandPicker` when multiple bands.

- [ ] **Step 4: Enable frontend feature flag**

```typescript
// frontend/src/config/features.ts
export const FEATURES = {
  SONG_RECOMMENDATION: true,
} as const;
```

- [ ] **Step 5: Manual UI test**

Run frontend + backend, open `/songs`, verify 6 cards with 去网易云搜索 links.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/song.ts \
        frontend/src/components/songs/RecommendationCard.tsx \
        frontend/src/pages/SongRecommend.tsx \
        frontend/src/config/features.ts
git commit -m "feat: show song recommendation cards on /songs"
```

---

### Task 7: Docs + README touch-up

**Files:**
- Modify: `README.md` — Phase 2 song recommendation bullet
- Modify: `backend/data/README.md` — note seed is loaded at runtime by API

- [ ] **Step 1: Update README Phase features list**

Add under Phase 2:
- Song recommendations (rule engine + optional AI copy)
- Seed library v2 in `backend/data/`

- [ ] **Step 2: Commit**

```bash
git add README.md backend/data/README.md
git commit -m "docs: document Phase 2 song recommendation feature"
```

---

## Execution Order Summary

| Task | Delivers | Depends on |
|------|----------|------------|
| 1 Seed loader | JSON cache | — |
| 2 Rule engine | tested scoring | 1 |
| 3 Formatter + band mapper | summaries | 2 |
| 4 API + rule-only MVP | **working endpoint** | 1–3 |
| 5 AI service | personalized copy | 4 |
| 6 Frontend | **visible cards** | 4 |
| 7 Docs | mentor-readable | 6 |

**Minimum shippable demo:** Tasks 1–4 + 6 (AI optional in Task 5).

---

## Out of Scope (explicit)

- Prisma `Song` model / admin CRUD for songs
- In-app keyword search / filters on `/songs`
- Separate “AI search” navigation entry
- Caching AI responses per band (24h) — add later if needed
- Email reminders, metronome (already done), anti-cheat

---

## Self-Review Checklist

| Spec requirement | Task |
|------------------|------|
| Seed v2 arrangement/parts/fallbacks | existing + Task 1 loader |
| Rule engine filters by band | Task 2 |
| AI only from candidates | Task 5 prompt + validation |
| Program hints on cards | Task 2 hints → Task 6 UI |
| NetEase external link | Task 3 formatter → Task 6 |
| Graceful no-AI fallback | Task 4 + 5 |
| Chinese UI copy | Task 6 |
| Feature flag | Task 4 + 6 |

No placeholders remain — all tasks have concrete paths, signatures, and test commands.
