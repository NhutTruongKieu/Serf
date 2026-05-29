import type { Vocabulary } from "./vocab-types";

/**
 * Tìm các từ vựng (`vocs`) xuất hiện trong một đoạn văn tiếng Anh.
 * - Không phân biệt hoa thường.
 * - Lenient: tự cộng/trừ hậu tố phổ biến (-s, -es, -ies, -ed, -ied, -ing)
 *   để bắt được dạng số nhiều, quá khứ và present participle.
 * - Hỗ trợ `voc` có nhiều dạng cách nhau bằng "; , /" (vd "sink; sank").
 */

function addStems(set: Set<string>, w: string): void {
  if (w.length > 3 && w.endsWith("ies")) set.add(w.slice(0, -3) + "y");
  if (w.length > 3 && w.endsWith("ied")) set.add(w.slice(0, -3) + "y");
  if (w.length > 3 && w.endsWith("es")) set.add(w.slice(0, -2));
  if (w.length > 2 && w.endsWith("s")) set.add(w.slice(0, -1));
  if (w.length > 3 && w.endsWith("ed")) {
    set.add(w.slice(0, -2));
    set.add(w.slice(0, -1));
  }
  if (w.length > 4 && w.endsWith("ing")) {
    set.add(w.slice(0, -3));
    set.add(w.slice(0, -3) + "e");
  }
}

/** Tách đoạn văn thành tập các token (đã chuẩn hoá + cộng dạng stem). */
function tokenize(passage: string): Set<string> {
  const lower = passage.toLowerCase();
  const matches = lower.match(/[a-z][a-z']*/g) ?? [];
  const set = new Set<string>();
  for (const tok of matches) {
    set.add(tok);
    addStems(set, tok);
  }
  return set;
}

/** Trả về danh sách vocab xuất hiện trong đoạn văn (giữ thứ tự kho từ). */
export function matchVocsInPassage(
  vocs: Vocabulary[],
  passage: string
): Vocabulary[] {
  if (!passage.trim()) return [];
  const tokens = tokenize(passage);
  const passageLower = passage.toLowerCase();
  const matched: Vocabulary[] = [];
  const seen = new Set<string>();

  for (const v of vocs) {
    if (seen.has(v.id)) continue;
    const forms = (v.voc || "")
      .split(/[;,/]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    let hit = false;
    for (const form of forms) {
      if (form.includes(" ")) {
        if (passageLower.includes(form)) {
          hit = true;
          break;
        }
        continue;
      }
      if (tokens.has(form)) {
        hit = true;
        break;
      }
      const stemSet = new Set<string>();
      addStems(stemSet, form);
      for (const s of stemSet) {
        if (tokens.has(s)) {
          hit = true;
          break;
        }
      }
      if (hit) break;
    }

    if (hit) {
      matched.push(v);
      seen.add(v.id);
    }
  }
  return matched;
}

/** Trộn mảng (Fisher-Yates) và lấy tối đa `limit` phần tử đầu. */
export function pickRandom<T>(items: T[], limit: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, limit);
}
