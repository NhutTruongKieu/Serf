/**
 * Trích meaningText + exampleText từ deck Anki 4000 Essential English Words
 * và ghi vào assets/vocs.ts (4000B2) hoặc assets/vocs2.ts (4000B3).
 *
 * Usage:
 *   node scripts/import-anki-texts.js --book 2
 *   node scripts/import-anki-texts.js --book 3 --apkg "C:/path/to/deck.apkg"
 *
 * Mặc định book 2:
 *   C:/Users/Admin/Downloads/anki/4000_Essential_English_Words_2_-_Vietnamese.zip
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BOOK_CONFIG = {
  2: {
    prefix: "4000B2",
    vocFile: path.join(__dirname, "../assets/vocs.ts"),
    defaultApkg:
      "C:/Users/Admin/Downloads/anki/4000_Essential_English_Words_2_-_Vietnamese.zip",
    idField: 0,
    textField: 7,
  },
  3: {
    prefix: "4000B3",
    vocFile: path.join(__dirname, "../assets/vocs2.ts"),
    defaultApkg:
      "C:/Users/Admin/Downloads/anki/4000_Essential_English_Words_3_-_Vietnamese.apkg",
    idField: 1,
    textField: 7,
  },
};

const DEFAULT_ANKI_ROOT = "C:/Users/Admin/Downloads/anki";

function resolveSqlite3(ankiRoot) {
  const candidates = [
    path.join(ankiRoot, "app-convert/node_modules/sqlite3"),
    "sqlite3",
  ];
  for (const mod of candidates) {
    try {
      return require(mod).verbose();
    } catch {
      /* try next */
    }
  }
  throw new Error("Missing sqlite3. Run npm install in anki/app-convert.");
}

function parseArgs() {
  const args = process.argv.slice(2);
  let book = 2;
  let apkg = null;
  let ankiRoot = process.env.ANKI_ROOT || DEFAULT_ANKI_ROOT;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--book") book = Number(args[++i]);
    if (args[i] === "--apkg") apkg = args[++i];
    if (args[i] === "--anki-root") ankiRoot = args[++i];
  }
  const cfg = BOOK_CONFIG[book];
  if (!cfg) {
    console.error("Unsupported --book", book);
    process.exit(1);
  }
  return { ...cfg, apkg: apkg || cfg.defaultApkg, ankiRoot, book };
}

function cleanAnkiText(html) {
  let s = html || "";
  s = s.replace(/\{\{c\d+::([^}]+)\}\}/g, "$1");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&nbsp;?/gi, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  s = s.replace(/\s*\([A-Z]\d\)\s.*$/i, "");
  s = s.replace(/\s+Example:\s.*$/i, "");
  s = s.replace(/\s+[a-z /]+:\s+[à-ỹÀ-Ỹ].*$/i, "");
  s = s.replace(/\s+/g, " ");
  return s.trim();
}

function parseField7(raw) {
  const normalized = (raw || "")
    .replace(/<br\s*\/?>\s*→/gi, " → ")
    .replace(/<\/div>\s*→/gi, " → ");
  const parts = normalized.split(/\s*(?:&nbsp;)?→(?:&nbsp;)?\s*/);
  return {
    meaningText: cleanAnkiText(parts[0] || ""),
    exampleText: cleanAnkiText(parts.slice(1).join(" → ") || ""),
  };
}

function extractDbFromApkg(apkgPath, workDir) {
  fs.mkdirSync(workDir, { recursive: true });
  const dbPath = path.join(workDir, "collection.anki2");
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  execSync(`unzip -qo "${apkgPath}" collection.anki2 -d "${workDir}"`, {
    stdio: "inherit",
  });
  if (!fs.existsSync(dbPath)) {
    throw new Error("collection.anki2 not found in " + apkgPath);
  }
  return dbPath;
}

function loadAnkiTexts(dbPath, prefix, ankiRoot, idField, textField) {
  const sqlite3 = resolveSqlite3(ankiRoot);
  const db = new sqlite3.Database(dbPath);
  const rows = require("util").promisify(db.all.bind(db))(
    "SELECT flds FROM notes"
  );

  return rows.then((notes) => {
    db.close();
    const map = {};
    for (const row of notes) {
      const fields = row.flds.split("\x1f");
      const num = (fields[idField] || "").trim();
      if (!num) continue;
      const id = `${prefix}_${num}`;
      const { meaningText, exampleText } = parseField7(fields[textField]);
      map[id] = { meaningText, exampleText };
    }
    return map;
  });
}

function stripExistingTextFields(lines) {
  return lines.filter(
    (line) =>
      !/^\s*meaningText:/.test(line) && !/^\s*exampleText:/.test(line)
  );
}

function injectAfterMeaning(out, id, map, indentLine) {
  const data = map[id];
  if (!data) return;
  const indent = (indentLine.match(/^(\s*)/) || ["", "    "])[1];
  if (data.meaningText) {
    out.push(`${indent}meaningText: ${JSON.stringify(data.meaningText)},`);
  }
  if (data.exampleText) {
    out.push(`${indent}exampleText: ${JSON.stringify(data.exampleText)},`);
  }
}

function injectTexts(content, prefix, map) {
  const lines = stripExistingTextFields(content.split("\n"));
  const out = [];
  let currentId = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idMatch = line.match(new RegExp(`id: "(${prefix}_\\d+)"`));
    if (idMatch) currentId = idMatch[1];

    out.push(line);

    if (!currentId) continue;

    if (/^\s*meaning:\s*"/.test(line) && /",\s*$/.test(line)) {
      injectAfterMeaning(out, currentId, map, line);
      currentId = null;
      continue;
    }

    if (/^\s*meaning:\s*'/.test(line) && /',\s*$/.test(line)) {
      injectAfterMeaning(out, currentId, map, line);
      currentId = null;
      continue;
    }

    if (/^\s*meaning:\s*$/.test(line)) {
      let j = i + 1;
      while (j < lines.length && !/',\s*$|",\s*$/.test(lines[j])) {
        out.push(lines[j]);
        j++;
      }
      if (j < lines.length) {
        out.push(lines[j]);
        i = j;
        injectAfterMeaning(out, currentId, map, lines[j]);
      }
      currentId = null;
    }
  }

  return out.join("\n");
}

async function main() {
  const { prefix, vocFile, apkg, ankiRoot, idField, textField, book } = parseArgs();
  if (!fs.existsSync(apkg)) {
    console.error("APKG/ZIP not found:", apkg);
    process.exit(1);
  }
  if (!fs.existsSync(vocFile)) {
    console.error("Vocab file not found:", vocFile);
    process.exit(1);
  }

  const workDir = path.join(__dirname, "../.cache/anki-import", prefix);
  const dbPath = extractDbFromApkg(apkg, workDir);
  const map = await loadAnkiTexts(dbPath, prefix, ankiRoot, idField, textField);

  const before = fs.readFileSync(vocFile, "utf8");
  const after = injectTexts(before, prefix, map);
  fs.writeFileSync(vocFile, after, "utf8");

  const idsInFile = (before.match(new RegExp(`${prefix}_\\d+`, "g")) || [])
    .length;
  const matched = Object.keys(map).filter((id) => before.includes(`"${id}"`))
    .length;

  console.log(`Deck: ${path.basename(apkg)}`);
  console.log(`Notes in Anki: ${Object.keys(map).length}`);
  console.log(`Matched in ${path.basename(vocFile)}: ${matched}/${idsInFile}`);
  console.log("Sample:", map[`${prefix}_${book === 3 ? "1201" : "601"}`]);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
