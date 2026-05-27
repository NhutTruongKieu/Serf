import { vocs as allVocs } from "@/assets/vocs";
import { VocabularyNumberGraphic } from "@/components/vocabulary-number-graphic";
import { useAppSettings } from "@/contexts/app-settings";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getLearnNumberDigit } from "@/lib/number-voc-display";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { playVocabularyMode, stopDeviceTts } from "@/lib/vocab-audio-playback";
import { getSetsForCategory } from "@/lib/vocab-sets";
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

  const loadSetAndShuffle = useCallback(async () => {
    setLoading(true);
    try {
      const savedCat = (await AsyncStorage.getItem(STORAGE_KEYS.currentCategory)) ?? "All";
      const savedSetRaw = (await AsyncStorage.getItem(STORAGE_KEYS.currentSet)) ?? "0";
      const savedSetIdx = Math.max(0, parseInt(savedSetRaw, 10) || 0);

      const sets = getSetsForCategory(allVocs, savedCat);
      const chosenSet = sets[savedSetIdx] ?? sets[0] ?? [];
      const shuffled = shuffleArray(chosenSet);

      setSetVocs(shuffled);
      setIndex(0);
      setSetLabel(`${savedCat} · Bộ ${Math.min(savedSetIdx, Math.max(0, sets.length - 1)) + 1}`);
    } finally {
      setLoading(false);
    }
  }, [shuffleArray]);

  useFocusEffect(
    useCallback(() => {
      void loadSetAndShuffle();
    }, [loadSetAndShuffle])
  );

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

          <Text style={styles.hint}>Trộn toàn bộ từ trong 1 bộ để luyện</Text>
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
