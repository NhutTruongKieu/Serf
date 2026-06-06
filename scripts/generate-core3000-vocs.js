/**
 * Generate assets/vocs-learning-core3000.ts from Oxford 3000 JSON.
 * Mặc định chỉ lấy từ đã có trong vocs/vocs2/animals/extra (không tải thêm).
 *
 * Run: node scripts/generate-core3000-vocs.js
 *      node scripts/generate-core3000-vocs.js --all  (gồm cả từ chưa có media)
 *      node scripts/generate-core3000-vocs.js --all --translate
 */

const fs = require("fs");
const path = require("path");
const { resolveImagePath, buildExistingImageIndex, PLACEHOLDER } = require("./core3000-image-utils");

const ROOT = path.join(__dirname, "..");
const OXFORD_PATH = path.join(__dirname, "data/oxford_3000.json");
const VI_CACHE_PATH = path.join(__dirname, "data/core3000-vi-cache.json");
const OUT_PATH = path.join(ROOT, "assets/vocs-learning-core3000.ts");
const PLACEHOLDER_IMG = PLACEHOLDER;

const CEFR_RANK = { a1: 0, a2: 1, b1: 2, b2: 3 };

const VOC_FILES = [
  path.join(ROOT, "assets/vocs.ts"),
  path.join(ROOT, "assets/vocs2.ts"),
  path.join(ROOT, "assets/vocs-learning-animals.ts"),
  path.join(ROOT, "assets/vocs-learning-extra.ts"),
];

const POS_MAP = {
  noun: "n",
  verb: "v",
  adjective: "adj",
  adverb: "adv",
  preposition: "prep",
  conjunction: "conj",
  pronoun: "pron",
  determiner: "det",
  "indefinite article": "det",
  "definite article": "det",
  exclamation: "int",
  "modal verb": "v",
  "ordinal number": "num",
  number: "num",
  "auxiliary verb": "v",
  "linking verb": "v",
  "phrasal verb": "v",
  "combining form": "n",
  abbreviation: "n",
};

function escapeTs(s) {
  return JSON.stringify(s);
}

function parseVocBlocks(content) {
  const entries = [];
  const blockRe = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  let m;
  while ((m = blockRe.exec(content))) {
    const block = m[0];
    if (!block.includes('id: "') || !block.includes('voc: "')) continue;

    const get = (key) => {
      const r = new RegExp(`${key}:\\s*"([^"]*)"`);
      const hit = block.match(r);
      return hit ? hit[1] : undefined;
    };
    const getRaw = (key) => {
      const r = new RegExp(`${key}:\\s*(require\\([^)]+\\))`);
      const hit = block.match(r);
      return hit ? hit[1] : undefined;
    };

    const id = get("id");
    const voc = get("voc");
    const meaning = get("meaning");
    if (!id || !voc || !meaning) continue;

    entries.push({
      id,
      voc,
      pos: get("pos") ?? "n",
      meaning,
      meaningText: get("meaningText"),
      exampleText: get("exampleText"),
      ipa: get("ipa"),
      image: getRaw("image"),
      sound: getRaw("sound"),
      exampleSound: getRaw("exampleSound"),
      meaningSound: getRaw("meaningSound"),
      useDeviceTts: /useDeviceTts:\s*true/.test(block),
    });
  }
  return entries;
}

function buildExistingLookup() {
  const byWord = new Map();
  for (const file of VOC_FILES) {
    if (!fs.existsSync(file)) continue;
    for (const e of parseVocBlocks(fs.readFileSync(file, "utf8"))) {
      const key = e.voc.toLowerCase().trim();
      const prev = byWord.get(key);
      if (!prev || (e.image && !prev.image) || (e.sound && !prev.sound)) {
        byWord.set(key, e);
      }
    }
  }
  return byWord;
}

