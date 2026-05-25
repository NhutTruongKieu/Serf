import Constants from "expo-constants";

/** Set true to show "Đăng nhập với Google" in Settings. */
export const GOOGLE_LOGIN_ENABLED = false;

export type GoogleAuthClientIds = {
  expoClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
};

function pick(...values: (string | undefined)[]): string | undefined {
  for (const v of values) {
    if (v && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

/** OAuth client IDs from EXPO_PUBLIC_* or app.json extra.google */
export function getGoogleAuthClientIds(): GoogleAuthClientIds {
  const extra = Constants.expoConfig?.extra?.google as
    | GoogleAuthClientIds
    | undefined;

  return {
    expoClientId: pick(
      process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
      extra?.expoClientId
    ),
    iosClientId: pick(
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      extra?.iosClientId
    ),
    androidClientId: pick(
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      extra?.androidClientId
    ),
    webClientId: pick(
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      extra?.webClientId
    ),
  };
}

export function isGoogleAuthConfigured(ids: GoogleAuthClientIds): boolean {
  return Boolean(
    ids.expoClientId ||
      ids.iosClientId ||
      ids.androidClientId ||
      ids.webClientId
  );
}

/** Android standalone: Google expects this redirect, not package name. */
export function getGoogleAndroidRedirectUri(
  androidClientId: string | undefined
): string | undefined {
  if (!androidClientId?.includes(".apps.googleusercontent.com")) {
    return undefined;
  }
  const id = androidClientId.replace(".apps.googleusercontent.com", "");
  // Google Android OAuth uses oauth2redirect (not oauthredirect).
  return `com.googleusercontent.apps.${id}:/oauth2redirect`;
}

/** True when Android release/debug APK can complete the OAuth redirect. */
export function isGoogleAndroidAuthReady(ids: GoogleAuthClientIds): boolean {
  return Boolean(
    ids.androidClientId &&
      ids.webClientId &&
      getGoogleAndroidRedirectUri(ids.androidClientId)
  );
}
