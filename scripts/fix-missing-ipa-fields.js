const fs = require("fs");
const path = require("path");

const VOCS_PATH = path.join(__dirname, "../assets/vocs.ts");
const CACHE_PATH = path.join(__dirname, "../assets/ipa-cache-b2.json");

const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
let content = fs.readFileSync(VOCS_PATH, "utf8");

const start = content.indexOf("export const new_vocs");
const end = content.indexOf("export const vocs");
let block = content.slice(start, end);

function addIpaAfterMeaning(full, word, meaning, indent, nextKey) {
  if (full.includes("ipa:")) return full;
  const ipa = cache[word] || "[?]";
  return full.replace(
    /meaning:\s*"(?:\\.|[^"\\])*",\n/,
    `meaning: "${meaning}",\n${indent}ipa: "${ipa}",\n${indent}${nextKey}`
  ).replace(
    new RegExp(`meaning: "${meaning.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",\\n\\s*${nextKey}`),
    `meaning: "${meaning}",\n${indent}ipa: "${ipa}",\n${indent}${nextKey}`
  );
}

block = block.replace(
  /voc:\s*"([^"]+)",[\s\S]*?meaning:\s*"((?:\\.|[^"\\])*)",\n(\s*)(category:|image:)/g,
  (full, word, meaning, indent, nextKey) =>
    addIpaAfterMeaning(full, word, meaning, indent, nextKey)
);

block = block.replace(/ipa: "\[\?]"/g, (_, offset) => {
  return 'ipa: "[?]"';
});

block = block.replace(/ipa: "\[\[\]/g, 'ipa: "[');

block = block.replace(
  /voc:\s*"([^"]+)",[\s\S]*?ipa:\s*"\[\?\]"/g,
  (full, word) => {
    const ipa = cache[word];
    if (!ipa || ipa === "[?]") return full;
    return full.replace(/ipa:\s*"\[\?\]"/, `ipa: "${ipa}"`);
  }
);

content = content.slice(0, start) + block + content.slice(end);
fs.writeFileSync(VOCS_PATH, content);

const left = (content.match(/ipa: "\[\?\]"/g) || []).length;
const total = (content.slice(start, end).match(/ipa:/g) || []).length;
const vocs = (content.slice(start, end).match(/voc:/g) || []).length;
console.log(`ipa fields: ${total}/${vocs}, [?] left: ${left}`);
