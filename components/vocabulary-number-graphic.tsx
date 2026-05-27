import type { AppTheme } from "@/constants/app-theme";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  value: number;
  theme: AppTheme;
  style?: StyleProp<ViewStyle>;
};

/**
 * Khối “hình chữ số” cho bộ học số — không cần file ảnh trong bundle.
 */
function baseFontSizeForDigits(len: number): number {
  if (len <= 2) return 118;
  if (len === 3) return 86;
  if (len <= 5) return 48;
  if (len <= 7) return 34;
  return 26;
}

export function VocabularyNumberGraphic({ value, theme, style }: Props) {
  const digits = String(value);
  const len = digits.length;
  const fontSize = baseFontSizeForDigits(len);
  const letterSpacing = len > 6 ? 0 : len > 4 ? 1 : 4;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.cardImageBg,
          borderColor: theme.accent,
        },
        style,
      ]}
    >
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.25}
        numberOfLines={1}
        style={[
          styles.digits,
          {
            color: theme.accent,
            fontSize,
            letterSpacing,
            paddingHorizontal: len > 6 ? 6 : 12,
          },
        ]}
        maxFontSizeMultiplier={1.3}
      >
        {digits}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 280,
    height: 280,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  digits: {
    fontWeight: "900",
    letterSpacing: 4,
    fontVariant: ["tabular-nums"],
  },
});
