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

import { STORAGE_KEYS } from "@/lib/storage-keys";

export type SoundIconsAlign = "left" | "center" | "right";

type AppSettingsContextValue = {
  isMute: boolean;
  setIsMute: (value: boolean) => void;
  soundIconsAlign: SoundIconsAlign;
  setSoundIconsAlign: (value: SoundIconsAlign) => void;
  progressReloadToken: number;
  bumpProgressReload: () => void;
};

function parseSoundIconsAlign(value: string | null): SoundIconsAlign {
  if (value === "left" || value === "right") return value;
  return "center";
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [isMute, setIsMuteState] = useState(false);
  const [soundIconsAlign, setSoundIconsAlignState] =
    useState<SoundIconsAlign>("center");
  const [progressReloadToken, setProgressReloadToken] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.mute).then((value) => {
      if (value === "true") setIsMuteState(true);
    });
    AsyncStorage.getItem(STORAGE_KEYS.soundIconsAlign).then((value) => {
      setSoundIconsAlignState(parseSoundIconsAlign(value));
    });
  }, []);

  const setIsMute = useCallback((value: boolean) => {
    setIsMuteState(value);
    AsyncStorage.setItem(STORAGE_KEYS.mute, value ? "true" : "false");
  }, []);

  const setSoundIconsAlign = useCallback((value: SoundIconsAlign) => {
    setSoundIconsAlignState(value);
    AsyncStorage.setItem(STORAGE_KEYS.soundIconsAlign, value);
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
      progressReloadToken,
      bumpProgressReload,
    }),
    [
      isMute,
      setIsMute,
      soundIconsAlign,
      setSoundIconsAlign,
      progressReloadToken,
      bumpProgressReload,
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