function mapPos(oxType) {
  const t = (oxType || "").toLowerCase();
  return POS_MAP[t] ?? t.split(/\s+/)[0]?.slice(0, 4) ?? "n";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateWord(word) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate ${word}: ${res.status}`);
  const data = await res.json();
  return data[0]?.[0]?.[0] ?? word;
}

async function fillViCache(entries, cache, doTranslate) {
  const words = [...new Set(entries.map((e) => e.word.toLowerCase()))];
  let added = 0;
  for (const word of words) {
    if (cache[word]) continue;
    if (!doTranslate) {
      cache[word] = null;
      continue;
    }
    try {
      cache[word] = await translateWord(word);
      added++;
      if (added % 50 === 0) {
        fs.writeFileSync(VI_CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
        console.log(`  translated ${added}…`);
      }
      await sleep(120);
    } catch (err) {
      console.warn(`  skip "${word}":`, err.message);
      cache[word] = word;
    }
  }
  fs.writeFileSync(VI_CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
  return cache;
}

function requirePath(raw) {
  if (!raw) return PLACEHOLDER_IMG;
  const m = String(raw).match(/require\("([^"]+)"\)/);
  return m ? m[1] : PLACEHOLDER_IMG;
}

/** Giữ một mục / từ — ưu tiên có audio, ảnh thật, CEFR thấp hơn. */
function scoreRow(row) {
  let s = 0;
  if (row.sound) s += 100;
  if (row.imagePath && row.imagePath !== PLACEHOLDER_IMG) s += 50;
  s -= (CEFR_RANK[row.setGroup] ?? 2) * 10;
  return s;
}

function dedupeByWord(rows) {
  const best = new Map();
  for (const row of rows) {
    const key = row.voc.toLowerCase();
    const prev = best.get(key);
    if (!prev || scoreRow(row) > scoreRow(prev)) best.set(key, row);
  }
  return [...best.values()].sort((a, b) => a.voc.localeCompare(b.voc));
}

function emitEntry(row, idx) {
  const lines = [
    `  {`,
    `    id: "CORE3000_${String(idx).padStart(4, "0")}",`,
    `    voc: ${escapeTs(row.voc)},`,
    `    pos: ${escapeTs(row.pos)},`,
    `    meaning: ${escapeTs(row.meaning)},`,
  ];
  if (row.meaningText) lines.push(`    meaningText: ${escapeTs(row.meaningText)},`);
  if (row.exampleText) lines.push(`    exampleText: ${escapeTs(row.exampleText)},`);
  if (row.ipa) lines.push(`    ipa: ${escapeTs(row.ipa)},`);
  lines.push(`    category: "Core 3000",`);
  lines.push(`    setGroup: ${escapeTs(row.setGroup)},`);
  lines.push(`    image: require("${row.imagePath}"),`);
  if (row.sound) lines.push(`    sound: ${row.sound},`);
  if (row.exampleSound) lines.push(`    exampleSound: ${row.exampleSound},`);
  if (row.meaningSound) lines.push(`    meaningSound: ${row.meaningSound},`);
  if (row.useDeviceTts) lines.push(`    useDeviceTts: true,`);
  lines.push(`  }`);
  return lines.join("\n");
}

async function main() {
  const includeAll = process.argv.includes("--all");
  const existingOnly = !includeAll;
  const doTranslate = process.argv.includes("--translate");
  if (!fs.existsSync(OXFORD_PATH)) {
    console.error("Missing", OXFORD_PATH, "— download Oxford 3000 JSON first.");
    process.exit(1);
  }

  const oxford = Object.values(JSON.parse(fs.readFileSync(OXFORD_PATH, "utf8")));
  oxford.sort((a, b) => a.word.localeCompare(b.word) || (a.type || "").localeCompare(b.type || ""));

  const existing = buildExistingLookup();
  const imageIndex = buildExistingImageIndex();
  let viCache = fs.existsSync(VI_CACHE_PATH)
    ? JSON.parse(fs.readFileSync(VI_CACHE_PATH, "utf8"))
    : {};

  console.log(
    "Oxford entries:",
    oxford.length,
    "| existing voc lookup:",
    existing.size,
    existingOnly ? "| mode: existing-only" : "| mode: all"
  );
  if (doTranslate && includeAll) {
    console.log("Translating missing Vietnamese meanings…");
    viCache = await fillViCache(oxford, viCache, true);
  }

  const rawRows = [];
  let matchedMedia = 0;
  let matchedMeaning = 0;
  let skippedNoExisting = 0;

  for (let i = 0; i < oxford.length; i++) {
    const e = oxford[i];
    const key = e.word.toLowerCase();
    const prev = existing.get(key);
    if (existingOnly && !prev) {
      skippedNoExisting++;
      continue;
    }
    const cefr = (e.cefr || "b1").toLowerCase();

    let meaning = prev?.meaning;
    if (meaning) matchedMeaning++;
    else if (viCache[key]) meaning = viCache[key];
    else meaning = e.definition?.split(/[.;]/)[0]?.trim() || e.word;

    const imagePath =
      (prev?.image && requirePath(prev.image)) ||
      resolveImagePath(e.word, imageIndex);

    const row = {
      voc: e.word,
      pos: prev?.pos ?? mapPos(e.type),
      meaning,
      meaningText: prev?.meaningText ?? e.definition,
      exampleText:
        prev?.exampleText ??
        (e.example?.replace(/^[^,]+,\s*/, "") || e.example),
      ipa: prev?.ipa ?? e.phon_n_am ?? e.phon_br,
      setGroup: cefr,
      imagePath,
      sound: prev?.sound,
      exampleSound: prev?.exampleSound,
      meaningSound: prev?.meaningSound,
      useDeviceTts: !prev?.sound,
    };

    if (imagePath !== PLACEHOLDER_IMG) matchedMedia++;
    rawRows.push(row);
  }

  const rows = dedupeByWord(rawRows);
  const dropped = rawRows.length - rows.length;

  const chunks = rows.map((r, i) => emitEntry(r, i + 1));
  const content = `import type { Vocabulary } from "@/lib/vocab-types";

/** Oxford 3000 (từ đã có sẵn) — node scripts/generate-core3000-vocs.js */
export const core3000LearningVocs: Vocabulary[] = [
${chunks.join(",\n")},
];
`;

  fs.writeFileSync(OUT_PATH, content, "utf8");
  console.log("Wrote", OUT_PATH);
  console.log("  entries:", rows.length, `(removed ${dropped} duplicate words)`);
  console.log("  matched VI from existing:", matchedMeaning);
  console.log("  matched media:", matchedMedia);
  if (existingOnly) {
    console.log("  skipped (no existing entry):", skippedNoExisting);
  }
  const missingVi = rows.filter(
    (r) => !existing.get(r.voc.toLowerCase())?.meaning && !viCache[r.voc.toLowerCase()]
  );
  if (missingVi.length && !doTranslate) {
    console.log(`  ${missingVi.length} entries use English fallback — run with --translate to fetch VI`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
