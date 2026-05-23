import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { vocs } from "@/assets/vocs";
import { migrateBackupProgressToIds } from "@/lib/vocab-storage";
import { LEARNED_VOCS_PREFIX, STORAGE_KEYS } from "@/lib/storage-keys";

export const BACKUP_VERSION = 2;

export type SerfBackup = {
  version: number;
  exportedAt: string;
  appVersion: string;
  data: Record<string, string>;
};

export function isBackupKey(key: string): boolean {
  return (
    key.startsWith(LEARNED_VOCS_PREFIX) ||
    key === STORAGE_KEYS.currentCategory ||
    key === STORAGE_KEYS.currentSet ||
    key === STORAGE_KEYS.mute ||
    key === STORAGE_KEYS.soundIconsAlign ||
    key === STORAGE_KEYS.themeMode ||
    key === STORAGE_KEYS.progressUsesIds
  );
}

export async function collectBackupData(): Promise<Record<string, string>> {
  const allKeys = await AsyncStorage.getAllKeys();
  const backupKeys = allKeys.filter(isBackupKey);
  const pairs = await AsyncStorage.multiGet(backupKeys);
  const data: Record<string, string> = {};

  for (const [key, value] of pairs) {
    if (value != null) {
      data[key] = value;
    }
  }

  return data;
}

export function createBackupPayload(data: Record<string, string>): SerfBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion:
      Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "unknown",
    data,
  };
}

export function parseBackupJson(raw: string): SerfBackup {
  const parsed: unknown = JSON.parse(raw);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    !("data" in parsed)
  ) {
    throw new Error("INVALID_FORMAT");
  }

  const backup = parsed as SerfBackup;

  if (typeof backup.version !== "number" || backup.version > BACKUP_VERSION) {
    throw new Error("UNSUPPORTED_VERSION");
  }

  if (
    typeof backup.data !== "object" ||
    backup.data === null ||
    Array.isArray(backup.data)
  ) {
    throw new Error("INVALID_DATA");
  }

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(backup.data)) {
    if (!isBackupKey(key)) continue;
    if (typeof value !== "string") {
      throw new Error("INVALID_DATA");
    }
    sanitized[key] = value;
  }

  if (Object.keys(sanitized).length === 0) {
    throw new Error("EMPTY_BACKUP");
  }

  return { ...backup, data: sanitized };
}

export async function applyBackupData(
  data: Record<string, string>,
  replaceExisting: boolean
): Promise<void> {
  if (replaceExisting) {
    const allKeys = await AsyncStorage.getAllKeys();
    const toRemove = allKeys.filter(isBackupKey);
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  }

  await AsyncStorage.multiSet(Object.entries(data));
  await migrateBackupProgressToIds(vocs);
}

function backupFileName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `serf-backup-${stamp}.json`;
}

export async function exportAppData(): Promise<{ entryCount: number }> {
  const data = await collectBackupData();
  const payload = createBackupPayload(data);
  const json = JSON.stringify(payload, null, 2);

  const fileUri = `${FileSystem.cacheDirectory}${backupFileName()}`;
  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("SHARING_UNAVAILABLE");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/json",
    dialogTitle: "Xuất dữ liệu Serf",
    UTI: "public.json",
  });

  return { entryCount: Object.keys(data).length };
}

export async function importAppDataFromPicker(
  replaceExisting: boolean
): Promise<{ entryCount: number }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    throw new Error("CANCELLED");
  }

  const raw = await FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const backup = parseBackupJson(raw);
  await applyBackupData(backup.data, replaceExisting);

  return { entryCount: Object.keys(backup.data).length };
}

export function backupErrorMessage(code: string): string {
  switch (code) {
    case "INVALID_FORMAT":
      return "File không đúng định dạng sao lưu Serf.";
    case "UNSUPPORTED_VERSION":
      return "Phiên bản file sao lưu không được hỗ trợ.";
    case "INVALID_DATA":
      return "Dữ liệu trong file không hợp lệ.";
    case "EMPTY_BACKUP":
      return "File sao lưu không có dữ liệu.";
    case "SHARING_UNAVAILABLE":
      return "Thiết bị không hỗ trợ chia sẻ file.";
    case "CANCELLED":
      return "";
    default:
      return "Đã xảy ra lỗi. Vui lòng thử lại.";
  }
}
