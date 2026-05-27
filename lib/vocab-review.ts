import type { Vocabulary } from "@/assets/vocs";

import { collectLearnedVocs } from "@/lib/vocab-learned";
import { getDueLearnedVocs } from "@/lib/vocab-srs";

export { collectLearnedVocs };

/** Số từ tối đa mỗi phiên (nếu gọi `buildReviewSessionPool`). */
export const REVIEW_SESSION_WORD_LIMIT = 10;

/** Từ đã học thuộc và đến hạn ôn SRS. */
export async function getReviewPool(allVocs: Vocabulary[]): Promise<Vocabulary[]> {
  return getDueLearnedVocs(allVocs);
}

/** Chọn ngẫu nhiên tối đa `REVIEW_SESSION_WORD_LIMIT` từ cho một phiên. */
export function buildReviewSessionPool(pool: Vocabulary[]): Vocabulary[] {
  if (pool.length <= REVIEW_SESSION_WORD_LIMIT) {
    return shuffleArray(pool);
  }
  return shuffleArray(pool).slice(0, REVIEW_SESSION_WORD_LIMIT);
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickRandomReviewVoc(
  pool: Vocabulary[],
  excludeId?: string
): Vocabulary | null {
  if (pool.length === 0) return null;

  const candidates = excludeId ? pool.filter((v) => v.id !== excludeId) : pool;

  const source = candidates.length > 0 ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
}
