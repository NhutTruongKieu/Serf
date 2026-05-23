import type { Vocabulary } from "@/assets/vocs";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getSetsForCategory } from "@/lib/vocab-sets";
import { LEARNED_VOCS_PREFIX, STORAGE_KEYS } from "@/lib/storage-keys";

const VOCAB_ID_PATTERN = /^4000B\d+_\d+$/;

export function isVocabId(value: string): boolean {
  return VOCAB_ID_PATTERN.test(value);
}

export function parseLearnedVocsKey(
  key: string
): { category: string; setIdx: number } | null {
  if (!key.startsWith(LEARNED_VOCS_PREFIX)) return null;
  const match = key.match(/_SET_(\d+)$/);
  if (!match) return null;
  const setIdx = parseInt(match[1], 10);
  const category = key.slice(
    LEARNED_VOCS_PREFIX.length,
    key.length - match[0].length
  );
  return { category, setIdx };
}

/** Converts legacy voc strings to ids using the set vocabulary list. */
export function tokensToIds(tokens: string[], setVocs: Vocabulary[]): string[] {
  if (tokens.length === 0) return [];
  const vocToId = new Map(setVocs.map((v) => [v.voc, v.id]));
  const validIds = new Set(setVocs.map((v) => v.id));

  return tokens
    .map((token) => (isVocabId(token) ? token : vocToId.get(token) ?? null))
    .filter((id): id is string => !!id && validIds.has(id));
}

export function filterSetByRemainingIds(
  setVocs: Vocabulary[],
  remainingIds: string[]
): Vocabulary[] {
  const idSet = new Set(remainingIds);
  const filtered = setVocs.filter((v) => idSet.has(v.id));
  return filtered.length > 0 ? filtered : [];
}

export async function loadRemainingIds(
  category: string,
  setIdx: number,
  setVocs: Vocabulary[]
): Promise<string[] | null> {
  const key = STORAGE_KEYS.learnedVocs(category, setIdx);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    const tokens = JSON.parse(raw) as string[];
    if (!Array.isArray(tokens)) return null;

    const ids = tokensToIds(tokens, setVocs);
    const needsRewrite =
      tokens.length !== ids.length || tokens.some((t) => !isVocabId(t));

    if (needsRewrite) {
      await AsyncStorage.setItem(key, JSON.stringify(ids));
    }
    return ids;
  } catch {
    return null;
  }
}

export async function loadActiveVocsForSet(
  category: string,
  setIdx: number,
  setVocs: Vocabulary[]
): Promise<Vocabulary[]> {
  const remainingIds = await loadRemainingIds(category, setIdx, setVocs);
  if (remainingIds === null) return setVocs;
  return filterSetByRemainingIds(setVocs, remainingIds);
}

export async function saveRemainingIds(
  category: string,
  setIdx: number,
  remainingVocs: Vocabulary[]
): Promise<void> {
  const ids = remainingVocs.map((v) => v.id);
  await AsyncStorage.setItem(
    STORAGE_KEYS.learnedVocs(category, setIdx),
    JSON.stringify(ids)
  );
}

export async function countRemainingInSet(
  category: string,
  setIdx: number,
  setVocs: Vocabulary[]
): Promise<number> {
  const ids = await loadRemainingIds(category, setIdx, setVocs);
  if (ids === null) return setVocs.length;
  return ids.length;
}

/** One-time migration: voc strings → ids for all saved progress keys. */
export async function migrateAllProgressToIds(
  allVocs: Vocabulary[],
  force = false
): Promise<void> {
  if (!force) {
    const done = await AsyncStorage.getItem(STORAGE_KEYS.progressUsesIds);
    if (done === "true") return;
  }

  const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
    k.startsWith(LEARNED_VOCS_PREFIX)
  );

  for (const key of keys) {
    const parsed = parseLearnedVocsKey(key);
    if (!parsed) continue;

    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;

    try {
      const tokens = JSON.parse(raw) as string[];
      if (!Array.isArray(tokens) || tokens.every(isVocabId)) continue;

      const sets = getSetsForCategory(allVocs, parsed.category);
      const setVocs = sets[parsed.setIdx];
      if (!setVocs) continue;

      const ids = tokensToIds(tokens, setVocs);
      await AsyncStorage.setItem(key, JSON.stringify(ids));
    } catch {
      // skip invalid entries
    }
  }

  await AsyncStorage.setItem(STORAGE_KEYS.progressUsesIds, "true");
}

/** Migrate imported backup progress arrays to ids after restore. */
export async function migrateBackupProgressToIds(
  allVocs: Vocabulary[]
): Promise<void> {
  await migrateAllProgressToIds(allVocs, true);
}
