export type ThemeMode = "dark" | "light";

export type AppTheme = {
  background: string;
  card: string;
  cardImageBg: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  ipa: string;
  meaning: string;
  success: string;
  danger: string;
  border: string;
  borderSubtle: string;
  overlay: string;
  placeholderBg: string;
  setCardBg: string;
  floatingBtnText: string;
  switchTrackOff: string;
  segmentBg: string;
  iconMuted: string;
  iconTeal: string;
  activeSetBorder: string;
  activeSetText: string;
  shadow: string;
  dangerText: string;
};

export const darkTheme: AppTheme = {
  background: "#1a1a2e",
  card: "#16213e",
  cardImageBg: "#0f3460",
  text: "#ffffff",
  textSecondary: "#a8dadc",
  textMuted: "#888888",
  accent: "#e94560",
  ipa: "#859b5e",
  meaning: "#a8dadc",
  success: "#4ade80",
  danger: "#e94560",
  border: "rgba(255,255,255,0.1)",
  borderSubtle: "rgba(255,255,255,0.08)",
  overlay: "rgba(0,0,0,0.8)",
  placeholderBg: "rgba(255,255,255,0.1)",
  setCardBg: "rgba(255,255,255,0.05)",
  floatingBtnText: "#ffffff",
  switchTrackOff: "#3a3a5c",
  segmentBg: "rgba(255,255,255,0.06)",
  iconMuted: "#888888",
  iconTeal: "#a8dadc",
  activeSetBorder: "green",
  activeSetText: "green",
  shadow: "#000000",
  dangerText: "#fca5a5",
};

export const lightTheme: AppTheme = {
  background: "#f1f5f9",
  card: "#ffffff",
  cardImageBg: "#e2e8f0",
  text: "#0f172a",
  textSecondary: "#0e7490",
  textMuted: "#64748b",
  accent: "#e94560",
  ipa: "#475569",
  meaning: "#0e7490",
  success: "#16a34a",
  danger: "#e94560",
  border: "rgba(15,23,42,0.12)",
  borderSubtle: "rgba(15,23,42,0.08)",
  overlay: "rgba(15,23,42,0.45)",
  placeholderBg: "rgba(15,23,42,0.06)",
  setCardBg: "rgba(15,23,42,0.04)",
  floatingBtnText: "#ffffff",
  switchTrackOff: "#cbd5e1",
  segmentBg: "rgba(15,23,42,0.06)",
  iconMuted: "#64748b",
  iconTeal: "#0e7490",
  activeSetBorder: "#16a34a",
  activeSetText: "#16a34a",
  shadow: "#64748b",
  dangerText: "#dc2626",
};

export function getAppTheme(mode: ThemeMode): AppTheme {
  return mode === "light" ? lightTheme : darkTheme;
}
