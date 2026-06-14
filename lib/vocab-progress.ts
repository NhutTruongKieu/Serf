import AsyncStorage from "@react-native-async-storage/async-storage";

import { clearQuizSessions } from "@/lib/vocab-quiz-history";
import { LEARNED_VOCS_PREFIX, STORAGE_KEYS } from "@/lib/storage-keys";
import { clearFullyMasteredIds } from "@/lib/vocab-fully-mastered";
import { clearSrsAndLegacyReview } from "@/lib/vocab-srs";

export async function clearCurrentSetProgress(): Promise<void> {
  const cat = (await AsyncStorage.getItem(STORAGE_KEYS.currentCategory)) || "All";
  const set = (await AsyncStorage.getItem(STORAGE_KEYS.currentSet)) || "0";
  await AsyncStorage.removeItem(STORAGE_KEYS.learnedVocs(cat, parseInt(set, 10)));
}

export async function clearAllLearnedProgress(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const learnedKeys = keys.filter((k) => k.startsWith(LEARNED_VOCS_PREFIX));
  if (learnedKeys.length > 0) {
    await AsyncStorage.multiRemove(learnedKeys);
  }
  await clearSrsAndLegacyReview();
  await clearFullyMasteredIds();
  await clearQuizSessions();
}
