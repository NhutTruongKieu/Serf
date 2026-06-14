import type { Vocabulary } from "@/lib/vocab-types";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/lib/storage-keys";

export async function loadFullyMasteredIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.fullyMasteredIds);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

async function saveFullyMasteredIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.fullyMasteredIds,
    JSON.stringify([...ids])
  );
}

/** Đánh dấu thuộc hoàn toàn — loại khỏi bộ trộn và kiểm tra SRS. */
export async function markVocabFullyMastered(vocabId: string): Promise<void> {
  const ids = await loadFullyMasteredIds();
  if (ids.has(vocabId)) return;
  ids.add(vocabId);
  await saveFullyMasteredIds(ids);
}

export async function clearFullyMasteredIds(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.fullyMasteredIds);
}

export function filterOutFullyMastered(
  vocs: Vocabulary[],
  masteredIds: Set<string>
): Vocabulary[] {
  if (masteredIds.size === 0) return vocs;
  return vocs.filter((v) => !masteredIds.has(v.id));
}
