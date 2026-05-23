const fs = require("fs");
const path = require("path");

const CACHE_PATH = path.join(__dirname, "../assets/ipa-cache-b2.json");
const VOCS_PATH = path.join(__dirname, "../assets/vocs.ts");
const DELAY_MS = 350;

function formatIpa(phonetic) {
  if (!phonetic) return null;
  let s = phonetic.trim().replace(/^\/+|\/+$/g, "");
  s = s.replace(/ˈ/g, "'");
  s = s.replace(/ˌ/g, ",");
  s = s.replace(/\./g, "");
  s = s.replace(/\(([^)]+)\)/g, "$1");
  return `[${s}]`;
}

async function lookupWord(word, attempt = 1) {
  const clean = word.split(/[;/,]/)[0].trim().toLowerCase();
  try {
    const r = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`
    );
    if (r.status === 429 && attempt < 5) {
      await sleep(2000 * attempt);
      return lookupWord(word, attempt + 1);
    }
    if (!r.ok) return null;
    const data = await r.json();
    const entry = data[0];
    const withAudio = entry.phonetics?.find((p) => p.text && p.audio);
    const withText = entry.phonetics?.find((p) => p.text);
    const raw = withAudio?.text || withText?.text || entry.phonetic || null;
    return formatIpa(raw);
  } catch {
    if (attempt < 3) {
      await sleep(1000);
      return lookupWord(word, attempt + 1);
    }
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function injectIpa(content, cache) {
  const start = content.indexOf("export const new_vocs");
  const end = content.indexOf("export const vocs");
  const before = content.slice(0, start);
  let block = content.slice(start, end);
  const after = content.slice(end);

  block = block.replace(
    /voc:\s*"([^"]+)",[\s\S]*?ipa:\s*"\[\?\]",[\s\S]*?category:/g,
    (full, word) => {
      const ipa = cache[word];
      if (!ipa || ipa === "[?]") return full;
      return full.replace(/ipa:\s*"\[\?\]"/, `ipa: "${ipa}"`);
    }
  );

  block = block.replace(
    /voc:\s*"([^"]+)",[\s\S]*?meaning:\s*"((?:\\.|[^"\\])*)",\n(\s*)(category:)/g,
    (full, word, meaning, indent) => {
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
  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  const missing = Object.keys(cache).filter((w) => cache[w] === "[?]");
  console.log(`Retrying ${missing.length} words...`);

  for (let i = 0; i < missing.length; i++) {
    const word = missing[i];
    const ipa = await lookupWord(word);
    if (ipa) {
      cache[word] = ipa;
      console.log(`${i + 1}/${missing.length} ${word} -> ${ipa}`);
    }
    if ((i + 1) % 20 === 0) {
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    }
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  const content = fs.readFileSync(VOCS_PATH, "utf8");
  fs.writeFileSync(VOCS_PATH, injectIpa(content, cache));

  const still = Object.values(cache).filter((v) => v === "[?]").length;
  console.log(`Done. Still missing: ${still}`);
}

main();
