import { AppTheme } from "@/constants/app-theme";
import { StyleSheet } from "react-native";

export function createSrsQuizStyles(theme: AppTheme, screenWidth: number) {
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
      paddingTop: 8,
      paddingBottom: 12,
    },
    headerSide: { width: 40 },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
    progress: {
      textAlign: "center",
      color: theme.textMuted,
      fontSize: 14,
      marginBottom: 8,
    },
    scrollInner: {
      paddingHorizontal: 20,
      paddingBottom: 32,
      alignItems: "center",
    },
    card: {
      width: screenWidth - 40,
      backgroundColor: theme.card,
      borderRadius: 24,
      paddingVertical: 20,
      paddingHorizontal: 16,
      marginBottom: 16,
      alignItems: "center",
      gap: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 10,
    },
    image: {
      width: 312,
      height: 312,
      borderRadius: 16,
      backgroundColor: theme.cardImageBg,
    },
    playBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 22,
      backgroundColor: theme.placeholderBg,
    },
    playBtnText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontWeight: "600",
    },
    hint: {
      color: theme.textMuted,
      fontSize: 13,
      textAlign: "center",
    },
    choiceBtn: {
      width: screenWidth - 40,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    choiceText: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 22,
    },
    choiceCorrect: {
      borderColor: theme.success,
      backgroundColor: theme.placeholderBg,
    },
    choiceWrong: {
      borderColor: theme.danger,
    },
    footerHint: {
      marginTop: 12,
      color: theme.textMuted,
      fontSize: 12,
      textAlign: "center",
    },
    emptyWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 28,
      gap: 10,
    },
    emptyTitle: {
      fontSize: 20,
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
    summaryTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.success,
      marginBottom: 8,
    },
    summarySub: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 24,
    },
    doneBtn: {
      backgroundColor: theme.success,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 28,
    },
    doneBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
