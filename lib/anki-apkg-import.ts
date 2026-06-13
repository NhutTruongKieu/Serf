import * as SQLite from "expo-sqlite";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { decompress } from "fzstd";
import { unzipSync, type UnzipFileInfo } from "fflate";

import {
  cleanHtmlText,
  extractPos,
  formatIpa,
  parseTexts,
} from "@/lib/anki-html-utils";
import type { Vocabulary } from "@/lib/vocab-types";

type FieldConfig = {
  num: number;
  word: number;
  meaning: number;
  sound?: number;
  image?: number;
  ipa?: number;
  texts?: number;
  meaningSound?: number;
  exampleSound?: number;
  posHtml?: number;
  padId?: number;
};

const DB_ARCHIVE_NAMES = [
  "collection.anki21b",
  "collection.anki21",
  "collection.anki2",
] as const;

const BOOK_4000_CONFIGS: FieldConfig[] = [
  {
    num: 0,
    word: 1,
    meaning: 3,
    sound: 4,
    image: 5,
    ipa: 6,
    texts: 7,
    meaningSound: 8,
    exampleSound: 9,
    posHtml: 10,
    padId: 3,
  },
  {
    num: 0,
    word: 1,
    image: 2,
    sound: 3,
    meaning: 5,
    ipa: 6,
    texts: 7,
    meaningSound: 8,
    exampleSound: 9,
    posHtml: 10,
  },
  {
    num: 0,
    word: 1,
    sound: 2,
    image: 3,
    ipa: 4,
    meaning: 6,
    texts: 7,
    meaningSound: 8,
    exampleSound: 9,
    posHtml: 10,
  },
  {
    num: 0,
    word: 1,
    image: 2,
    ipa: 3,
    texts: 5,
    meaning: 6,
    sound: 7,
    meaningSound: 8,
    exampleSound: 9,
    posHtml: 10,
  },
  {
    num: 1,
    word: 2,
    meaning: 4,
    sound: 5,
    image: 6,
    ipa: 7,
    texts: 8,
    meaningSound: 9,
    exampleSound: 10,
    posHtml: 10,
  },
  {
    num: 0,
    word: 6,
    image: 1,
    sound: 2,
    meaning: 4,
    ipa: 5,
    texts: 7,
    meaningSound: 8,
    exampleSound: 9,
    posHtml: 10,
    padId: 3,
  },
  {
    num: 1,
    word: 0,
    image: 2,
    sound: 3,
    meaning: 5,
    ipa: 6,
    texts: 7,
    meaningSound: 8,
    exampleSound: 9,
    posHtml: 10,
  },
];

const BASIC_CONFIG: FieldConfig = {
  num: -1,
  word: 0,
  meaning: 1,
};

/** Chỉ giải nén DB + media index — tránh OOM với deck lớn (hàng trăm MB). */
const METADATA_FILTER = new Set<string>([...DB_ARCHIVE_NAMES, "media"]);

export type ParsedApkgDeck = {
  deckName: string;
  entries: Vocabulary[];
  mediaDir: string;
};

function isZstd(data: Uint8Array): boolean {
  return (
    data.length >= 4 &&
    data[0] === 0x28 &&
    data[1] === 0xb5 &&
    data[2] === 0x2f &&
    data[3] === 0xfd
  );
}

