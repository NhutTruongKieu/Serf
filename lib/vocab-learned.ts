import type { Vocabulary } from "@/lib/vocab-types";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { VOCAB_CATEGORY_ORDER } from "@/lib/category-unlock";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { getSetsForCategory } from "@/lib/vocab-sets";
import { loadRemainingIds } from "@/lib/vocab-storage";

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
