import { vocs as allVocs } from "@/assets/vocs";
import { VocabularyNumberGraphic } from "@/components/vocabulary-number-graphic";
import { useAppSettings } from "@/contexts/app-settings";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  CATEGORY_LABELS_VI,
  isCategoryUnlocked,
  VOCAB_CATEGORY_ORDER,
} from "@/lib/category-unlock";
import { getLearnNumberDigit } from "@/lib/number-voc-display";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { playVocabularyMode, stopDeviceTts } from "@/lib/vocab-audio-playback";
import { getFilteredVocs, getSetsForCategory } from "@/lib/vocab-sets";
import { countRemainingInSet } from "@/lib/vocab-storage";
import { createReviewStyles } from "@/styles/review-styles";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ReviewScope = "set" | "category" | "all";
const REVIEW_SCOPES: ReviewScope[] = ["set", "category", "all"];
const SCOPE_LABEL_SHORT: Record<ReviewScope, string> = {
  set: "Bộ",
  category: "Loại",
  all: "Tất cả",
};
const ALL_SCOPE_LIMIT = 20;

async function getUnlockedCategorySet(): Promise<Set<string>> {
  const progress: Record<string, { remaining: number; total: number }> = {};
  for (const cat of VOCAB_CATEGORY_ORDER) {
    const sets = getSetsForCategory(allVocs, cat);
    let total = 0;
    let remaining = 0;
    for (let i = 0; i < sets.length; i++) {
      const setTotal = sets[i].length;
      total += setTotal;
      try {
        remaining += await countRemainingInSet(cat, i, sets[i]);
      } catch {
        remaining += setTotal;
      }
    }
    progress[cat] = { remaining, total };
  }
  const unlocked = new Set<string>();
  for (const cat of VOCAB_CATEGORY_ORDER) {
    if (isCategoryUnlocked(cat, progress)) unlocked.add(cat);
  }
  return unlocked;
}

function parseReviewScope(value: string | null): ReviewScope {
  if (value === "category" || value === "all") return value;
  return "set";
}

