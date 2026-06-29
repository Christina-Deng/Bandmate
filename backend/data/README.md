# Phase 2 歌单曲库 Seed（v2）

BandMate 自有曲库，供**规则引擎筛候选** + **AI 写推荐语**。尚未写入 PostgreSQL。

## 文件


| 文件                          | 说明                   |
| --------------------------- | -------------------- |
| `songs.seed.json`           | 曲库数据（v2）             |
| `songs.seed.schema.json`    | JSON Schema 校验       |
| `band-profiles.sample.json` | 预览用虚构乐队              |
| `../src/types/seedSong.ts`  | TypeScript 类型（实现时复用） |


## 命令

```bash
cd backend
npm run validate:seed                 # 校验 v2 一致性
npm run preview:recommendations       # 三个乐队 + 推荐卡片预览
npm run preview:recommendations -- band-newbie-rock
```

---

## v2 结构（三块）

### 1. `arrangement` — 这首歌「完整版」需要什么编制

描述**声部是否存在**，不是难度数字。

```json
"arrangement": {
  "vocals": "required",
  "guitars": { "count": 2, "lead": "required", "rhythm": "required" },
  "bass": "required",
  "drums": "program_ok",
  "keyboard": "none"
}
```


| 字段               | 取值                                                 | 含义             |
| ---------------- | -------------------------------------------------- | -------------- |
| `vocals`         | `required` / `optional` / `instrumental_ok`        | 是否必须主唱         |
| `guitars.count`  | `0` / `1` / `2`                                    | 吉他数量           |
| `guitars.lead`   | `none` / `optional` / `required`                   | 主音吉他           |
| `guitars.rhythm` | `none` / `optional` / `required`                   | 节奏吉他           |
| `bass`           | `required` / `optional` / `none`                   | 贝斯             |
| `drums`          | `required` / `optional` / `program_ok`             | 鼓（可接受 program） |
| `keyboard`       | `none` / `optional_pad` / `important` / `required` | 键盘             |


### 2. `parts` — 各声部最低 skill（1–5）

按**声部角色**标难度，不是按 BandMember 的 `Instrument` 枚举。

```json
"parts": {
  "vocals": { "minLevel": 2 },
  "rhythmGuitar": { "minLevel": 2 },
  "leadGuitar": { "minLevel": 4 },
  "bass": { "minLevel": 3 },
  "drums": { "minLevel": 3 }
}
```

- 只有 `arrangement` 里存在的声部才写 `parts`
- `keyboard: none` 的歌**不要**写 `parts.keyboard`
- 单吉他歌只写 `rhythmGuitar`；双吉他才写 `leadGuitar`

### 3. `fallbacks` — 缺人怎么办（含 Program）

推荐卡片上的「编制提示 / Program 建议」来自这里。

```json
"fallbacks": {
  "missingLeadGuitar": "program_lead",
  "missingRhythmGuitar": "program_rhythm",
  "missingBass": "omit",
  "missingDrums": "program_drums",
  "missingKeyboard": "not_applicable",
  "missingVocals": "not_applicable"
}
```


| 键                   | 常用值                                             | 展示文案           |
| ------------------- | ----------------------------------------------- | -------------- |
| `missingLeadGuitar` | `program_lead` / `combine_into_rhythm` / `omit` | 可用 Program 补主音 |
| `missingDrums`      | `program_drums` / `cajon` / `omit`              | 可用鼓机           |
| `missingKeyboard`   | `program_pad` / `omit`                          | 可用 Pad 铺底      |
| `missingBass`       | `program_bass` / `keyboard_bass` / `omit`       | 可省略或用 program  |


完整枚举见 `seedSong.ts` 与 `FALLBACK_LABELS`。

---

## 完整示例（定稿参考）

```json
{
  "id": "song-020",
  "title": "Hotel California",
  "artist": "Eagles",
  "style": "rock",
  "bpm": 74,
  "notes": "维护者备注，不展示给用户",
  "arrangement": {
    "vocals": "required",
    "guitars": { "count": 2, "lead": "required", "rhythm": "required" },
    "bass": "required",
    "drums": "optional",
    "keyboard": "none"
  },
  "parts": {
    "vocals": { "minLevel": 3 },
    "rhythmGuitar": { "minLevel": 3 },
    "leadGuitar": { "minLevel": 4 },
    "bass": { "minLevel": 3 },
    "drums": { "minLevel": 3 }
  },
  "fallbacks": {
    "missingLeadGuitar": "program_lead",
    "missingRhythmGuitar": "program_rhythm",
    "missingBass": "program_bass",
    "missingDrums": "program_drums",
    "missingKeyboard": "not_applicable",
    "missingVocals": "not_applicable"
  }
}
```

### 对应推荐卡片（运行时）

```
Hotel California — Eagles
编制：需要主唱 · 双吉他 · 要贝斯 · 鼓可用 program · 无需键盘
难度：主唱3 节奏吉他3 主音吉他4 贝斯3 鼓3 · 74 BPM
💬 AI 推荐语：…（结合乐队成员写）
⚠️  编制提示：缺主音吉他 → 可用 Program 补主音吉他
🔗 去网易云搜索
```

---

## 运行时分工（已定）


| 层              | 职责                                          |
| -------------- | ------------------------------------------- |
| **Seed（你们拥有）** | 歌名、风格、`arrangement` / `parts` / `fallbacks` |
| **规则引擎**       | 风格匹配 + skill 够 + 缺声部时有合法 fallback           |
| **AI**         | 从候选 id 里挑 5–8 首，写个性化推荐语                     |
| **前端**         | 卡片展示 + 编制/Program 提示 + 外链搜索                 |


---

## 维护指南

1. 新增歌曲：复制一条 JSON，改 `arrangement` → 只写需要的 `parts` → 填 `fallbacks`
2. 跑 `npm run validate:seed` 确保 `keyboard: none` 时不留 `parts.keyboard` 等
3. `notes` 仅给维护者看；用户看到的是 AI 推荐语 + 结构化提示

v1 的 `minSkillLevel` 已废弃；历史迁移脚本见 `scripts/migrate-seed-v1-to-v2.ts`。