import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/lib/storage-keys";

export async function hasCompletedAppGuide(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.hasSeenGuide);
  return value === "1";
}

export async function markAppGuideCompleted(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.hasSeenGuide, "1");
}

export async function resetAppGuide(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.hasSeenGuide);
}
