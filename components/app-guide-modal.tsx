import { useAppTheme } from "@/hooks/use-app-theme";
import {
  APP_GUIDE_STEPS,
  resolveGuideIconColor,
} from "@/lib/app-guide-content";
import { markAppGuideCompleted } from "@/lib/app-guide-storage";
import {
  APP_LAUNCHER_ICON_BACKGROUND,
  appLauncherForeground,
} from "@/lib/app-launcher-icon";
import { createAppGuideStyles } from "@/styles/app-guide-styles";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AppGuideModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Gọi sau khi người dùng hoàn thành hoặc bỏ qua lần đầu. */
  onComplete?: () => void;
};

export function AppGuideModal({
  visible,
  onClose,
  onComplete,
}: AppGuideModalProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createAppGuideStyles(theme), [theme]);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = APP_GUIDE_STEPS;
  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const finish = async () => {
    await markAppGuideCompleted();
    setStepIndex(0);
    onComplete?.();
    onClose();
  };

  const handleClose = () => {
    setStepIndex(0);
    onClose();
  };

  const handlePrimary = () => {
    if (isLast) {
      void finish();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const handleSkip = () => {
    void finish();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.stepLabel}>
              {stepIndex + 1} / {steps.length}
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={26} color={theme.iconMuted} />
            </TouchableOpacity>
          </View>

          {step.id === "welcome" ? (
            <View
              style={[
                styles.logoWrap,
                { backgroundColor: APP_LAUNCHER_ICON_BACKGROUND },
              ]}
            >
              <Image
                source={appLauncherForeground}
                style={styles.logoForeground}
                contentFit="cover"
              />
            </View>
          ) : null}

          <Text style={styles.title}>{step.title}</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {step.body ? <Text style={styles.body}>{step.body}</Text> : null}
            {step.bullets?.map((bullet) => (
              <View key={bullet.text} style={styles.bulletRow}>
                {bullet.icon ? (
                  <Ionicons
                    name={bullet.icon}
                    size={20}
                    color={resolveGuideIconColor(bullet.color, theme)}
                    style={styles.bulletIcon}
                  />
                ) : (
                  <View style={styles.bulletDot} />
                )}
                <Text style={styles.bulletText}>{bullet.text}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.dotsRow}>
            {steps.map((s, i) => (
              <View
                key={s.id}
                style={[styles.dot, i === stepIndex && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.footer}>
            {!isFirst ? (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setStepIndex((i) => Math.max(i - 1, 0))}
              >
                <Text style={styles.secondaryBtnText}>Quay lại</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleSkip}>
                <Text style={styles.secondaryBtnText}>Bỏ qua</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.primaryBtn, styles.primaryBtnWide]}
              onPress={handlePrimary}
            >
              <Text style={styles.primaryBtnText}>
                {isLast ? "Bắt đầu học" : "Tiếp theo"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
