import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert } from "react-native";

import {
  getGoogleAuthClientIds,
  isGoogleAuthConfigured,
} from "@/lib/google-auth-config";
import {
  clearAuthSession,
  fetchGoogleUserProfile,
  loadAuthSession,
  saveAuthSession,
  type AuthUser,
  type StoredAuthSession,
} from "@/lib/auth-storage";
import { uploadBackupToGoogleDrive } from "@/lib/google-drive-backup";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_SCOPES = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/drive.appdata",
];

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isSigningIn: boolean;
  isGoogleConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const clientIds = useMemo(() => getGoogleAuthClientIds(), []);
  const isGoogleConfigured = isGoogleAuthConfigured(clientIds);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: clientIds.iosClientId,
    androidClientId: clientIds.androidClientId,
    webClientId: clientIds.webClientId ?? clientIds.expoClientId,
    scopes: GOOGLE_SCOPES,
  });

  const applySession = useCallback(async (session: StoredAuthSession) => {
    await saveAuthSession(session);
    setUser(session.user);
    setAccessToken(session.accessToken);
  }, []);

  const signOut = useCallback(async () => {
    await clearAuthSession();
    setUser(null);
    setAccessToken(null);
  }, []);

  const getAccessToken = useCallback(async () => {
    if (accessToken) return accessToken;
    const session = await loadAuthSession();
    if (session?.accessToken) {
      setAccessToken(session.accessToken);
      return session.accessToken;
    }
    return null;
  }, [accessToken]);

  const tryAutoBackupAfterLogin = useCallback(async (token: string) => {
    try {
      await uploadBackupToGoogleDrive(token);
    } catch {
      // Silent: user can back up manually in settings
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await loadAuthSession();
        if (!cancelled && session) {
          setUser(session.user);
          setAccessToken(session.accessToken);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const accessToken = response.authentication?.accessToken;
      if (!accessToken) {
        setIsSigningIn(false);
        Alert.alert("Đăng nhập thất bại", "Không nhận được token từ Google.");
        return;
      }

      void (async () => {
        try {
          const profile = await fetchGoogleUserProfile(accessToken);
          await applySession({
            user: profile,
            accessToken,
            loggedInAt: new Date().toISOString(),
          });
          await tryAutoBackupAfterLogin(accessToken);
        } catch {
          Alert.alert(
            "Đăng nhập thất bại",
            "Không lấy được thông tin tài khoản Google."
          );
        } finally {
          setIsSigningIn(false);
        }
      })();
      return;
    }

    setIsSigningIn(false);
    if (response.type === "error") {
      Alert.alert(
        "Đăng nhập thất bại",
        response.error?.message ?? "Không thể kết nối Google."
      );
    }
  }, [response, applySession, tryAutoBackupAfterLogin]);

  const signInWithGoogle = useCallback(async () => {
    if (!isGoogleConfigured) {
      Alert.alert(
        "Chưa cấu hình Google",
        "Thêm OAuth Client ID vào file .env (EXPO_PUBLIC_GOOGLE_*) rồi build lại app. Xem .env.example trong project."
      );
      return;
    }

    if (!request) {
      Alert.alert(
        "Chưa sẵn sàng",
        "Đang khởi tạo đăng nhập Google. Thử lại sau vài giây."
      );
      return;
    }

    setIsSigningIn(true);
    try {
      await promptAsync();
    } catch {
      setIsSigningIn(false);
      Alert.alert("Đăng nhập thất bại", "Không mở được cửa sổ đăng nhập Google.");
    }
  }, [isGoogleConfigured, request, promptAsync]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      isSigningIn,
      isGoogleConfigured,
      signInWithGoogle,
      signOut,
      getAccessToken,
    }),
    [
      user,
      accessToken,
      isLoading,
      isSigningIn,
      isGoogleConfigured,
      signInWithGoogle,
      signOut,
      getAccessToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
