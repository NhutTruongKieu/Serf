import { Vocabulary, vocs as initialVocs } from "@/assets/vocs";
import { useAppSettings } from "@/contexts/app-settings";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/use-app-theme";
import { createHomeStyles } from "@/app/(tabs)/home-styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = 80;
const VERTICAL_SWIPE_THRESHOLD = 100;

export default function HomeScreen() {
  const [currentCategory, setCurrentCategory] = useState("All");
  const [currentSet, setCurrentSet] = useState(0);
  const [activeVocs, setActiveVocs] = useState<Vocabulary[]>([]);
  const [index, setIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isSetPickerVisible, setIsSetPickerVisible] = useState(false);
  const { isMute, setIsMute, soundIconsAlign, progressReloadToken } =
    useAppSettings();
  const { theme } = useAppTheme();
  const styles = useMemo(
    () => createHomeStyles(theme, SCREEN_WIDTH),
    [theme]
  );
  const router = useRouter();
  const autoPlayGenRef = useRef(0);
  const [categoryProgress, setCategoryProgress] = useState<Record<string, { remaining: number; total: number }>>({});
  const [setProgress, setSetProgress] = useState<Record<string, { learned: number; total: number }>>({});
  const soundRef = useRef<Audio.Sound | null>(null);
  const modalScrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);
  const activeSetRef = useRef<View>(null);
  // Derived category list with Vietnamese mapping
  const categoryMap: Record<string, string> = {
    "All": "Tất cả",
    "Feelings & Emotions": "Cảm xúc & Tâm trạng",
    "Nature & Landscape": "Thiên nhiên & Phong cảnh",
    "Human Body & Health": "Cơ thể & Sức khỏe",
    "Household & Objects": "Đồ dùng & Đồ vật",
    "Common Actions": "Hành động thông thường",
    "Places & Directions": "Địa điểm & Hướng",
    "Abstract & Qualities": "Khái niệm & Phẩm chất",
    "General": "Từ vựng chung",
  };

  const sortedCategories = [
    "Feelings & Emotions",
    "Nature & Landscape",
    "Human Body & Health",
    "Household & Objects",
    "Common Actions",
    "Places & Directions",
    "Abstract & Qualities",
    "General",
    "All"
  ].filter(c => initialVocs.some(v => v.category === c) || c === "All");

  const getFilteredVocs = (cat: string) => {
    return initialVocs.filter(v => cat === "All" || v.category === cat);
  };

  const getSetsForCategory = (cat: string) => {
    const filtered = getFilteredVocs(cat);
    return Array.from({ length: Math.ceil(filtered.length / 20) }, (_, i) =>
      filtered.slice(i * 20, i * 20 + 20)
    );
  };

  const vocSets = getSetsForCategory(currentCategory);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const currentVoc = activeVocs[index] || activeVocs[0];

  const calculateProgress = async () => {
    const progress: Record<string, { remaining: number; total: number }> = {};
    const perSet: Record<string, { learned: number; total: number }> = {};

    for (const cat of sortedCategories) {
      const sets = getSetsForCategory(cat);
      let total = 0;
      let remaining = 0;

      for (let i = 0; i < sets.length; i++) {
        const setTotal = sets[i].length;
        total += setTotal;
        let setRemaining = setTotal;
        const storageKey = STORAGE_KEYS.learnedVocs(cat, i);
        try {
          const savedData = await AsyncStorage.getItem(storageKey);
          if (savedData) {
            setRemaining = (JSON.parse(savedData) as string[]).length;
          }
        } catch (e) { }
        remaining += setRemaining;
        perSet[`${cat}_${i}`] = { learned: setTotal - setRemaining, total: setTotal };
      }
      progress[cat] = { remaining, total };
    }
    setCategoryProgress(progress);
    setSetProgress(perSet);
  };

  const loadState = useCallback(async () => {
    try {
      const savedCat =
        (await AsyncStorage.getItem(STORAGE_KEYS.currentCategory)) || "All";
      const savedSet =
        (await AsyncStorage.getItem(STORAGE_KEYS.currentSet)) || "0";

      setCurrentCategory(savedCat);
      const startingSet = parseInt(savedSet, 10);
      setCurrentSet(startingSet);

      const currentSets = getSetsForCategory(savedCat);
      const setIdx = startingSet < currentSets.length ? startingSet : 0;

      const storageKey = STORAGE_KEYS.learnedVocs(savedCat, setIdx);
      const savedData = await AsyncStorage.getItem(storageKey);

      if (savedData) {
        const remainingWords = JSON.parse(savedData) as string[];
        const filteredVocs = currentSets[setIdx].filter((v) =>
          remainingWords.includes(v.voc)
        );
        setActiveVocs(filteredVocs.length > 0 ? filteredVocs : []);
      } else {
        setActiveVocs(currentSets[setIdx]);
      }
      setIndex(0);
      setShowMeaning(false);
    } catch (e) {
      console.log("Failed to load saved state", e);
      setActiveVocs(getFilteredVocs("All").slice(0, 20));
    }
    calculateProgress();
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useFocusEffect(
    useCallback(() => {
      if (progressReloadToken > 0) {
        loadState();
      }
    }, [progressReloadToken, loadState])
  );

  useEffect(() => {
    if (isSetPickerVisible) {
      calculateProgress();
    }
  }, [isSetPickerVisible]);

  const scrollToActiveSet = () => {
    if (!activeSetRef.current || !scrollContentRef.current || !modalScrollRef.current) {
      return;
    }
    activeSetRef.current.measureLayout(
      scrollContentRef.current,
      (_x, y) => {
        modalScrollRef.current?.scrollTo({ y: Math.max(0, y - 32), animated: false });
      },
      () => {}
    );
  };

  useEffect(() => {
    if (!isSetPickerVisible) return;
    const frameId = requestAnimationFrame(() => {
      setTimeout(scrollToActiveSet, 100);
    });
    return () => cancelAnimationFrame(frameId);
  }, [isSetPickerVisible, currentCategory, currentSet]);

  const selectSet = async (cat: string, setIdx: number) => {
    setIsSetPickerVisible(false);
    setShowMeaning(false);

    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (_) {}
      soundRef.current = null;
    }

    let newVocs: Vocabulary[] = [];
    try {
      const currentSets = getSetsForCategory(cat);
      const storageKey = STORAGE_KEYS.learnedVocs(cat, setIdx);
      const savedData = await AsyncStorage.getItem(storageKey);

      if (savedData) {
        const remainingWords = JSON.parse(savedData) as string[];
        const filteredVocs = currentSets[setIdx].filter((v) =>
          remainingWords.includes(v.voc)
        );
        newVocs = filteredVocs.length > 0 ? filteredVocs : [];
      } else {
        newVocs = currentSets[setIdx];
      }

      await AsyncStorage.setItem(STORAGE_KEYS.currentCategory, cat);
      await AsyncStorage.setItem(STORAGE_KEYS.currentSet, setIdx.toString());
    } catch (e) {
      newVocs = getSetsForCategory(cat)[setIdx] ?? [];
    }

    setCurrentCategory(cat);
    setCurrentSet(setIdx);
    setActiveVocs(newVocs);
    setIndex(0);
    translateX.value = 0;
    translateY.value = 0;
  };

  useEffect(() => {
    // Config audio to play even in silent mode
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

  useEffect(() => {
    const voc = activeVocs[index] ?? activeVocs[0];
    if (!voc) return;

    const gen = ++autoPlayGenRef.current;
    (async () => {
      await playSound(voc.sound, voc.voc);
      if (gen !== autoPlayGenRef.current && soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (_) {}
        soundRef.current = null;
      }
    })();
  }, [activeVocs, index, currentCategory, currentSet, isMute]);

  const playSound = async (soundSource: any, label?: string) => {
    if (isMute) return;
    if (!soundSource) {
      console.log("No sound file for", label || "this item");
      return;
    }
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      console.log("Loading sound...");
      const { sound } = await Audio.Sound.createAsync(
        soundSource,
        { shouldPlay: true }
      );
      soundRef.current = sound;
      console.log("Sound played successfully!");
    } catch (e) {
      console.log("Sound error:", e);
    }
  };

  const changeIndex = (isNext: boolean) => {
    if (activeVocs.length === 0) return;

    let newIndex = index;

    if (isNext) {
      newIndex = index < activeVocs.length - 1 ? index + 1 : 0;
    } else {
      newIndex = index > 0 ? index - 1 : activeVocs.length - 1;
    }


    if (newIndex !== index) {
      setIndex(newIndex);
      setShowMeaning(false); // Hide meaning when switching words
    }
    // Snap back to center without animation from user's view (since it instantly changes content)
    translateX.value = 0;
  };

  const resetIndex = () => {
    if (activeVocs.length === 0) return;
    setIndex(0);
    translateX.value = 0;
    translateY.value = 0;
  };

  const navigateToSet = (isNext: boolean) => {
    // Current category index
    const catIdx = sortedCategories.indexOf(currentCategory);

    if (isNext) {
      if (currentSet < vocSets.length - 1) {
        selectSet(currentCategory, currentSet + 1);
      } else {
        // Last set of current category, move to next category
        const nextCatIdx = (catIdx + 1) % sortedCategories.length;
        const nextCat = sortedCategories[nextCatIdx];
        selectSet(nextCat, 0);
      }
    } else {
      if (currentSet > 0) {
        selectSet(currentCategory, currentSet - 1);
      } else {
        // First set of current category, move to prev category
        const prevCatIdx = (catIdx - 1 + sortedCategories.length) % sortedCategories.length;
        const prevCat = sortedCategories[prevCatIdx];
        const prevCatSets = getSetsForCategory(prevCat);
        selectSet(prevCat, Math.max(0, prevCatSets.length - 1));
      }
    }
  };

  const markAsLearned = async () => {
    if (activeVocs.length === 0) return;

    // Create new array without the current word
    const newVocs = [...activeVocs];
    newVocs.splice(index, 1);

    setActiveVocs(newVocs);
    setShowMeaning(false);

    // Save to AsyncStorage
    try {
      const remainingTitles = newVocs.map(v => v.voc);
      await AsyncStorage.setItem(
        STORAGE_KEYS.learnedVocs(currentCategory, currentSet),
        JSON.stringify(remainingTitles)
      );
      calculateProgress();
    } catch (e) { }

    // Adjust index if we removed the last item
    if (index >= newVocs.length) {
      setIndex(0);
    } else {
      setIndex(index);
    }

    // Snap to center
    translateX.value = 0;
    translateY.value = 0;
  };

  const handleSwipeComplete = (vx: number, dx: number, vy: number, dy: number) => {
    // Determine primary direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal Primary
      if (dx < -SWIPE_THRESHOLD) {
        // Swiped Left -> Mở từ tiếp theo
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 150 }, () => {
          runOnJS(changeIndex)(true);
        });
      } else if (dx > SWIPE_THRESHOLD) {
        // Swiped Right -> Trở lại từ trước
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 150 }, () => {
          runOnJS(changeIndex)(false);
        });
      } else {
        translateX.value = withSpring(0);
      }
    } else {
      // Vertical Primary
      if (dy < -VERTICAL_SWIPE_THRESHOLD) {
        // Swiped Up -> Next Set
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 200 }, () => {
          runOnJS(navigateToSet)(true);
          translateY.value = 0;
        });
      } else if (dy > VERTICAL_SWIPE_THRESHOLD) {
        // Swiped Down -> Prev Set
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
          runOnJS(navigateToSet)(false);
          translateY.value = 0;
        });
      } else {
        translateY.value = withSpring(0);
      }
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
        translateX.value = e.translationX;
        translateY.value = 0;
      } else {
        translateY.value = e.translationY;
        translateX.value = 0;
      }
    })
    .onEnd((e) => {
      runOnJS(handleSwipeComplete)(e.velocityX, e.translationX, e.velocityY, e.translationY);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(setShowMeaning)(true);
  });

  const composedGesture = Gesture.Simultaneous(panGesture);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ],
    };
  });

  const renderCard = (voc: Vocabulary) => (
    <Animated.View style={[styles.cardArea, animatedCardStyle]}>
      <Animated.View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons
            name="checkmark-circle-outline"
            size={32}
            color={theme.success}
            onPress={markAsLearned}
            style={styles.learnButton}
          />
        </View>

        <Image source={voc.image} style={styles.image} contentFit="cover" pointerEvents="none" />
        <Pressable style={{ alignItems: 'center', width: '100%' }} onPress={() => playSound(voc.sound, voc.voc)}>
          <Text style={styles.word}>{voc.voc}</Text>
          <Text style={styles.pos}>{voc.ipa}</Text>
        </Pressable>

        <View
          style={[
            styles.soundRow,
            soundIconsAlign === "left" && styles.soundRowLeft,
            soundIconsAlign === "center" && styles.soundRowCenter,
            soundIconsAlign === "right" && styles.soundRowRight,
          ]}
        >
          <Ionicons
            name="book"
            size={32}
            color={theme.iconTeal}
            onPress={() => playSound(voc.meaningSound, "Meaning")}
            style={styles.soundBtn}
          />
          <Ionicons
            name="chatbox-ellipses"
            size={32}
            color={theme.success}
            onPress={() => playSound(voc.exampleSound, "Example")}
            style={styles.soundBtn}
          />
        </View>

        {showMeaning && (
          <View style={styles.meaningContainer}>
            <View style={styles.divider} />
            <Text style={styles.meaning}>{voc.meaning}</Text>
          </View>
        )}

        {!showMeaning && (
          <GestureDetector gesture={tapGesture}>
            <View style={styles.hiddenMeaningPlaceholder}>
              <Text style={styles.tapHint}>Chạm để xem nghĩa</Text>
            </View>
          </GestureDetector>
        )}
      </Animated.View>
    </Animated.View>
  );

  if (activeVocs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.congratsText}>Tuyệt vời!</Text>
        <Text style={styles.congratsSub}>Bạn đã học hết từ vựng bộ {currentSet + 1}.</Text>
        <Ionicons
          name="reload-circle"
          size={64}
          color={theme.accent} onPress={async () => {
            setActiveVocs(vocSets[currentSet]);
            setIndex(0);
            try {
              await AsyncStorage.removeItem(
                STORAGE_KEYS.learnedVocs(currentCategory, currentSet)
              );
              calculateProgress();
            } catch (e) { }
          }}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Floating Set Selection Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsSetPickerVisible(true)}
      >
        <Ionicons name="filter" size={24} color={theme.floatingBtnText} />
        <Text style={styles.floatingButtonText} numberOfLines={1}>
          {currentCategory === "All" ? `Bộ ${currentSet + 1}` : `${categoryMap[currentCategory] || currentCategory}`}
        </Text>
      </TouchableOpacity>

      {/* Set Picker Modal */}
      <Modal
        visible={isSetPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSetPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsSetPickerVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn bộ từ vựng</Text>
              <Ionicons
                name="close"
                size={28}
                color={theme.iconMuted}
                onPress={() => setIsSetPickerVisible(false)}
              />
            </View>
            <ScrollView ref={modalScrollRef} contentContainerStyle={styles.modalScroll}>
              <View ref={scrollContentRef} collapsable={false}>
              {sortedCategories.map((cat) => {
                const sets = getSetsForCategory(cat);
                if (sets.length === 0) return null;
                const prog = categoryProgress[cat];
                return (
                  <View key={cat} style={styles.categorySection}>
                    <Text style={styles.categoryLabel}>
                      {categoryMap[cat] || cat} {prog ? `(${prog.total - prog.remaining}/${prog.total})` : ""}
                    </Text>
                    <View style={styles.setGrid}>
                      {sets.map((_, i) => {
                        const isActive = currentCategory === cat && currentSet === i;
                        const setProg = setProgress[`${cat}_${i}`];
                        return (
                        <TouchableOpacity
                          key={`${cat}-${i}`}
                          ref={isActive ? activeSetRef : undefined}
                          style={[
                            styles.setCard,
                            isActive && styles.activeSetCard
                          ]}
                          onPress={() => selectSet(cat, i)}
                        >
                          <Text
                            style={[
                              styles.setCardText,
                              isActive && styles.activeSetCardText
                            ]}
                            numberOfLines={1}
                          >
                            {sets.length > 1 ? `Phần ${i + 1}` : "Học ngay"}
                          </Text>
                          <Text style={styles.setCardSubText}>
                            {sets[i].length} từ
                            {setProg ? ` · ${setProg.learned}/${setProg.total}` : ""}
                          </Text>
                        </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      {/* Header: cài đặt + số thứ tự */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push("/settings")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="settings-outline" size={26} color={theme.iconTeal} />
        </TouchableOpacity>
        <Text style={styles.counter} onPress={resetIndex}>
          {index + 1} / {activeVocs.length}
        </Text>
      </View>

      {/* Khu vực flashcard */}
      <GestureDetector gesture={composedGesture}>
        <View style={styles.cardArea}>{renderCard(currentVoc)}</View>
      </GestureDetector>

      {/* Hướng dẫn vuốt */}
      <View style={styles.hintRow}>
        <Text onPress={() => changeIndex(false)} style={styles.hintLeft}>← Từ trước</Text>
        <Ionicons
          name={isMute ? "volume-mute" : "volume-high"}
          size={32}
          color={isMute ? theme.iconMuted : theme.success}
          onPress={() => setIsMute(!isMute)}
          style={styles.learnButton}
        />
        <Text onPress={() => changeIndex(true)} style={styles.hintRight}>Từ tiếp theo →</Text>
      </View>
    </GestureHandlerRootView>
  );
}