function decompressIfZstd(data: Uint8Array): Uint8Array {
  if (!isZstd(data)) return data;
  try {
    return decompress(data);
  } catch {
    throw new Error("ZSTD_DECOMPRESS_FAILED");
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function readApkgBytes(uri: string): Promise<Uint8Array> {
  try {
    const file = new File(uri);
    const buf = await file.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64ToUint8Array(base64);
  }
}

function extractMetadata(zipBytes: Uint8Array): Record<string, Uint8Array> {
  try {
    return unzipSync(zipBytes, {
      filter: (file: UnzipFileInfo) => METADATA_FILTER.has(file.name),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/memory|allocation|too large/i.test(msg)) {
      throw new Error("FILE_TOO_LARGE");
    }
    throw new Error("INVALID_ZIP");
  }
}

function pickDbEntry(
  extracted: Record<string, Uint8Array>
): { key: string; bytes: Uint8Array } | null {
  for (const key of DB_ARCHIVE_NAMES) {
    if (extracted[key]) {
      return { key, bytes: decompressIfZstd(extracted[key]) };
    }
  }
  return null;
}

function looksLikeWord(text: string): boolean {
  if (!text || text.length > 60) return false;
  if (/^\d+$/.test(text)) return false;
  if (/^\[sound:/i.test(text)) return false;
  if (/^<|^https?:/i.test(text)) return false;
  return /^[a-z][a-z\s'/-]*$/i.test(text);
}

function looksLikeMeaning(text: string): boolean {
  if (!text || text.length < 2) return false;
  if (/^\[sound:/i.test(text)) return false;
  if (/^<|a__|__/.test(text)) return false;
  if (/^\[[^\]]+\]$/.test(text)) return false;
  return /[à-ỹÀ-Ỹ]/.test(text) || text.split(/\s+/).length >= 2;
}

function buildId(prefix: string, num: string, padId?: number): string {
  const n = parseInt(num, 10);
  if (padId) return `${prefix}_${String(n).padStart(padId, "0")}`;
  return `${prefix}_${n}`;
}

function parseNote4000(
  fields: string[],
  cfg: FieldConfig,
  ctx: {
    deckId: string;
    category: string;
    index: number;
  }
): Vocabulary | null {
  const num =
    cfg.num >= 0 ? (fields[cfg.num] || "").trim() : String(ctx.index + 1);
  const word = cleanHtmlText(fields[cfg.word] || "");
  if (!looksLikeWord(word)) return null;

  const id = buildId(`imp_${ctx.deckId}`, num, cfg.padId);
  const meaning = cleanHtmlText(fields[cfg.meaning] || "");
  const ipa = cfg.ipa != null ? formatIpa(fields[cfg.ipa] || "") : null;
  const { meaningText, exampleText } =
    cfg.texts != null
      ? parseTexts(fields[cfg.texts] || "")
      : { meaningText: "", exampleText: "" };
  const pos = cfg.posHtml != null ? extractPos(fields[cfg.posHtml] || "") : "";

  const entry: Vocabulary = {
    id,
    voc: word,
    pos,
    meaning: meaning || meaningText,
    category: ctx.category,
    setGroup: ctx.deckId,
    useDeviceTts: true,
  };

  if (meaningText) entry.meaningText = meaningText;
  if (exampleText) entry.exampleText = exampleText;
  if (ipa) entry.ipa = ipa;

  return entry.meaning || entry.meaningText ? entry : null;
}

function parseNoteBasic(
  fields: string[],
  ctx: {
    deckId: string;
    category: string;
    index: number;
  }
): Vocabulary | null {
  const word = cleanHtmlText(fields[0] || "");
  const meaning = cleanHtmlText(fields[1] || "");
  if (!word || !meaning) return null;

  return {
    id: `imp_${ctx.deckId}_${ctx.index + 1}`,
    voc: word,
    pos: "",
    meaning,
    category: ctx.category,
    setGroup: ctx.deckId,
    useDeviceTts: true,
  };
}

function parseNoteGeneric(
  fields: string[],
  ctx: {
    deckId: string;
    category: string;
    index: number;
  }
): Vocabulary | null {
  const cleaned = fields.map((f) => cleanHtmlText(f)).filter(Boolean);
  if (cleaned.length < 2) return null;

  const word = cleaned.find((t) => /^[a-z][a-z\s'-]{0,40}$/i.test(t)) ?? cleaned[0];
  const meaning =
    cleaned.find((t) => t !== word && /[à-ỹÀ-Ỹ]/.test(t)) ??
    cleaned.find((t) => t !== word) ??
    "";

  if (!word || !meaning) return null;

  return {
    id: `imp_${ctx.deckId}_${ctx.index + 1}`,
    voc: word,
    pos: "",
    meaning,
    category: ctx.category,
    setGroup: ctx.deckId,
    useDeviceTts: true,
  };
}

function noteQuality(fields: string[], cfg: FieldConfig): number {
  const word = cleanHtmlText(fields[cfg.word] || "");
  const meaning = cleanHtmlText(fields[cfg.meaning] || "");
  const texts =
    cfg.texts != null ? parseTexts(fields[cfg.texts] || "") : null;
  let score = 0;
  if (looksLikeWord(word)) score += 3;
  if (looksLikeMeaning(meaning)) score += 3;
  if (texts?.meaningText && looksLikeMeaning(texts.meaningText)) score += 2;
  if (texts?.exampleText && texts.exampleText.length > 10) score += 1;
  return score;
}

function scoreConfig(fieldsRows: string[][], cfg: FieldConfig): number {
  let score = 0;
  const sample = fieldsRows.slice(0, Math.min(20, fieldsRows.length));
  for (let i = 0; i < sample.length; i++) {
    score += noteQuality(sample[i], cfg);
  }
  return score;
}

function detectFieldConfig(fieldsRows: string[][]): FieldConfig | "generic" {
  if (fieldsRows.length === 0) return BASIC_CONFIG;

  const fieldCount = fieldsRows[0].length;
  if (fieldCount <= 2) return BASIC_CONFIG;

  let best = BOOK_4000_CONFIGS[0];
  let bestScore = 0;
  for (const cfg of BOOK_4000_CONFIGS) {
    const score = scoreConfig(fieldsRows, cfg);
    if (score > bestScore) {
      bestScore = score;
      best = cfg;
    }
  }

  if (bestScore >= 15) {
    return best;
  }

  if (fieldCount >= 2) return "generic";
  return BASIC_CONFIG;
}

async function loadNoteFields(dbBytes: Uint8Array): Promise<string[][]> {
  const db = await SQLite.deserializeDatabaseAsync(dbBytes);
  try {
    const rows = await db.getAllAsync<{ flds: string }>("SELECT flds FROM notes");
    return rows.map((r) => r.flds.split("\x1f"));
  } finally {
    await db.closeAsync();
  }
}

function sanitizeDeckName(name: string): string {
  return name.replace(/\.apkg$/i, "").trim() || "Anki Deck";
}

function importedCategory(deckName: string): string {
  return `Imported: ${deckName}`;
}

export async function parseApkgFromUri(
  apkgUri: string,
  deckNameOverride?: string
): Promise<ParsedApkgDeck> {
  const fileName = apkgUri.split("/").pop() ?? "deck.apkg";
  const deckName =
    deckNameOverride ?? sanitizeDeckName(decodeURIComponent(fileName));
  const deckId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const workDir = `${FileSystem.documentDirectory}imported-apkg/${deckId}/`;
  await FileSystem.makeDirectoryAsync(workDir, { intermediates: true });

  const zipBytes = await readApkgBytes(apkgUri);
  const extracted = extractMetadata(zipBytes);

  const dbEntry = pickDbEntry(extracted);
  if (!dbEntry) {
    throw new Error("NO_ANKI_DB");
  }

  const fieldsRows = await loadNoteFields(dbEntry.bytes);
  if (fieldsRows.length === 0) {
    throw new Error("EMPTY_DECK");
  }

  const cfg = detectFieldConfig(fieldsRows);
  const category = importedCategory(deckName);
  const entries: Vocabulary[] = [];

  for (let i = 0; i < fieldsRows.length; i++) {
    let parsed: Vocabulary | null = null;
    if (cfg === BASIC_CONFIG) {
      parsed = parseNoteBasic(fieldsRows[i], { deckId, category, index: i });
    } else if (cfg === "generic") {
      parsed = parseNoteGeneric(fieldsRows[i], { deckId, category, index: i });
    } else {
      parsed = parseNote4000(fieldsRows[i], cfg, {
        deckId,
        category,
        index: i,
      });
    }
    if (parsed) entries.push(parsed);
  }

  if (entries.length === 0) {
    throw new Error("NO_VALID_CARDS");
  }

  return { deckName, entries, mediaDir: `${workDir}media/` };
}

export async function pickAndParseApkg(): Promise<ParsedApkgDeck> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/octet-stream", "application/zip", "*/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    throw new Error("CANCELLED");
  }

  const asset = result.assets[0];
  const name = asset.name ?? undefined;
  return parseApkgFromUri(
    asset.uri,
    name ? sanitizeDeckName(name) : undefined
  );
}

export function apkgImportErrorMessage(code: string): string {
  switch (code) {
    case "CANCELLED":
      return "";
    case "NO_ANKI_DB":
      return "File không phải deck Anki hợp lệ (thiếu collection.anki2/anki21/anki21b).";
    case "EMPTY_DECK":
      return "Deck Anki không có thẻ nào.";
    case "NO_VALID_CARDS":
      return "Không đọc được từ vựng từ deck. Thử deck 4000 Essential English Words hoặc deck Basic 2 mặt.";
    case "INVALID_ZIP":
      return "File bị hỏng hoặc không phải định dạng .apkg hợp lệ.";
    case "FILE_TOO_LARGE":
      return "File quá lớn để xử lý trên thiết bị. Thử deck nhỏ hơn hoặc xuất lại từ Anki.";
    case "ZSTD_DECOMPRESS_FAILED":
      return "Không giải nén được deck Anki mới (anki21b). Thử xuất lại deck ở định dạng Legacy 2.";
    default:
      return "";
  }
}
