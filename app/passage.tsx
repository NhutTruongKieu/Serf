import { VocabularyNumberGraphic } from "@/components/vocabulary-number-graphic";
import { useAppSettings } from "@/contexts/app-settings";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getLearnNumberDigit } from "@/lib/number-voc-display";
import { playVocabularyMode, stopDeviceTts } from "@/lib/vocab-audio-playback";
import {
  keepEnglishWordsOnly,
  matchVocsInPassage,
  pickRandom,
} from "@/lib/vocab-passage-match";
import type { Vocabulary } from "@/lib/vocab-types";
import { createPassageStyles } from "@/styles/passage-styles";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PASSAGE_LIMIT = 15;
const MAX_PASSAGE_CHARS = 20000;

type Phase = "input" | "learn" | "empty";

export default function PassageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isMute } = useAppSettings();
  const { allVocs } = useVocabulary();
  const { theme } = useAppTheme();
  const styles = useMemo(
    () => createPassageStyles(theme, SCREEN_WIDTH),
    [theme]
  );

  const [phase, setPhase] = useState<Phase>("input");
  const [passage, setPassage] = useState("");
  const [matched, setMatched] = useState<Vocabulary[]>([]);
  const [queue, setQueue] = useState<Vocabulary[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const autoPlayGenRef = useRef(0);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    return () => {
      stopDeviceTts();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const normalizePassage = (text: string): string => {
    const cleaned = keepEnglishWordsOnly(text);
    return cleaned.length > MAX_PASSAGE_CHARS
      ? cleaned.slice(0, MAX_PASSAGE_CHARS)
      : cleaned;
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text.trim()) {
        Alert.alert("Clipboard trống", "Không có nội dung để dán.");
        return;
      }
      const cleaned = normalizePassage(text);
      if (!cleaned) {
        Alert.alert(
          "Không có từ tiếng Anh",
          "Nội dung dán không chứa từ tiếng Anh nào."
        );
        return;
      }
      setPassage(cleaned);
    } catch {
      Alert.alert("Không dán được", "Hãy thử dán thủ công vào ô nhập.");
    }
  };

  const findAndStart = () => {
    const trimmed = passage.trim();
    if (!trimmed) {
      Alert.alert("Chưa có nội dung", "Hãy dán hoặc gõ một đoạn văn tiếng Anh.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const all = matchVocsInPassage(allVocs, trimmed);
      setMatched(all);
      if (all.length === 0) {
        setQueue([]);
        setPhase("empty");
      } else {
        setQueue(pickRandom(all, PASSAGE_LIMIT));
        setIndex(0);
        setPhase("learn");
      }
      setLoading(false);
    }, 0);
  };

  const handleReshuffle = () => {
    if (matched.length === 0) return;
    setQueue(pickRandom(matched, PASSAGE_LIMIT));
    setIndex(0);
  };

  const stopActiveAudio = async () => {
    stopDeviceTts();
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        /* empty */
      }
      soundRef.current = null;
    }
  };

  const handleBackToInput = () => {
    void stopActiveAudio();
    setPhase("input");
    setQueue([]);
    setIndex(0);
  };

  const current = queue[index] ?? null;
  const total = queue.length;
  const numberValue = current ? getLearnNumberDigit(current) : null;

  const playSound = async (voc: Vocabulary | null) => {
    if (!voc) return;
    if (isMute) return;
    await playVocabularyMode(voc, "word", { isMute, soundRef });
  };

  useEffect(() => {
    if (!current) return;
    if (!current.sound && !current.useDeviceTts) return;
    const gen = ++autoPlayGenRef.current;
    void (async () => {
      await playSound(current);
      if (gen !== autoPlayGenRef.current) {
        await stopActiveAudio();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, isMute]);

  const handleNext = () => {
    if (total === 0) return;
    setIndex((prev) => Math.min(prev + 1, total));
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerSide}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="chevron-back" size={28} color={theme.iconTeal} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Học từ trong đoạn văn</Text>
      <View style={styles.headerSideRight}>
        {phase !== "input" && (
          <TouchableOpacity
            onPress={handleBackToInput}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="create-outline" size={26} color={theme.iconTeal} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (phase === "input") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {renderHeader()}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.inputBody, { paddingBottom: insets.bottom + 16 }]}
          keyboardVerticalOffset={insets.top + 48}
        >
          <Text style={styles.inputLabel}>
            Dán một đoạn văn tiếng Anh. Các từ không phải tiếng Anh sẽ tự động
            bị loại bỏ. App chọn ngẫu nhiên {PASSAGE_LIMIT} từ trong đoạn để học.
          </Text>
          <TextInput
            style={styles.textInput}
            value={passage}
            onChangeText={(t) => {
              const capped =
                t.length > MAX_PASSAGE_CHARS ? t.slice(0, MAX_PASSAGE_CHARS) : t;
              const isPaste = Math.abs(capped.length - passage.length) > 1;
              setPassage(isPaste ? normalizePassage(capped) : capped);
            }}
            placeholder="Paste your English paragraph here..."
            placeholderTextColor={theme.textMuted}
            multiline
            scrollEnabled
            textAlignVertical="top"
            autoCorrect={false}
            autoCapitalize="none"
            underlineColorAndroid="transparent"
            {...(Platform.OS === "android" ? { nestedScrollEnabled: true } : {})}
          />
          <Text style={styles.charCount}>
            {passage.length.toLocaleString()} / {MAX_PASSAGE_CHARS.toLocaleString()} ký tự
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnGhost]}
              onPress={handlePaste}
            >
              <Ionicons name="clipboard-outline" size={18} color={theme.textSecondary} />
              <Text style={styles.actionBtnGhostText}>Dán</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnGhost]}
              onPress={() => setPassage("")}
              disabled={!passage}
            >
              <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
              <Text style={styles.actionBtnGhostText}>Xóa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.actionBtnPrimary,
                (loading || !passage.trim()) && { opacity: 0.5 },
              ]}
              onPress={findAndStart}
              disabled={loading || !passage.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <Text style={styles.actionBtnPrimaryText}>
                    Tìm {PASSAGE_LIMIT} từ
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (phase === "empty") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {renderHeader()}
        <View style={styles.emptyWrap}>
          <Ionicons name="document-text-outline" size={72} color={theme.iconMuted} />
          <Text style={styles.emptyTitle}>Không tìm thấy từ nào</Text>
          <Text style={styles.emptySub}>
            Đoạn văn không chứa từ vựng nào trong kho. Hãy thử đoạn khác hoặc
            đoạn dài hơn.
          </Text>
          <TouchableOpacity style={styles.nextBtn} onPress={handleBackToInput}>
            <Text style={styles.nextBtnText}>← Nhập đoạn khác</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {renderHeader()}
        <View style={styles.emptyWrap}>
          <Ionicons name="checkmark-circle" size={72} color={theme.success} />
          <Text style={styles.emptyTitle}>Hoàn thành</Text>
          <Text style={styles.emptySub}>
            Bạn đã đi hết {total} từ trong đoạn. Bốc lại bộ {PASSAGE_LIMIT} từ
            khác từ đoạn này hoặc nhập đoạn mới.
          </Text>
        </View>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          {matched.length > 0 && (
            <TouchableOpacity style={styles.masteredBtn} onPress={handleReshuffle}>
              <Text style={styles.masteredBtnText}>
                Bốc lại {PASSAGE_LIMIT} từ ↻
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={handleBackToInput}>
            <Text style={styles.nextBtnText}>Nhập đoạn khác</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {renderHeader()}

      <Text style={styles.poolCount}>
        Tìm thấy {matched.length} từ · Học {Math.min(index + 1, total)}/{total}
      </Text>

      <View style={styles.cardArea}>
        <View style={styles.card}>
          <Pressable onPress={() => void playSound(current)}>
            {numberValue != null ? (
              <VocabularyNumberGraphic
                value={numberValue}
                theme={theme}
                style={styles.image}
              />
            ) : (
              <Image
                source={current.image}
                style={styles.image}
                contentFit="cover"
              />
            )}
          </Pressable>

          <Pressable
            style={{ alignItems: "center" }}
            onPress={() => void playSound(current)}
          >
            <Text style={styles.word}>{current.voc}</Text>
            {!!current.ipa && <Text style={styles.ipa}>{current.ipa}</Text>}
          </Pressable>

          <View style={styles.divider} />
          <Text style={styles.meaning}>{current.meaning}</Text>

          <View style={styles.iconRow}>
            <Ionicons
              name="book"
              size={28}
              color={theme.iconTeal}
              onPress={() =>
                void playVocabularyMode(current, "meaning", { isMute, soundRef })
              }
              style={styles.soundBtn}
            />
            <Ionicons
              name="chatbox-ellipses"
              size={28}
              color={theme.success}
              onPress={() =>
                void playVocabularyMode(current, "example", { isMute, soundRef })
              }
              style={styles.soundBtn}
            />
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.masteredBtn} onPress={handleNext}>
          <Text style={styles.masteredBtnText}>Tiếp →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