export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isMute } = useAppSettings();
  const { theme } = useAppTheme();
  const styles = useMemo(
    () => createReviewStyles(theme, SCREEN_WIDTH),
    [theme]
  );

  const [setVocs, setSetVocs] = useState<typeof allVocs>([]);
  const [setLabel, setSetLabel] = useState<string>("");
  const [scope, setScope] = useState<ReviewScope>("set");
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const soundRef = useRef<Audio.Sound | null>(null);
  const autoPlayGenRef = useRef(0);

  const shuffleArray = useCallback(<T,>(items: T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, []);

  const loadAndShuffle = useCallback(
    async (chosenScope: ReviewScope) => {
      setLoading(true);
      try {
        const savedCat =
          (await AsyncStorage.getItem(STORAGE_KEYS.currentCategory)) ?? "All";
        const savedSetRaw =
          (await AsyncStorage.getItem(STORAGE_KEYS.currentSet)) ?? "0";
        const savedSetIdx = Math.max(0, parseInt(savedSetRaw, 10) || 0);

        let pool: typeof allVocs = [];
        let label = "";

        if (chosenScope === "all") {
          const unlocked = await getUnlockedCategorySet();
          pool = allVocs.filter((v) => unlocked.has(v.category));
          label = `Tất cả · ${ALL_SCOPE_LIMIT} từ ngẫu nhiên`;
        } else if (chosenScope === "category") {
          pool = getFilteredVocs(allVocs, savedCat);
          const catLabel = CATEGORY_LABELS_VI[savedCat] ?? savedCat;
          label = `${catLabel} · ${ALL_SCOPE_LIMIT} từ ngẫu nhiên`;
        } else {
          const sets = getSetsForCategory(allVocs, savedCat);
          pool = sets[savedSetIdx] ?? sets[0] ?? [];
          const catLabel = CATEGORY_LABELS_VI[savedCat] ?? savedCat;
          label = `${catLabel} · Bộ ${
            Math.min(savedSetIdx, Math.max(0, sets.length - 1)) + 1
          }`;
        }

        const shuffled = shuffleArray(pool);
        const limited =
          chosenScope === "set" ? shuffled : shuffled.slice(0, ALL_SCOPE_LIMIT);
        setSetVocs(limited);
        setIndex(0);
        setSetLabel(label);
      } finally {
        setLoading(false);
      }
    },
    [shuffleArray]
  );

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const savedScope = parseReviewScope(
          await AsyncStorage.getItem(STORAGE_KEYS.reviewScope)
        );
        setScope(savedScope);
        await loadAndShuffle(savedScope);
      })();
    }, [loadAndShuffle])
  );

  const selectScope = (next: ReviewScope) => {
    if (next === scope) return;
    setScope(next);
    void AsyncStorage.setItem(STORAGE_KEYS.reviewScope, next);
    void loadAndShuffle(next);
  };

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

  const current = setVocs[index] ?? null;
  const total = setVocs.length;
  const reviewNumberValue = current ? getLearnNumberDigit(current) : null;

  const playSound = async (voc: (typeof allVocs)[0] | null) => {
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
        stopDeviceTts();
        if (soundRef.current) {
          try {
            await soundRef.current.unloadAsync();
          } catch {
            /* empty */
          }
          soundRef.current = null;
        }
      }
    })();
  }, [current?.id, isMute]);

  const handleNext = () => {
    if (total === 0) return;
    setIndex((prev) => Math.min(prev + 1, total));
  };

  const handleReshuffle = () => {
    if (scope !== "set") {
      void loadAndShuffle(scope);
      return;
    }
    if (total === 0) return;
    setSetVocs((prev) => shuffleArray(prev));
    setIndex(0);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.accent} style={{ flex: 1 }} />
      </View>
    );
  }

  if (total === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerSide}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={28} color={theme.iconTeal} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bộ trộn</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="shuffle" size={72} color={theme.success} />
          <Text style={styles.emptyTitle}>Không có từ trong bộ này</Text>
          <Text style={styles.emptySub}>Hãy chọn một bộ từ trong màn hình học rồi vào lại.</Text>
        </View>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerSide}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={28} color={theme.iconTeal} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bộ trộn</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="shuffle" size={72} color={theme.success} />
          <Text style={styles.emptyTitle}>Hoàn thành</Text>
          <Text style={styles.emptySub}>Bạn đã đi hết các từ trong bộ. Bấm “Trộn lại” để học tiếp.</Text>
        </View>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleReshuffle}>
            <Text style={styles.nextBtnText}>Trộn lại ↻</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.iconTeal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bộ trộn</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.scopeRow}>
        {REVIEW_SCOPES.map((s, i) => {
          const isActive = s === scope;
          return (
            <TouchableOpacity
              key={s}
              style={[
                styles.scopeBtn,
                i === 0 && styles.scopeBtnLeft,
                i === REVIEW_SCOPES.length - 1 && styles.scopeBtnRight,
                isActive && styles.scopeBtnActive,
              ]}
              onPress={() => selectScope(s)}
            >
              <Text
                style={[
                  styles.scopeBtnText,
                  isActive && styles.scopeBtnTextActive,
                ]}
              >
                {SCOPE_LABEL_SHORT[s]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.poolCount}>
        {setLabel} · {Math.min(index + 1, total)}/{total}
      </Text>

      <View style={styles.cardArea}>
        <View style={styles.card}>
          <Pressable onPress={() => void playSound(current)}>
            {reviewNumberValue != null ? (
              <VocabularyNumberGraphic
                value={reviewNumberValue}
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

          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => void playSound(current)}
          >
            <Ionicons
              name={isMute ? "volume-mute" : "volume-high"}
              size={28}
              color={isMute ? theme.iconMuted : theme.success}
            />
            <Text style={styles.playBtnText}>Nghe lại từ</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            {scope === "set"
              ? "Trộn toàn bộ từ trong 1 bộ để luyện"
              : scope === "category"
                ? `Bốc ngẫu nhiên ${ALL_SCOPE_LIMIT} từ trong loại đang chọn`
                : `Bốc ngẫu nhiên ${ALL_SCOPE_LIMIT} từ trong các loại đã mở khóa`}
          </Text>
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
