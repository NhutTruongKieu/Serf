import { Vocabulary, vocs as initialVocs } from "@/assets/vocs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 80;

export default function HomeScreen() {
  const [currentCategory, setCurrentCategory] = useState("All");
  const [currentSet, setCurrentSet] = useState(0);
  const [activeVocs, setActiveVocs] = useState<Vocabulary[]>([]);
  const [index, setIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isSetPickerVisible, setIsSetPickerVisible] = useState(false);
  const [categoryProgress, setCategoryProgress] = useState<Record<string, { remaining: number; total: number }>>({});
  const soundRef = useRef<Audio.Sound | null>(null);
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

  const currentVoc = activeVocs[index];

  const calculateProgress = async () => {
    const progress: Record<string, { remaining: number; total: number }> = {};

    for (const cat of sortedCategories) {
      const sets = getSetsForCategory(cat);
      let total = 0;
      let remaining = 0;

      for (let i = 0; i < sets.length; i++) {
        total += sets[i].length;
        const storageKey = `LEARNED_VOCS_${cat}_SET_${i}`;
        try {
          const savedData = await AsyncStorage.getItem(storageKey);
          if (savedData) {
            remaining += (JSON.parse(savedData) as string[]).length;
          } else {
            remaining += sets[i].length;
          }
        } catch (e) { }
      }
      progress[cat] = { remaining, total };
    }
    setCategoryProgress(progress);
  };

  useEffect(() => {
    // Load current category, set and progress
    const loadState = async () => {
      try {
        const savedCat = await AsyncStorage.getItem("CURRENT_CATEGORY") || "All";
        const savedSet = await AsyncStorage.getItem("CURRENT_SET") || "0";

        setCurrentCategory(savedCat);
        const startingSet = parseInt(savedSet);
        setCurrentSet(startingSet);

        const currentSets = getSetsForCategory(savedCat);
        const setIdx = startingSet < currentSets.length ? startingSet : 0;

        const storageKey = `LEARNED_VOCS_${savedCat}_SET_${setIdx}`;
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
      } catch (e) {
        console.log("Failed to load saved state", e);
        setActiveVocs(getFilteredVocs("All").slice(0, 20));
      }
      calculateProgress();
    };
    loadState();
  }, []);

  useEffect(() => {
    if (isSetPickerVisible) {
      calculateProgress();
    }
  }, [isSetPickerVisible]);

  const selectSet = async (cat: string, setIdx: number) => {
    setCurrentCategory(cat);
    setCurrentSet(setIdx);
    setIsSetPickerVisible(false);
    setIndex(0);
    setShowMeaning(false);

    try {
      await AsyncStorage.setItem("CURRENT_CATEGORY", cat);
      await AsyncStorage.setItem("CURRENT_SET", setIdx.toString());

      const currentSets = getSetsForCategory(cat);
      const storageKey = `LEARNED_VOCS_${cat}_SET_${setIdx}`;
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
    } catch (e) {
      setActiveVocs(getSetsForCategory(cat)[setIdx]);
    }
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

  const playSound = async (soundSource: any, label?: string) => {
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
      playSound(activeVocs[newIndex].sound, activeVocs[newIndex].voc);
    }
    // Snap back to center without animation from user's view (since it instantly changes content)
    translateX.value = 0;
  };

  const resetIndex = () => {
    if (activeVocs.length === 0) return;
    setIndex(0);
    playSound(activeVocs[0].sound, activeVocs[0].voc);
    translateX.value = 0;
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
      await AsyncStorage.setItem(`LEARNED_VOCS_${currentCategory}_SET_${currentSet}`, JSON.stringify(remainingTitles));
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
  };

  const handleSwipeComplete = (velocity: number, dx: number) => {
    if (activeVocs.length === 0) return;

    if (dx < -SWIPE_THRESHOLD) {
      // Swiped Left -> Mở từ tiếp theo
      if (index < activeVocs.length - 1) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 150 }, () => {
          runOnJS(changeIndex)(true);
        });
      } else {
        translateX.value = withSpring(0);
      }
    } else if (dx > SWIPE_THRESHOLD) {
      // Swiped Right -> Trở lại từ trước
      if (index > 0) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 150 }, () => {
          runOnJS(changeIndex)(false);
        });
      } else {
        translateX.value = withSpring(0);
      }
    } else {
      translateX.value = withSpring(0);
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      runOnJS(handleSwipeComplete)(e.velocityX, e.translationX);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(setShowMeaning)(true);
  });

  const composedGesture = Gesture.Simultaneous(panGesture);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const renderCard = (voc: Vocabulary) => (
    <Animated.View style={[styles.cardArea, animatedCardStyle]}>
      <Animated.View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons
            name="checkmark-circle-outline"
            size={32}
            color="#4ade80"
            onPress={markAsLearned}
            style={styles.learnButton}
          />
        </View>

        <Image source={voc.image} style={styles.image} contentFit="cover" pointerEvents="none" />
        <View style={{ alignItems: 'center', width: '100%' }}>
          <Text style={styles.word}
            onPress={() => playSound(voc.sound, voc.voc)}>{voc.voc}</Text>
        </View>

        <View style={styles.soundRow}>
          <Ionicons
            name="book"
            size={32}
            color="#a8dadc"
            onPress={() => playSound(voc.meaningSound, "Meaning")}
            style={styles.soundBtn}
          />
          <Ionicons
            name="chatbox-ellipses"
            size={32}
            color="#4ade80"
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
          color="#e94560" onPress={async () => {
            setActiveVocs(vocSets[currentSet]);
            setIndex(0);
            try {
              await AsyncStorage.removeItem(`LEARNED_VOCS_${currentCategory}_SET_${currentSet}`);
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
        <Ionicons name="filter" size={24} color="#fff" />
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn bộ từ vựng</Text>
              <Ionicons
                name="close"
                size={28}
                color="#888"
                onPress={() => setIsSetPickerVisible(false)}
              />
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
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
                      {sets.map((_, i) => (
                        <TouchableOpacity
                          key={`${cat}-${i}`}
                          style={[
                            styles.setCard,
                            currentCategory === cat && currentSet === i && styles.activeSetCard
                          ]}
                          onPress={() => selectSet(cat, i)}
                        >
                          <Text
                            style={[
                              styles.setCardText,
                              currentCategory === cat && currentSet === i && styles.activeSetCardText
                            ]}
                            numberOfLines={1}
                          >
                            {sets.length > 1 ? `Phần ${i + 1}` : "Học ngay"}
                          </Text>
                          <Text style={styles.setCardSubText}>
                            {sets[i].length} từ
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Số thứ tự */}
      <View style={styles.header}>
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
        <Text onPress={() => changeIndex(false)} style={styles.hint}>← Từ trước</Text>
        <Text onPress={() => changeIndex(true)} style={styles.hint}>Từ tiếp theo →</Text>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 56,
    right: 24,
  },
  counter: {
    color: "#888",
    fontSize: 15,
    fontWeight: "600",
  },
  cardArea: {
    width: SCREEN_WIDTH - 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  card: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: "#16213e",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  image: {
    width: 280,
    height: 280,
    borderRadius: 16,
    backgroundColor: "#0f3460",
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: "#e94560",
    borderRadius: 2,
  },
  word: {
    fontSize: 32,
    fontWeight: "800",
    color: "#e94560",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 4,
  },
  soundRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 8,
  },
  soundBtn: {
    padding: 4,
  },
  meaningContainer: {
    alignItems: "center",
    gap: 12,
  },
  meaning: {
    fontSize: 20,
    fontWeight: "500",
    color: "#a8dadc",
    textAlign: "center",
  },
  hiddenMeaningPlaceholder: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  tapHint: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
  hintRow: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 32,
  },
  hint: {
    color: "#444",
    fontSize: 13,
  },
  cardHeader: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  learnButton: {
    padding: 8,
  },
  congratsText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4ade80",
    marginBottom: 8,
  },
  congratsSub: {
    fontSize: 18,
    color: "#a8dadc",
  },
  floatingButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#e94560",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  floatingButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#16213e",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#e94560",
  },
  modalScroll: {
    paddingBottom: 20,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryLabel: {
    color: "#a8dadc",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 4,
  },
  setGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  setCard: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  activeSetCard: {
    backgroundColor: "rgba(233, 69, 96, 0.2)",
    borderColor: "#e94560",
  },
  setCardText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  activeSetCardText: {
    color: "#e94560",
  },
  setCardSubText: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  }
});
