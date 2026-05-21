import { useAppSettings } from "@/contexts/app-settings";
import { clearAllLearnedProgress, clearCurrentSetProgress } from "@/lib/vocab-progress";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>
) {
  Alert.alert(title, message, [
    { text: "Hủy", style: "cancel" },
    {
      text: "Xác nhận",
      style: "destructive",
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isMute,
    setIsMute,
    soundIconsAlign,
    setSoundIconsAlign,
    bumpProgressReload,
  } = useAppSettings();

  const appVersion =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  const handleResetCurrentSet = () => {
    confirmAction(
      "Đặt lại bộ hiện tại",
      "Tiến độ học của bộ từ đang chọn sẽ bị xóa. Các bộ khác không đổi.",
      async () => {
        await clearCurrentSetProgress();
        bumpProgressReload();
        Alert.alert("Đã xong", "Bộ hiện tại đã được đặt lại.");
      }
    );
  };

  const handleResetAll = () => {
    confirmAction(
      "Đặt lại toàn bộ",
      "Toàn bộ tiến độ học thuộc của mọi bộ sẽ bị xóa. Thao tác không thể hoàn tác.",
      async () => {
        await clearAllLearnedProgress();
        bumpProgressReload();
        Alert.alert("Đã xong", "Toàn bộ tiến độ đã được đặt lại.");
      }
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color="#a8dadc" />
        </TouchableOpacity>
        <Text style={styles.title}>Cài đặt</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={styles.sectionLabel}>Âm thanh</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Ionicons name="volume-mute-outline" size={22} color="#4ade80" />
              <View style={styles.rowLabels}>
                <Text style={styles.rowTitle}>Tắt phát âm tự động</Text>
                <Text style={styles.rowSubtitle}>
                  Không tự phát khi chuyển từ hoặc đổi bộ
                </Text>
              </View>
            </View>
            <Switch
              value={isMute}
              onValueChange={setIsMute}
              trackColor={{ false: "#3a3a5c", true: "#e94560" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Giao diện thẻ từ</Text>
        <View style={styles.card}>
          <View style={styles.rowColumn}>
            <View style={styles.rowText}>
              <Ionicons name="swap-horizontal-outline" size={22} color="#a8dadc" />
              <View style={styles.rowLabels}>
                <Text style={styles.rowTitle}>Vị trí Meaning & Example</Text>
                <Text style={styles.rowSubtitle}>
                  Icon sách (nghĩa) và hội thoại (ví dụ) trên thẻ từ
                </Text>
              </View>
            </View>
            <View style={styles.segment}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  styles.segmentBtnLeft,
                  soundIconsAlign === "left" && styles.segmentBtnActive,
                ]}
                onPress={() => setSoundIconsAlign("left")}
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={soundIconsAlign === "left" ? "#fff" : "#888"}
                />
                <Text
                  style={[
                    styles.segmentText,
                    soundIconsAlign === "left" && styles.segmentTextActive,
                  ]}
                >
                  Trái
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  styles.segmentBtnRight,
                  soundIconsAlign === "right" && styles.segmentBtnActive,
                ]}
                onPress={() => setSoundIconsAlign("right")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    soundIconsAlign === "right" && styles.segmentTextActive,
                  ]}
                >
                  Phải
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={soundIconsAlign === "right" ? "#fff" : "#888"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Tiến độ học</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleResetCurrentSet}>
            <Ionicons name="refresh-outline" size={22} color="#fbbf24" />
            <View style={styles.rowLabels}>
              <Text style={styles.rowTitle}>Đặt lại bộ đang học</Text>
              <Text style={styles.rowSubtitle}>
                Học lại từ đầu bộ từ vựng hiện tại
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleResetAll}>
            <Ionicons name="trash-outline" size={22} color="#e94560" />
            <View style={styles.rowLabels}>
              <Text style={[styles.rowTitle, styles.dangerText]}>
                Đặt lại toàn bộ tiến độ
              </Text>
              <Text style={styles.rowSubtitle}>
                Xóa tiến độ tất cả chủ đề và bộ từ
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Ứng dụng</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Ionicons name="information-circle-outline" size={22} color="#a8dadc" />
              <View style={styles.rowLabels}>
                <Text style={styles.rowTitle}>Phiên bản</Text>
                <Text style={styles.rowSubtitle}>Serf · com.truongkieu.Serf</Text>
              </View>
            </View>
            <Text style={styles.versionBadge}>{appVersion}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
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
    color: "#fff",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  rowSubtitle: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  dangerText: {
    color: "#fca5a5",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 16,
  },
  versionBadge: {
    color: "#4ade80",
    fontSize: 15,
    fontWeight: "700",
  },
  rowColumn: {
    padding: 16,
    gap: 14,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
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
    backgroundColor: "#e94560",
  },
  segmentText: {
    color: "#888",
    fontSize: 15,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#fff",
  },
});
