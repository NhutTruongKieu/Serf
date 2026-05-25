import { vocs as allVocs } from "@/assets/vocs";
import { useAppSettings } from "@/contexts/app-settings";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  buildReviewSessionPool,
  getReviewPool,
  markReviewMastered,
  pickRandomReviewVoc,
  REVIEW_SESSION_WORD_LIMIT,
} from "@/lib/vocab-review";
import { createReviewStyles } from "@/styles/review-styles";
import { Ionicons } from "@expo/vector-icons";
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

  const [pool, setPool] = useState<typeof allVocs>([]);
  const [sessionSize, setSessionSize] = useState(0);
  const [current, setCurrent] = useState<(typeof allVocs)[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const soundRef = useRef<Audio.Sound | null>(null);
  const autoPlayGenRef = useRef(0);

  const loadPoolAndPick = useCallback(
    async (excludeId?: string) => {
      setLoading(true);
      try {
        const reviewPool = await getReviewPool(allVocs);
        const sessionPool = buildReviewSessionPool(reviewPool);
        setSessionSize(sessionPool.length);
        setPool(sessionPool);
        setCurrent(pickRandomReviewVoc(sessionPool, excludeId));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      void loadPoolAndPick();
    }, [loadPoolAndPick])
  );

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playSound = async (soundSource: unknown) => {
    if (isMute || !soundSource) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        soundSource as Parameters<typeof Audio.Sound.createAsync>[0],
        { shouldPlay: true }
      );
      soundRef.current = sound;
    } catch {
      // ignore playback errors
    }
  };

  useEffect(() => {
    if (!current?.sound) return;
    const gen = ++autoPlayGenRef.current;
    void (async () => {
      await playSound(current.sound);
      if (gen !== autoPlayGenRef.current && soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch {
          /* empty */
        }
        soundRef.current = null;
      }
    })();
  }, [current?.id, isMute]);

  const handleMastered = async () => {
    if (!current) return;
    const id = current.id;
    await markReviewMastered(id);
    const nextPool = pool.filter((v) => v.id !== id);
    setPool(nextPool);
    setCurrent(pickRandomReviewVoc(nextPool, id));
  };

  const handleNextRandom = () => {
    if (pool.length === 0) return;
    setCurrent(pickRandomReviewVoc(pool, current?.id));
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.accent} style={{ flex: 1 }} />
      </View>
    );
  }

  if (pool.length === 0 || !current) {
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
          <Text style={styles.headerTitle}>Kiểm tra ngẫu nhiên</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="checkmark-done-circle" size={72} color={theme.success} />
          <Text style={styles.emptyTitle}>
            {sessionSize === 0
              ? "Chưa có từ để kiểm tra"
              : "Hoàn thành phiên kiểm tra"}
          </Text>
          <Text style={styles.emptySub}>
            {sessionSize === 0
              ? "Hãy đánh dấu từ đã học thuộc khi luyện flashcard trước."
              : `Bạn đã xử lý xong ${sessionSize} từ trong phiên (tối đa ${REVIEW_SESSION_WORD_LIMIT} từ). Vào lại để kiểm tra thêm.`}
          </Text>
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
        <Text style={styles.headerTitle}>Kiểm tra ngẫu nhiên</Text>
        <View style={styles.headerSide} />
      </View>

      <Text style={styles.poolCount}>
        Phiên kiểm tra: {sessionSize - pool.length + 1}/{sessionSize} · Còn {pool.length} từ
      </Text>

      <View style={styles.cardArea}>
        <View style={styles.card}>
          <Pressable onPress={() => playSound(current.sound)}>
            <Image
              source={current.image}
              style={styles.image}
              contentFit="cover"
            />
          </Pressable>

          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => playSound(current.sound)}
          >
            <Ionicons
              name={isMute ? "volume-mute" : "volume-high"}
              size={28}
              color={isMute ? theme.iconMuted : theme.success}
            />
            <Text style={styles.playBtnText}>Nghe lại từ</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>Nhớ nghĩa từ qua hình ảnh và âm thanh</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.masteredBtn} onPress={() => void handleMastered()}>
          <Ionicons name="shield-checkmark" size={24} color="#ffffff" />
          <Text style={styles.masteredBtnText}>Đã thuộc hoàn toàn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNextRandom}>
          <Text style={styles.nextBtnText}>Từ khác →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
