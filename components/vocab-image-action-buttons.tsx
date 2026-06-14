import { AppTheme } from "@/constants/app-theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

const ICON_SIZE = 32;
const BUTTON_PADDING = 8;
const SLOT_SIZE = ICON_SIZE + BUTTON_PADDING * 2;
const SLOT_GAP = 10;

type VocabImageActionButtonsProps = {
  theme: AppTheme;
  showFullyMastered?: boolean;
  showLearned?: boolean;
  onFullyMastered?: () => void;
  onLearned?: () => void;
};

export function VocabImageActionButtons({
  theme,
  showFullyMastered = false,
  showLearned = false,
  onFullyMastered,
  onLearned,
}: VocabImageActionButtonsProps) {
  if (!showFullyMastered && !showLearned) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.topSlot}>
        {showFullyMastered ? (
          <Ionicons
            name="ribbon"
            size={ICON_SIZE}
            color={theme.accent}
            onPress={onFullyMastered}
            style={styles.button}
          />
        ) : (
          <View style={styles.slotPlaceholder} />
        )}
      </View>
      <View style={styles.bottomSlot}>
        {showLearned ? (
          <Ionicons
            name="checkmark-circle-outline"
            size={ICON_SIZE}
            color={theme.success}
            onPress={onLearned}
            style={styles.button}
          />
        ) : (
          <View style={styles.slotPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: -6,
    left: -40,
    width: SLOT_SIZE,
    height: SLOT_SIZE * 2 + SLOT_GAP,
    zIndex: 10,
  },
  topSlot: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  bottomSlot: {
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  button: {
    padding: BUTTON_PADDING,
  },
  slotPlaceholder: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
  },
});
