import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/lib/storage-keys";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  photoUrl: string | null;
};

export type StoredAuthSession = {
  user: AuthUser;
  accessToken: string;
  loggedInAt: string;
};

export async function loadAuthSession(): Promise<StoredAuthSession | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.authSession);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed?.user?.id || !parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveAuthSession(session: StoredAuthSession): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify(session));
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.authSession,
    STORAGE_KEYS.googleBackupAt,
  ]);
}

export async function fetchGoogleUserProfile(
  accessToken: string
): Promise<AuthUser> {
  const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error("GOOGLE_PROFILE_FAILED");
  }
  const data = (await res.json()) as {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!data.id || !data.email) {
    throw new Error("GOOGLE_PROFILE_INCOMPLETE");
  }
  return {
    id: data.id,
    email: data.email,
    name: data.name?.trim() || data.email,
    photoUrl: data.picture ?? null,
  };
}
