import AsyncStorage from "@react-native-async-storage/async-storage";

import { clearReviewMasteredIds } from "@/lib/vocab-review";
import { LEARNED_VOCS_PREFIX, STORAGE_KEYS } from "@/lib/storage-keys";

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
  await clearReviewMasteredIds();
}
