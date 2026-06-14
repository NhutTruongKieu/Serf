import { AppTheme } from "@/constants/app-theme";
import { APP_LAUNCHER_FOREGROUND_SCALE } from "@/lib/app-launcher-icon";
import { StyleSheet } from "react-native";

export function createAppGuideStyles(theme: AppTheme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      height: "60%",
      maxHeight: "82%",
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 20,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    stepLabel: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "600",
    },
    closeBtn: {
      padding: 4,
    },
    logoWrap: {
      alignSelf: "center",
      width: 84,
      height: 84,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      marginTop: 8,
      overflow: "hidden",
    },
    logoForeground: {
      width: "100%",
      height: "100%",
      transform: [{ scale: APP_LAUNCHER_FOREGROUND_SCALE }],
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
      textAlign: "center",
      marginBottom: 12,
      minHeight: 56,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 8,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 4,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 12,
    },
    bulletIcon: {
      marginTop: 2,
      width: 22,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.accent,
      marginTop: 8,
      marginLeft: 8,
      marginRight: 8,
    },
    bulletText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: theme.textSecondary,
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 16,
      marginBottom: 20,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.placeholderBg,
    },
    dotActive: {
      backgroundColor: theme.accent,
      width: 20,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    footerSpacer: {
      flex: 1,
    },
    secondaryBtn: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    secondaryBtnText: {
      color: theme.textMuted,
      fontSize: 15,
      fontWeight: "600",
    },
    primaryBtn: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      backgroundColor: theme.accent,
      alignItems: "center",
    },
    primaryBtnWide: {
      flex: 1,
    },
    primaryBtnText: {
      color: theme.floatingBtnText,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
