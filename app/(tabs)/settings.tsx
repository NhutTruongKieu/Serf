import { useAppSettings } from "@/contexts/app-settings";
import { useAuth } from "@/contexts/auth-context";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  backupErrorMessage,
  exportAppData,
  importAppDataFromPicker,
} from "@/lib/data-backup";
import {
  apkgImportErrorMessage,
  pickAndParseApkg,
} from "@/lib/anki-apkg-import";
import {
  importApkgDeck,
  listImportedDecks,
  removeImportedDeck,
  type ImportedDeckMeta,
} from "@/lib/imported-vocab-storage";
import { GOOGLE_LOGIN_ENABLED } from "@/lib/google-auth-config";
import {
  downloadBackupFromGoogleDrive,
  getGoogleBackupTimestamp,
  uploadBackupToGoogleDrive,
} from "@/lib/google-drive-backup";
import { clearAllLearnedProgress, clearCurrentSetProgress } from "@/lib/vocab-progress";
import {
  VOC_SOUND_MODES,
  VOC_SOUND_MODE_LABEL_VI,
} from "@/lib/vocab-audio-playback";
import { createSettingsStyles } from "@/styles/settings-styles";
import { AppGuideModal } from "@/components/app-guide-modal";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
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
  const { user, signOut, signInWithGoogle, getAccessToken } = useAuth();
  const {
    isMute,
    setIsMute,
    soundIconsAlign,
    setSoundIconsAlign,
    soundIconsInlinePicker,
    setSoundIconsInlinePicker,
    themeMode,
    setThemeMode,
    learningSoundMode,
    setLearningSoundMode,
    bumpProgressReload,
    bumpVocabReload,
    reloadFromStorage,
  } = useAppSettings();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createSettingsStyles(theme), [theme]);
  const [busyAction, setBusyAction] = useState<
    "export" | "import" | "google-up" | "google-down" | "apkg-import" | null
  >(null);
  const [googleBackupAt, setGoogleBackupAt] = useState<string | null>(null);
  const [importedDecks, setImportedDecks] = useState<ImportedDeckMeta[]>([]);
  const [isGuideVisible, setIsGuideVisible] = useState(false);

  const refreshGoogleBackupTime = useCallback(async () => {
    setGoogleBackupAt(await getGoogleBackupTimestamp());
  }, []);

  useEffect(() => {
    if (user) void refreshGoogleBackupTime();
    else setGoogleBackupAt(null);
  }, [user, refreshGoogleBackupTime]);

  const refreshImportedDecks = useCallback(async () => {
    setImportedDecks(await listImportedDecks());
  }, []);

  useEffect(() => {
    void refreshImportedDecks();
  }, [refreshImportedDecks]);

  const formatBackupTime = (iso: string | null) => {
    if (!iso) return "Chưa có bản sao lưu trên Google";
    try {
      return new Date(iso).toLocaleString("vi-VN");
    } catch {
      return iso;
    }
  };

  const appVersion =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  const selectSoundIconsAlign = (align: "left" | "center" | "right") => {
    setSoundIconsAlign(align);
  };

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

  const handleGoogleUpload = async () => {
    if (busyAction) return;
    setBusyAction("google-up");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("NOT_SIGNED_IN");
      const { entryCount, backedUpAt } = await uploadBackupToGoogleDrive(token);
      setGoogleBackupAt(backedUpAt);
      Alert.alert(
        "Đã sao lưu lên Google",
        `Đã lưu ${entryCount} mục (tiến độ & cài đặt) vào tài khoản Google của bạn.`
      );
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      const msg = backupErrorMessage(code);
      if (msg) Alert.alert("Sao lưu Google thất bại", msg);
    } finally {
      setBusyAction(null);
    }
  };

  const runGoogleRestore = async () => {
    setBusyAction("google-down");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("NOT_SIGNED_IN");
      const { entryCount, backedUpAt } = await downloadBackupFromGoogleDrive(
        token,
        true
      );
      if (backedUpAt) setGoogleBackupAt(backedUpAt);
      await reloadFromStorage();
      bumpProgressReload();
      Alert.alert(
        "Khôi phục thành công",
        `Đã tải ${entryCount} mục từ Google Drive. Quay lại màn học để xem tiến độ.`
      );
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      const msg = backupErrorMessage(code);
      if (msg) Alert.alert("Khôi phục thất bại", msg);
    } finally {
      setBusyAction(null);
    }
  };

  const handleGoogleRestore = () => {
    if (busyAction) return;
    Alert.alert(
      "Khôi phục từ Google",
      "Dữ liệu trên thiết bị (tiến độ & cài đặt) sẽ được thay bằng bản sao lưu trên Google.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Khôi phục",
          style: "destructive",
          onPress: () => void runGoogleRestore(),
        },
      ]
    );
  };

  const handleExport = async () => {
    if (busyAction) return;
    setBusyAction("export");
    try {
      const { entryCount } = await exportAppData();
      Alert.alert(
        "Xuất thành công",
        `Đã tạo file sao lưu với ${entryCount} mục dữ liệu (tiến độ học, cài đặt, bộ từ đang chọn).`
      );
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      const msg = backupErrorMessage(code);
      if (msg) Alert.alert("Xuất thất bại", msg);
    } finally {
      setBusyAction(null);
    }
  };

  const runImport = async (replaceExisting: boolean) => {
    setBusyAction("import");
    try {
      const { entryCount } = await importAppDataFromPicker(replaceExisting);
      await reloadFromStorage();
      bumpProgressReload();
      Alert.alert(
        "Nhập thành công",
        `Đã khôi phục ${entryCount} mục dữ liệu. Quay lại màn học để xem tiến độ mới.`
      );
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      const msg = backupErrorMessage(code);
      if (msg) Alert.alert("Nhập thất bại", msg);
    } finally {
      setBusyAction(null);
    }
  };

  const handleImport = () => {
    if (busyAction) return;
    Alert.alert(
      "Nhập dữ liệu",
      "Chọn file JSON đã xuất từ Serf. Dữ liệu hiện tại (tiến độ & cài đặt) sẽ được thay thế.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Chọn file",
          onPress: () => {
            void runImport(true);
          },
        },
      ]
    );
  };

  const runApkgImport = async () => {
    setBusyAction("apkg-import");
    try {
      const parsed = await pickAndParseApkg();
      const meta = await importApkgDeck(parsed);
      await refreshImportedDecks();
      bumpVocabReload();
      Alert.alert(
        "Import thành công",
        `Đã thêm ${meta.wordCount} từ từ deck "${meta.name}". Mở mục "Nhập: ${meta.name}" trên màn học để bắt đầu.`
      );
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      const msg =
        apkgImportErrorMessage(code) ||
        (e instanceof Error ? e.message : "Không thể import file APKG.");
      if (msg) Alert.alert("Import thất bại", msg);
    } finally {
      setBusyAction(null);
    }
  };

  const handleImportApkg = () => {
    if (busyAction) return;
    Alert.alert(
      "Import từ vựng Anki",
      "Chọn file .apkg (deck Anki). Hỗ trợ deck 4000 Essential English Words, Basic 2 mặt và Anki mới (anki21b). Deck lớn chỉ import nội dung chữ — dùng TTS thiết bị cho âm thanh.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Chọn file .apkg",
          onPress: () => void runApkgImport(),
        },
      ]
    );
  };

  const handleRemoveImportedDeck = (deck: ImportedDeckMeta) => {
    confirmAction(
      "Xóa bộ từ đã import",
      `Xóa "${deck.name}" (${deck.wordCount} từ) khỏi app? Tiến độ học của bộ này cũng sẽ mất.`,
      async () => {
        await removeImportedDeck(deck.id);
        await refreshImportedDecks();
        bumpVocabReload();
        Alert.alert("Đã xong", `Đã xóa bộ "${deck.name}".`);
      }
    );
  };

  const handleSignOut = () => {
    confirmAction(
      "Đăng xuất",
      "Bạn có chắc muốn đăng xuất khỏi Google trên thiết bị này?",
      async () => {
        await signOut();
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
      <AppGuideModal
        visible={isGuideVisible}
        onClose={() => setIsGuideVisible(false)}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.iconTeal} />
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
        {user || GOOGLE_LOGIN_ENABLED ? (
          <>
            <Text style={styles.sectionLabel}>Tài khoản</Text>
            <View style={styles.card}>
              {user ? (
                <>
                  <View style={styles.accountRow}>
                    {user.photoUrl ? (
                      <Image
                        source={{ uri: user.photoUrl }}
                        style={styles.avatar}
                        accessibilityLabel="Ảnh đại diện"
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons
                          name="person"
                          size={26}
                          color={theme.iconTeal}
                        />
                      </View>
                    )}
                    <View style={styles.rowLabels}>
                      <Text style={styles.rowTitle}>{user.name}</Text>
                      <Text style={styles.rowSubtitle}>{user.email}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.signOutBtn}
                    onPress={handleSignOut}
                  >
                    <Text style={styles.signOutText}>Đăng xuất</Text>
                  </TouchableOpacity>
                </>
              ) : GOOGLE_LOGIN_ENABLED ? (
                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={() => void signInWithGoogle()}
                >
                  <Ionicons name="logo-google" size={22} color="#4285F4" />
                  <Text style={styles.googleBtnText}>Đăng nhập với Google</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Âm thanh</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Ionicons name="volume-mute-outline" size={22} color={theme.success} />
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
              trackColor={{ false: theme.switchTrackOff, true: theme.accent }}
              thumbColor={theme.floatingBtnText}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rowColumn}>
            <View style={styles.rowText}>
              <Ionicons name="volume-high-outline" size={22} color={theme.success} />
              <View style={styles.rowLabels}>
                <Text style={styles.rowTitle}>Phát âm mặc định (học từ)</Text>
                <Text style={styles.rowSubtitle}>
                  Tự phát khi chuyển từ trên màn học, quiz và đoạn văn
                </Text>
              </View>
            </View>
            <View style={styles.segment}>
              {VOC_SOUND_MODES.map((mode, i) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.segmentBtn,
                    i === 0 && styles.segmentBtnLeft,
                    i === VOC_SOUND_MODES.length - 1 && styles.segmentBtnRight,
                    learningSoundMode === mode && styles.segmentBtnActive,
                  ]}
                  onPress={() => setLearningSoundMode(mode)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      learningSoundMode === mode && styles.segmentTextActive,
                    ]}
                  >
                    {VOC_SOUND_MODE_LABEL_VI[mode]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Giao diện</Text>
        <View style={styles.card}>
          <View style={styles.rowColumn}>
            <View style={styles.rowText}>
              <Ionicons
                name={themeMode === "light" ? "sunny-outline" : "moon-outline"}
                size={22}
                color={theme.iconTeal}
              />
              <View style={styles.rowLabels}>
                <Text style={styles.rowTitle}>Chế độ màu</Text>
                <Text style={styles.rowSubtitle}>
                  Tối (mặc định) hoặc sáng cho toàn app
                </Text>
              </View>
            </View>
            <View style={styles.segment}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  styles.segmentBtnLeft,
                  themeMode === "dark" && styles.segmentBtnActive,
                ]}
                onPress={() => setThemeMode("dark")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    themeMode === "dark" && styles.segmentTextActive,
                  ]}
                >
                  Tối
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  styles.segmentBtnRight,
                  themeMode === "light" && styles.segmentBtnActive,
                ]}
                onPress={() => setThemeMode("light")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    themeMode === "light" && styles.segmentTextActive,
                  ]}
                >
                  Sáng
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Giao diện thẻ từ</Text>
        <View style={styles.card}>
          <View style={styles.rowColumn}>
            <View style={styles.rowText}>
              <Ionicons name="swap-horizontal-outline" size={22} color={theme.iconTeal} />
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
                onPress={() => selectSoundIconsAlign("left")}
              >
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
                  soundIconsAlign === "center" && styles.segmentBtnActive,
                ]}
                onPress={() => selectSoundIconsAlign("center")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    soundIconsAlign === "center" && styles.segmentTextActive,
                  ]}
                >
                  Giữa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  styles.segmentBtnRight,
                  soundIconsAlign === "right" && styles.segmentBtnActive,
                ]}
                onPress={() => selectSoundIconsAlign("right")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    soundIconsAlign === "right" && styles.segmentTextActive,
                  ]}
                >
                  Phải
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Ionicons
                name="radio-button-on-outline"
                size={22}
                color={theme.iconTeal}
              />
              <View style={styles.rowLabels}>
                <Text style={styles.rowTitle}>Chọn vị trí trên thẻ từ</Text>
                <Text style={styles.rowSubtitle}>
                  Hiện ô chọn ở 2 vị trí còn lại để chạm đổi nhanh ngoài thẻ từ
                </Text>
              </View>
            </View>
            <Switch
              value={soundIconsInlinePicker}
              onValueChange={setSoundIconsInlinePicker}
              trackColor={{ false: theme.switchTrackOff, true: theme.accent }}
              thumbColor={theme.floatingBtnText}
            />
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
            <Ionicons name="chevron-forward" size={20} color={theme.iconMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleResetAll}>
            <Ionicons name="trash-outline" size={22} color={theme.danger} />
            <View style={styles.rowLabels}>
              <Text style={[styles.rowTitle, styles.dangerText]}>
                Đặt lại toàn bộ tiến độ
              </Text>
              <Text style={styles.rowSubtitle}>
                Xóa tiến độ tất cả chủ đề và bộ từ
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.iconMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Từ vựng</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleImportApkg}
            disabled={busyAction !== null}
          >
            <Ionicons name="albums-outline" size={22} color={theme.success} />
            <View style={styles.rowLabels}>
              <Text style={styles.rowTitle}>Import từ Anki (.apkg)</Text>
              <Text style={styles.rowSubtitle}>
                {busyAction === "apkg-import"
                  ? "Đang đọc deck Anki..."
                  : "Thêm bộ từ vựng từ file deck Anki"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.iconMuted} />
          </TouchableOpacity>

          {importedDecks.length > 0 ? (
            <>
              <View style={styles.divider} />
              {importedDecks.map((deck, idx) => (
                <View key={deck.id}>
                  {idx > 0 ? <View style={styles.divider} /> : null}
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => handleRemoveImportedDeck(deck)}
                    disabled={busyAction !== null}
                  >
                    <Ionicons name="book-outline" size={22} color={theme.iconTeal} />
                    <View style={styles.rowLabels}>
                      <Text style={styles.rowTitle}>{deck.name}</Text>
                      <Text style={styles.rowSubtitle}>
                        {deck.wordCount} từ ·{" "}
                        {new Date(deck.importedAt).toLocaleString("vi-VN")}
                      </Text>
                    </View>
                    <Ionicons name="trash-outline" size={20} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>Sao lưu dữ liệu</Text>
        <View style={styles.card}>
          {user ? (
            <>
              <View style={[styles.actionRow, { opacity: busyAction ? 0.7 : 1 }]}>
                <Ionicons name="cloud-outline" size={22} color={theme.iconTeal} />
                <View style={styles.rowLabels}>
                  <Text style={styles.rowTitle}>Google Drive</Text>
                  <Text style={styles.rowSubtitle}>
                    {formatBackupTime(googleBackupAt)}
                    {"\n"}
                    Lưu ẩn theo tài khoản Google (sau khi đăng nhập tự sao lưu 1 lần)
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => void handleGoogleUpload()}
                disabled={busyAction !== null}
              >
                <Ionicons name="cloud-upload-outline" size={22} color={theme.success} />
                <View style={styles.rowLabels}>
                  <Text style={styles.rowTitle}>Sao lưu lên Google</Text>
                  <Text style={styles.rowSubtitle}>
                    {busyAction === "google-up"
                      ? "Đang tải lên..."
                      : "Cập nhật tiến độ học & cài đặt lên Drive"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.iconMuted} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleGoogleRestore}
                disabled={busyAction !== null}
              >
                <Ionicons name="cloud-download-outline" size={22} color={theme.iconTeal} />
                <View style={styles.rowLabels}>
                  <Text style={styles.rowTitle}>Khôi phục từ Google</Text>
                  <Text style={styles.rowSubtitle}>
                    {busyAction === "google-down"
                      ? "Đang tải xuống..."
                      : "Thay dữ liệu máy bằng bản trên Drive"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.iconMuted} />
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          ) : null}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => void handleExport()}
            disabled={busyAction !== null}
          >
            <Ionicons name="share-outline" size={22} color={theme.iconTeal} />
            <View style={styles.rowLabels}>
              <Text style={styles.rowTitle}>Xuất dữ liệu</Text>
              <Text style={styles.rowSubtitle}>
                {busyAction === "export"
                  ? "Đang tạo file..."
                  : "Lưu tiến độ học và cài đặt ra file JSON"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.iconMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleImport}
            disabled={busyAction !== null}
          >
            <Ionicons name="download-outline" size={22} color={theme.success} />
            <View style={styles.rowLabels}>
              <Text style={styles.rowTitle}>Nhập dữ liệu</Text>
              <Text style={styles.rowSubtitle}>
                {busyAction === "import"
                  ? "Đang đọc file..."
                  : "Khôi phục từ file JSON đã xuất trước đó"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.iconMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Ứng dụng</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setIsGuideVisible(true)}
          >
            <Ionicons name="help-circle-outline" size={22} color={theme.iconTeal} />
            <View style={styles.rowLabels}>
              <Text style={styles.rowTitle}>Hướng dẫn sử dụng</Text>
              <Text style={styles.rowSubtitle}>
                Cách học flashcard, chọn bộ, ôn tập và sao lưu dữ liệu
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.iconMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Ionicons name="information-circle-outline" size={22} color={theme.iconTeal} />
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

