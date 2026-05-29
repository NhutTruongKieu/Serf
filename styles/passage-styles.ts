import { AppTheme } from "@/constants/app-theme";
import { StyleSheet } from "react-native";

/** Styles cho màn "Học từ trong đoạn văn" (input đoạn văn → flashcard 10 từ). */
export function createPassageStyles(theme: AppTheme, screenWidth: number) {
  const cardAreaWidth = Math.min(screenWidth - 40, 560);
  const imageSize = Math.min(cardAreaWidth - 40, 336);

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
    headerSideRight: {
      width: 40,
      alignItems: "flex-end",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },

    inputBody: {
      flex: 1,
      width: "100%",
      paddingHorizontal: 20,
      gap: 12,
    },
    inputLabel: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    textInput: {
      flex: 1,
      minHeight: 200,
      backgroundColor: theme.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      padding: 14,
      fontSize: 15,
      lineHeight: 22,
      color: theme.text,
    },
    charCount: {
      color: theme.textMuted,
      fontSize: 12,
      textAlign: "right",
    },
    actionsRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    actionBtn: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    actionBtnPrimary: {
      backgroundColor: theme.accent,
    },
    actionBtnPrimaryText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "700",
    },
    actionBtnGhost: {
      backgroundColor: theme.placeholderBg,
    },
    actionBtnGhostText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontWeight: "600",
    },

    poolCount: {
      textAlign: "center",
      color: theme.textMuted,
      fontSize: 14,
      marginBottom: 8,
    },
    cardArea: {
      flex: 1,
      width: cardAreaWidth,
      justifyContent: "center",
      alignItems: "center",
    },
    card: {
      width: "100%",
      backgroundColor: theme.card,
      borderRadius: 24,
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 20,
      gap: 14,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
    image: {
      width: imageSize,
      height: imageSize,
      borderRadius: 16,
      backgroundColor: theme.cardImageBg,
    },
    word: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.text,
    },
    ipa: {
      fontSize: 15,
      color: theme.ipa,
      marginTop: 2,
    },
    divider: {
      width: "60%",
      height: 1,
      backgroundColor: theme.border,
    },
    meaning: {
      fontSize: 17,
      color: theme.meaning,
      textAlign: "center",
      paddingHorizontal: 8,
    },
    iconRow: {
      flexDirection: "row",
      gap: 24,
      marginTop: 4,
    },
    soundBtn: {
      padding: 6,
    },

    footer: {
      width: "100%",
      paddingHorizontal: 24,
      paddingBottom: 32,
      gap: 10,
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
