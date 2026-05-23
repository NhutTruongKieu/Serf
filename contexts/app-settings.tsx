import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ThemeMode } from "@/constants/app-theme";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export type SoundIconsAlign = "left" | "center" | "right";

type AppSettingsContextValue = {
  isMute: boolean;
  setIsMute: (value: boolean) => void;
  soundIconsAlign: SoundIconsAlign;
  setSoundIconsAlign: (value: SoundIconsAlign) => void;
  themeMode: ThemeMode;
  setThemeMode: (value: ThemeMode) => void;
  progressReloadToken: number;
  bumpProgressReload: () => void;
  reloadFromStorage: () => Promise<void>;
};

function parseSoundIconsAlign(value: string | null): SoundIconsAlign {
  if (value === "left" || value === "right") return value;
  return "center";
}

function parseThemeMode(value: string | null): ThemeMode {
  return value === "light" ? "light" : "dark";
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [isMute, setIsMuteState] = useState(false);
  const [soundIconsAlign, setSoundIconsAlignState] =
    useState<SoundIconsAlign>("center");
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");
  const [progressReloadToken, setProgressReloadToken] = useState(0);

  const reloadFromStorage = useCallback(async () => {
    const [mute, align, theme] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.mute),
      AsyncStorage.getItem(STORAGE_KEYS.soundIconsAlign),
      AsyncStorage.getItem(STORAGE_KEYS.themeMode),
    ]);
    setIsMuteState(mute === "true");
    setSoundIconsAlignState(parseSoundIconsAlign(align));
    setThemeModeState(parseThemeMode(theme));
  }, []);

  useEffect(() => {
    void reloadFromStorage();
  }, [reloadFromStorage]);

  const setIsMute = useCallback((value: boolean) => {
    setIsMuteState(value);
    AsyncStorage.setItem(STORAGE_KEYS.mute, value ? "true" : "false");
  }, []);

  const setSoundIconsAlign = useCallback((value: SoundIconsAlign) => {
    setSoundIconsAlignState(value);
    AsyncStorage.setItem(STORAGE_KEYS.soundIconsAlign, value);
  }, []);

  const setThemeMode = useCallback((value: ThemeMode) => {
    setThemeModeState(value);
    AsyncStorage.setItem(STORAGE_KEYS.themeMode, value);
  }, []);

  const bumpProgressReload = useCallback(() => {
    setProgressReloadToken((t) => t + 1);
  }, []);

  const value = useMemo(
    () => ({
      isMute,
      setIsMute,
      soundIconsAlign,
      setSoundIconsAlign,
      themeMode,
      setThemeMode,
      progressReloadToken,
      bumpProgressReload,
      reloadFromStorage,
    }),
    [
      isMute,
      setIsMute,
      soundIconsAlign,
      setSoundIconsAlign,
      themeMode,
      setThemeMode,
      progressReloadToken,
      bumpProgressReload,
      reloadFromStorage,
    ]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return ctx;
}
