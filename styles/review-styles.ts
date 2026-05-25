import { AppTheme } from "@/constants/app-theme";
import { StyleSheet } from "react-native";

export function createReviewStyles(theme: AppTheme, screenWidth: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      alignItems: "center",
    },
    header: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    headerSide: {
      width: 40,
      alignItems: "flex-start",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
    poolCount: {
      textAlign: "center",
      color: theme.textMuted,
      fontSize: 14,
      marginBottom: 8,
    },
    cardArea: {
      flex: 1,
      width: screenWidth - 40,
      justifyContent: "center",
      alignItems: "center",
    },
    card: {
      width: "100%",
      backgroundColor: theme.card,
      borderRadius: 24,
      alignItems: "center",
      paddingVertical: 28,
      paddingHorizontal: 20,
      gap: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
    image: {
      width: 280,
      height: 280,
      borderRadius: 16,
      backgroundColor: theme.cardImageBg,
    },
    playBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 24,
      backgroundColor: theme.placeholderBg,
    },
    playBtnText: {
      color: theme.textSecondary,
      fontSize: 16,
      fontWeight: "600",
    },
    hint: {
      color: theme.textMuted,
      fontSize: 13,
      fontStyle: "italic",
      textAlign: "center",
    },
    footer: {
      width: "100%",
      paddingHorizontal: 24,
      paddingBottom: 32,
      gap: 12,
      alignItems: "center",
    },
    masteredBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: theme.success,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 28,
      width: "100%",
    },
    masteredBtnText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "700",
    },
    nextBtn: {
      paddingVertical: 8,
    },
    nextBtnText: {
      color: theme.iconTeal,
      fontSize: 15,
      fontWeight: "600",
    },
    emptyWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.accent,
      textAlign: "center",
    },
    emptySub: {
      fontSize: 15,
      color: theme.textMuted,
      textAlign: "center",
      lineHeight: 22,
    },
  });
}
