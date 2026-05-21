import { getAppTheme } from "@/constants/app-theme";
import { useAppSettings } from "@/contexts/app-settings";

export function useAppTheme() {
  const { themeMode } = useAppSettings();
  const theme = getAppTheme(themeMode);
  return { themeMode, theme };
}
