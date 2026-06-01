/**
 * Dọn ký tự lạ trong meaning / meaningText / exampleText của vocs.ts & vocs2.ts.
 * Run: node scripts/clean-vocab-texts.js
 */

const fs = require("fs");
const path = require("path");

const FILES = [
  path.join(__dirname, "../assets/vocs.ts"),
  path.join(__dirname, "../assets/vocs2.ts"),
];

function cleanText(raw) {
  let s = raw;
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<div>/gi, "; ");
  s = s.replace(/<\/div>/gi, "");
  s = s.replace(/<\/?[a-z][^>]*>/gi, "");
  s = s.replace(/&nbsp;?/gi, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  s = s.replace(/\{\{c\d+::([^}]+)\}\}/g, "$1");
  // Bỏ phần từ điển Anh-Việt dính sau câu ví dụ Anki
  s = s.replace(/\s*\([A-Z]\d\)\s.*$/i, "");
  s = s.replace(/\s+Example:\s.*$/i, "");
  s = s.replace(/\s+[a-z /]+:\s+[à-ỹÀ-Ỹ].*$/i, "");
  s = s.replace(/\s+reward\s+\/[^.]+\/:.*$/i, "");
  s = s.replace(/\s+/g, " ");
  s = s.replace(/\s*,\s*/g, ", ");
  s = s.replace(/\s*;\s*/g, "; ");
  s = s.replace(/;\s*;/g, ";");
  s = s.replace(/,\s*;/g, ";");
  return s.trim();
}

function cleanQuotedMeaningLines(content) {
  return content.replace(
    /^(\s*meaning:\s*)'((?:\\'|[^'])*)',/gm,
    (_, prefix, val) => `${prefix}${JSON.stringify(cleanText(val))},`
  );
}

function cleanDoubleQuotedFields(content) {
  return content.replace(
    /(meaning|meaningText|exampleText|ipa):\s*"((?:\\.|[^"\\])*)"/g,
    (full, field, val) => {
      const decoded = val
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
      const cleaned = cleanText(decoded);
      if (cleaned === decoded) return full;
      return `${field}: ${JSON.stringify(cleaned)}`;
    }
  );
}

for (const file of FILES) {
  let content = fs.readFileSync(file, "utf8");
  const before = content;
  content = cleanQuotedMeaningLines(content);
  content = cleanDoubleQuotedFields(content);
  if (content !== before) {
    fs.writeFileSync(file, content, "utf8");
    console.log("Cleaned:", path.basename(file));
  } else {
    console.log("No changes:", path.basename(file));
  }
}
