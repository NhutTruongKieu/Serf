import type { Vocabulary } from "@/assets/vocs";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { VOCAB_CATEGORY_ORDER } from "@/lib/category-unlock";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { getSetsForCategory } from "@/lib/vocab-sets";
import { loadRemainingIds } from "@/lib/vocab-storage";

async function loadReviewMasteredIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.reviewMasteredIds);
  if (!raw) return new Set();
  try {
    const ids = JSON.parse(raw) as string[];
    return Array.isArray(ids) ? new Set(ids) : new Set();
  } catch {
    return new Set();
  }
}

async function saveReviewMasteredIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.reviewMasteredIds,
    JSON.stringify([...ids])
  );
}

export async function clearReviewMasteredIds(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.reviewMasteredIds);
}

/** Các từ đã đánh dấu học thuộc trong flashcard (không còn trong bộ đang học). */
export async function collectLearnedVocs(allVocs: Vocabulary[]): Promise<Vocabulary[]> {
  const byId = new Map(allVocs.map((v) => [v.id, v]));
  const learnedIds = new Set<string>();
  const categories = [...VOCAB_CATEGORY_ORDER, "All"];

  for (const cat of categories) {
    const sets = getSetsForCategory(allVocs, cat);
    for (let setIdx = 0; setIdx < sets.length; setIdx++) {
      const setVocs = sets[setIdx];
      const remaining = await loadRemainingIds(cat, setIdx, setVocs);
      if (remaining === null) continue;

      const remainingSet = new Set(remaining);
      for (const v of setVocs) {
        if (!remainingSet.has(v.id)) {
          learnedIds.add(v.id);
        }
      }
    }
  }

  return [...learnedIds]
    .map((id) => byId.get(id))
    .filter((v): v is Vocabulary => v != null);
}

/** Số từ tối đa mỗi phiên kiểm tra ngẫu nhiên. */
export const REVIEW_SESSION_WORD_LIMIT = 10;

/** Từ đã học thuộc nhưng chưa xác nhận thuộc hoàn toàn trong kiểm tra. */
export async function getReviewPool(allVocs: Vocabulary[]): Promise<Vocabulary[]> {
  const learned = await collectLearnedVocs(allVocs);
  const mastered = await loadReviewMasteredIds();
  return learned.filter((v) => !mastered.has(v.id));
}

/** Chọn ngẫu nhiên tối đa 10 từ cho một phiên kiểm tra. */
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

export async function markReviewMastered(vocabId: string): Promise<void> {
  const mastered = await loadReviewMasteredIds();
  mastered.add(vocabId);
  await saveReviewMasteredIds(mastered);
}

export function pickRandomReviewVoc(
  pool: Vocabulary[],
  excludeId?: string
): Vocabulary | null {
  if (pool.length === 0) return null;

  const candidates = excludeId
    ? pool.filter((v) => v.id !== excludeId)
    : pool;

  const source = candidates.length > 0 ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
}
