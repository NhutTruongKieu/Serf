import Constants from "expo-constants";

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
