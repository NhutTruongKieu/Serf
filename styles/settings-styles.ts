import { AppTheme } from "@/constants/app-theme";
import { StyleSheet } from "react-native";

export function createSettingsStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    backBtn: {
      width: 40,
      alignItems: "flex-start",
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
    },
    sectionLabel: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
      marginTop: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      gap: 12,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 12,
    },
    rowText: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rowLabels: {
      flex: 1,
    },
    rowTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    rowSubtitle: {
      color: theme.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
    dangerText: {
      color: theme.dangerText,
    },
    divider: {
      height: 1,
      backgroundColor: theme.borderSubtle,
      marginHorizontal: 16,
    },
    versionBadge: {
      color: theme.success,
      fontSize: 15,
      fontWeight: "700",
    },
    rowColumn: {
      padding: 16,
      gap: 14,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: theme.segmentBg,
      borderRadius: 12,
      padding: 4,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
    },
    segmentBtnLeft: {
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    },
    segmentBtnRight: {
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
    },
    segmentBtnActive: {
      backgroundColor: theme.accent,
    },
    segmentText: {
      color: theme.textMuted,
      fontSize: 15,
      fontWeight: "600",
    },
    segmentTextActive: {
      color: theme.floatingBtnText,
    },
    accountRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 14,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.segmentBg,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.segmentBg,
      alignItems: "center",
      justifyContent: "center",
    },
    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginHorizontal: 16,
      marginBottom: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    googleBtnDisabled: {
      opacity: 0.55,
    },
    googleBtnText: {
      color: "#1f1f1f",
      fontSize: 16,
      fontWeight: "600",
    },
    signOutBtn: {
      alignItems: "center",
      paddingVertical: 14,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    signOutText: {
      color: theme.dangerText,
      fontSize: 15,
      fontWeight: "600",
    },
    configHint: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginHorizontal: 16,
      marginBottom: 14,
    },
  });
}
