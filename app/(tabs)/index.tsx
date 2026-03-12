import { Vocabulary, vocs as initialVocs } from "@/assets/vocs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
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
  const [activeVocs, setActiveVocs] = useState<Vocabulary[]>(initialVocs);
  const [index, setIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const translateX = useSharedValue(0);

  const currentVoc = activeVocs[index];

  useEffect(() => {
    // Load saved words from AsyncStorage
    const loadSavedVocs = async () => {
      try {
        const savedData = await AsyncStorage.getItem("LEARNED_VOCS");
        if (savedData) {
          const remainingWords = JSON.parse(savedData) as string[];
          // Filter out learned words from initial vocs
          const filteredVocs = initialVocs.filter((v) =>
            remainingWords.includes(v.voc)
          );
          if (filteredVocs.length > 0) {
            setActiveVocs(filteredVocs);
          } else {
            setActiveVocs([]);
          }
        }
      } catch (e) {
        console.log("Failed to load saved vocs", e);
      }
    };
    loadSavedVocs();
  }, []);

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

  const playSound = async (voc: Vocabulary) => {
    if (!voc.sound) {
      console.log("No sound file for", voc.voc);
      return;
    }
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      console.log("Loading sound for", voc.voc);
      const { sound } = await Audio.Sound.createAsync(
        voc.sound,
        { shouldPlay: false } // we will play explicitly
      );
      soundRef.current = sound;
      console.log("Playing sound...");
      await sound.playAsync();
      console.log("Sound played successfully!");
    } catch (e) {
      console.log("Sound error:", e);
    }
  };

  const changeIndex = (isNext: boolean) => {
    if (activeVocs.length === 0) return;
    
    let newIndex = index;
    if (isNext) {
      newIndex = index < activeVocs.length - 1 ? index + 1 : index;
    } else {
      newIndex = index > 0 ? index - 1 : index;
    }

    if (newIndex !== index) {
      setIndex(newIndex);
      setShowMeaning(false); // Hide meaning when switching words
      if (isNext) playSound(activeVocs[newIndex]);
    }
    // Snap back to center without animation from user's view (since it instantly changes content)
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
      const remainingWords = newVocs.map((v) => v.voc);
      await AsyncStorage.setItem("LEARNED_VOCS", JSON.stringify(remainingWords));
    } catch (e) {
      console.log("Failed to save learned vocs", e);
    }
    
    // Adjust index if we removed the last item
    if (index >= newVocs.length && newVocs.length > 0) {
      setIndex(newVocs.length - 1);
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
    runOnJS(playSound)(activeVocs[index]);
  });

  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const renderCard = (voc: Vocabulary) => (
    <Animated.View style={[styles.card, animatedCardStyle]}>
      <View style={styles.cardHeader}>
        <Ionicons 
          name="checkmark-circle-outline" 
          size={32} 
          color="#4ade80" 
          onPress={markAsLearned}
          style={styles.learnButton}
        />
      </View>
      <Image source={voc.image} style={styles.image} contentFit="cover" />
      <Text style={styles.word}>{voc.voc}</Text>
      
      {showMeaning ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.meaning}>{voc.meaning}</Text>
        </>
      ) : (
        <View style={styles.hiddenMeaningPlaceholder}>
          <Text style={styles.tapHint}>Chạm để xem nghĩa</Text>
        </View>
      )}
    </Animated.View>
  );

  if (activeVocs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.congratsText}>Tuyệt vời!</Text>
        <Text style={styles.congratsSub}>Bạn đã học hết từ vựng.</Text>
        <Ionicons 
          name="reload-circle" 
          size={64} 
          color="#e94560" 
          onPress={async () => {
            setActiveVocs(initialVocs);
            setIndex(0);
            try {
              // Clear saved memory
              await AsyncStorage.removeItem("LEARNED_VOCS");
            } catch(e) {}
          }}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Số thứ tự */}
      <View style={styles.header}>
        <Text style={styles.counter}>
          {index + 1} / {activeVocs.length}
        </Text>
      </View>

      {/* Khu vực flashcard */}
      <GestureDetector gesture={composedGesture}>
        <View style={styles.cardArea}>{renderCard(currentVoc)}</View>
      </GestureDetector>

      {/* Hướng dẫn vuốt */}
      <View style={styles.hintRow}>
        <Text style={styles.hint}>← Từ trước</Text>
        <Text style={styles.hint}>Từ tiếp theo →</Text>
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
  }
});
