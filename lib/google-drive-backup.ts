import AsyncStorage from "@react-native-async-storage/async-storage";

import { buildBackupJson, importAppDataFromJson } from "@/lib/data-backup";
import { STORAGE_KEYS } from "@/lib/storage-keys";

const BACKUP_FILE_NAME = "serf-backup.json";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";

type DriveFile = { id: string; modifiedTime?: string };

async function driveRequest(
  accessToken: string,
  url: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
}

function mapDriveError(status: number): string {
  if (status === 401 || status === 403) {
    return "GOOGLE_AUTH_EXPIRED";
  }
  if (status === 404) {
    return "DRIVE_NO_BACKUP";
  }
  return "DRIVE_UPLOAD_FAILED";
}

async function findBackupFile(accessToken: string): Promise<DriveFile | null> {
  const q = encodeURIComponent(
    `name='${BACKUP_FILE_NAME}' and trashed=false`
  );
  const res = await driveRequest(
    accessToken,
    `${DRIVE_FILES_URL}?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&pageSize=1`
  );

  if (res.status === 403) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    if (body.error?.message?.includes("Drive API")) {
      throw new Error("DRIVE_API_DISABLED");
    }
    throw new Error(mapDriveError(res.status));
  }

  if (!res.ok) {
    throw new Error("DRIVE_LIST_FAILED");
  }

  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files?.[0] ?? null;
}

async function createBackupFile(
  accessToken: string,
  json: string
): Promise<string> {
  const metadata = JSON.stringify({
    name: BACKUP_FILE_NAME,
    mimeType: "application/json",
    parents: ["appDataFolder"],
  });

  const body =
    `--serf-boundary\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--serf-boundary\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${json}\r\n` +
    `--serf-boundary--`;

  const res = await driveRequest(
    accessToken,
    `${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,modifiedTime`,
    {
      method: "POST",
      headers: {
        "Content-Type": 'multipart/related; boundary="serf-boundary"',
      },
      body,
    }
  );

  if (!res.ok) {
    throw new Error(mapDriveError(res.status));
  }

  const data = (await res.json()) as DriveFile;
  return data.modifiedTime ?? new Date().toISOString();
}

async function updateBackupFile(
  accessToken: string,
  fileId: string,
  json: string
): Promise<string> {
  const res = await driveRequest(
    accessToken,
    `${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media&fields=modifiedTime`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: json,
    }
  );

  if (!res.ok) {
    throw new Error(mapDriveError(res.status));
  }

  const data = (await res.json()) as DriveFile;
  return data.modifiedTime ?? new Date().toISOString();
}

export async function getGoogleBackupTimestamp(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.googleBackupAt);
}

async function setGoogleBackupTimestamp(iso: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.googleBackupAt, iso);
}

/** Upload local progress/settings to Google Drive (hidden app folder). */
export async function uploadBackupToGoogleDrive(
  accessToken: string
): Promise<{ entryCount: number; backedUpAt: string }> {
  const { json, entryCount } = await buildBackupJson();
  const existing = await findBackupFile(accessToken);

  const backedUpAt = existing
    ? await updateBackupFile(accessToken, existing.id, json)
    : await createBackupFile(accessToken, json);

  await setGoogleBackupTimestamp(backedUpAt);
  return { entryCount, backedUpAt };
}

/** Download backup from Google Drive and restore locally. */
export async function downloadBackupFromGoogleDrive(
  accessToken: string,
  replaceExisting: boolean
): Promise<{ entryCount: number; backedUpAt: string | null }> {
  const existing = await findBackupFile(accessToken);
  if (!existing) {
    throw new Error("DRIVE_NO_BACKUP");
  }

  const res = await driveRequest(
    accessToken,
    `${DRIVE_FILES_URL}/${existing.id}?alt=media`
  );

  if (!res.ok) {
    throw new Error("DRIVE_DOWNLOAD_FAILED");
  }

  const raw = await res.text();
  const { entryCount } = await importAppDataFromJson(raw, replaceExisting);

  const backedUpAt = existing.modifiedTime ?? null;
  if (backedUpAt) {
    await setGoogleBackupTimestamp(backedUpAt);
  }

  return { entryCount, backedUpAt };
}
