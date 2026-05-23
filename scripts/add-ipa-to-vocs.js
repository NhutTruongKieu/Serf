/**
 * Fetches IPA for entries in assets/vocs.ts (new_vocs) and inserts ipa fields.
 * Run: node scripts/add-ipa-to-vocs.js
 */

const fs = require("fs");
const path = require("path");

const VOCS_PATH = path.join(__dirname, "../assets/vocs.ts");
const CACHE_PATH = path.join(__dirname, "../assets/ipa-cache-b2.json");
const DELAY_MS = 120;

function formatIpa(phonetic) {
  if (!phonetic) return null;
  let s = phonetic.trim().replace(/^\/+|\/+$/g, "");
  s = s.replace(/ˈ/g, "'");
  s = s.replace(/ˌ/g, ",");
  s = s.replace(/\./g, "");
  s = s.replace(/\(([^)]+)\)/g, "$1");
  return `[${s}]`;
}

function lookupWord(word) {
  const clean = word.split(/[;/,]/)[0].trim().toLowerCase();
  return fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data?.[0]) return null;
      const entry = data[0];
      const withAudio = entry.phonetics?.find((p) => p.text && p.audio);
      const withText = entry.phonetics?.find((p) => p.text);
      const raw =
        withAudio?.text || withText?.text || entry.phonetic || null;
      return formatIpa(raw);
    })
    .catch(() => null);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractWords(content) {
  const words = [];
  const re = /voc:\s*"([^"]+)"/g;
  let m;
  const start = content.indexOf("export const new_vocs");
  const end = content.indexOf("export const vocs");
  const slice = content.slice(start, end);
  while ((m = re.exec(slice))) {
    words.push(m[1]);
  }
  return [...new Set(words)];
}

async function buildCache(words, cache) {
  const missing = words.filter((w) => !cache[w]);
  console.log(`Need IPA for ${missing.length} / ${words.length} words`);

  for (let i = 0; i < missing.length; i++) {
    const word = missing[i];
    const ipa = await lookupWord(word);
    cache[word] = ipa || "[?]";
    if ((i + 1) % 25 === 0 || i === missing.length -  1) {
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
      console.log(`  ${i + 1}/${missing.length}: ${word} -> ${cache[word]}`);
    }
    await sleep(DELAY_MS);
  }
  return cache;
}

function injectIpa(content, cache) {
  const start = content.indexOf("export const new_vocs");
  const end = content.indexOf("export const vocs");
  const before = content.slice(0, start);
  let block = content.slice(start, end);
  const after = content.slice(end);

  block = block.replace(
    /voc:\s*"([^"]+)",[\s\S]*?meaning:\s*"((?:\\.|[^"\\])*)",\n(\s*)(category:)/g,
    (full, word, meaning, indent, categoryKey) => {
      if (full.includes("ipa:")) return full;
      const ipa = cache[word] || "[?]";
      return full.replace(
        /meaning:\s*"(?:\\.|[^"\\])*",\n/,
        `meaning: "${meaning}",\n${indent}ipa: "${ipa}",\n`
      );
    }
  );

  return before + block + after;
}

async function main() {
  const content = fs.readFileSync(VOCS_PATH, "utf8");
  const words = extractWords(content);
  let cache = {};
  if (fs.existsSync(CACHE_PATH)) {
    cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  }

  cache = await buildCache(words, cache);
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

  const updated = injectIpa(content, cache);
  fs.writeFileSync(VOCS_PATH, updated);

  const missing = words.filter((w) => cache[w] === "[?]");
  console.log(`Done. ${words.length} words, ${missing.length} without IPA.`);
  if (missing.length) {
    console.log("Missing:", missing.slice(0, 20).join(", "), "...");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
