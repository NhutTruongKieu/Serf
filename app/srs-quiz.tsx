import { VocabularyNumberGraphic } from "@/components/vocabulary-number-graphic";
import { useAppSettings } from "@/contexts/app-settings";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getLearnNumberDigit } from "@/lib/number-voc-display";
import { playVocabularyMode, stopDeviceTts } from "@/lib/vocab-audio-playback";
import { appendQuizSession, type QuizSessionItem } from "@/lib/vocab-quiz-history";
import { buildMeaningChoices } from "@/lib/vocab-quiz-mcq";
import { applySrsQuizAnswer, getDueLearnedVocs, loadSrsMap, type SrsMap } from "@/lib/vocab-srs";
import type { Vocabulary } from "@/lib/vocab-types";
import { createSrsQuizStyles } from "@/styles/srs-quiz-styles";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const QUESTION_TIME_LIMIT_SEC = 5;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Phase = "loading" | "quiz" | "empty" | "done";

export default function SrsQuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isMute } = useAppSettings();
  const { allVocs } = useVocabulary();
  const { theme } = useAppTheme();
  const styles = useMemo(
    () => createSrsQuizStyles(theme, SCREEN_WIDTH),
    [theme]
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [queue, setQueue] = useState<Vocabulary[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [choices, setChoices] = useState<{ correctMeaning: string; options: string[] } | null>(
    null
  );
  const [picked, setPicked] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_LIMIT_SEC);
  const [sessionItems, setSessionItems] = useState<QuizSessionItem[]>([]);
  const [scoreSummary, setScoreSummary] = useState({ correct: 0, total: 0 });

  const soundRef = useRef<Audio.Sound | null>(null);
  const srsMapRef = useRef<SrsMap | null>(null);
  const sessionStartRef = useRef<string>("");
  const autoPlayGenRef = useRef(0);
  const answerLockedRef = useRef(false);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitAnswerRef = useRef<
    (correct: boolean, pickedOption: string | null) => Promise<void>
  >(() => Promise.resolve());

  const current = queue[qIndex] ?? null;

  const startSession = useCallback(async () => {
    setPhase("loading");
    const due = await getDueLearnedVocs(allVocs);
    srsMapRef.current = await loadSrsMap();
    if (due.length === 0) {
      setPhase("empty");
      return;
    }
    const shuffled = shuffle(due);
    sessionStartRef.current = new Date().toISOString();
    setQueue(shuffled);
    setQIndex(0);
    setSessionItems([]);
    setPicked(null);
    setTimedOut(false);
    setSecondsLeft(QUESTION_TIME_LIMIT_SEC);
    setChoices(buildMeaningChoices(shuffled[0], allVocs));
    setPhase("quiz");
  }, []);

  useEffect(() => {
    void startSession();
  }, [startSession]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    return () => {
      stopDeviceTts();
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (!current || phase !== "quiz") return;
    if (!current.sound && !current.useDeviceTts) return;
    const gen = ++autoPlayGenRef.current;
    void (async () => {
      await playVocabularyMode(current, "word", { isMute, soundRef });
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
  }, [current?.id, phase, isMute]);

  const stopQuestionTimer = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  }, []);

  const finishSession = useCallback(
    async (items: QuizSessionItem[]) => {
      const correct = items.filter((i) => i.correct).length;
      setScoreSummary({ correct, total: items.length });
      setPhase("done");
      const endedAt = new Date().toISOString();
      await appendQuizSession({
        id: `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        startedAt: sessionStartRef.current || endedAt,
        endedAt,
        items,
      });
    },
    []
  );

  const goNext = useCallback(
    async (items: QuizSessionItem[]) => {
      const next = qIndex + 1;
      if (next >= queue.length) {
        await finishSession(items);
        return;
      }
      setQIndex(next);
      setPicked(null);
      setTimedOut(false);
      setSecondsLeft(QUESTION_TIME_LIMIT_SEC);
      setChoices(buildMeaningChoices(queue[next], allVocs));
    },
    [finishSession, qIndex, queue]
  );

  const submitAnswer = useCallback(
    async (correct: boolean, pickedOption: string | null) => {
      if (!current || !choices || answerLockedRef.current) return;
      answerLockedRef.current = true;
      stopQuestionTimer();

      if (pickedOption) {
        setPicked(pickedOption);
      } else {
        setTimedOut(true);
      }

      const map = srsMapRef.current ?? (await loadSrsMap());
      srsMapRef.current = map;
      await applySrsQuizAnswer(current.id, correct, map);

      const item: QuizSessionItem = { vocabId: current.id, correct };
      const nextItems = [...sessionItems, item];
      setSessionItems(nextItems);

      setTimeout(() => {
        void goNext(nextItems);
      }, correct ? 450 : 900);
    },
    [choices, current, goNext, sessionItems, stopQuestionTimer]
  );

  submitAnswerRef.current = submitAnswer;

  useEffect(() => {
    if (phase !== "quiz" || !current) return;

    answerLockedRef.current = false;
    setTimedOut(false);
    setSecondsLeft(QUESTION_TIME_LIMIT_SEC);
    stopQuestionTimer();

    let remaining = QUESTION_TIME_LIMIT_SEC;
    questionTimerRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        stopQuestionTimer();
        void submitAnswerRef.current(false, null);
      }
    }, 1000);

    return stopQuestionTimer;
  }, [current?.id, phase, stopQuestionTimer]);

  const onPickMeaning = (option: string) => {
    if (!choices || picked != null || timedOut) return;
    const correct = option === choices.correctMeaning;
    void submitAnswer(correct, option);
  };

  const numberVal = current ? getLearnNumberDigit(current) : null;

  if (phase === "loading") {
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
          <Text style={styles.headerTitle}>Kiểm tra ôn</Text>
          <View style={styles.headerSide} />
        </View>
        <ActivityIndicator size="large" color={theme.accent} style={{ flex: 1 }} />
      </View>
    );
  }

  if (phase === "empty") {
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
          <Text style={styles.headerTitle}>Kiểm tra ôn</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="checkmark-done-circle" size={72} color={theme.success} />
          <Text style={styles.emptyTitle}>Chưa có từ đến hạn</Text>
          <Text style={styles.emptySub}>
            Các từ đã học thuộc sẽ xuất hiện theo lịch 1 ngày → 2 ngày → 3 ngày → 1 tuần → 1
            tháng. Khi ổn định, ôn mỗi tháng.
          </Text>
        </View>
      </View>
    );
  }

  if (phase === "done") {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerSide}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={28} color={theme.iconTeal} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kết quả</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={[styles.emptyWrap, { flex: 1 }]}>
          <Text style={styles.summaryTitle}>
            {scoreSummary.correct}/{scoreSummary.total} đúng
          </Text>
          <Text style={styles.summarySub}>Đã lưu lịch sử phiên kiểm tra.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!current || !choices) {
    return null;
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
        <Text style={styles.headerTitle}>Kiểm tra ôn</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progress}>
          {qIndex + 1}/{queue.length} · Chọn nghĩa đúng
        </Text>
        <View style={[styles.timerBadge, secondsLeft <= 2 && styles.timerBadgeUrgent]}>
          <Ionicons
            name="timer-outline"
            size={16}
            color={secondsLeft <= 2 ? theme.danger : theme.iconTeal}
          />
          <Text style={[styles.timerText, secondsLeft <= 2 && styles.timerTextUrgent]}>
            {secondsLeft}s
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Pressable
            onPress={() => void playVocabularyMode(current, "word", { isMute, soundRef })}
          >
            {numberVal != null ? (
              <VocabularyNumberGraphic value={numberVal} theme={theme} style={styles.image} />
            ) : (
              <Image source={current.image} style={styles.image} contentFit="cover" />
            )}
          </Pressable>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => void playVocabularyMode(current, "word", { isMute, soundRef })}
          >
            <Ionicons
              name={isMute ? "volume-mute" : "volume-high"}
              size={26}
              color={isMute ? theme.iconMuted : theme.success}
            />
            <Text style={styles.playBtnText}>Nghe từ</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Xem ảnh và nghe — chọn nghĩa tiếng Việt</Text>
        </View>

        {timedOut && (
          <Text style={styles.timeoutLabel}>Hết giờ — tính là sai</Text>
        )}

        {choices.options.map((opt) => {
          const show = picked != null || timedOut;
          const isCorrect = opt === choices.correctMeaning;
          const isPicked = opt === picked;
          const styleExtra =
            show && isCorrect
              ? styles.choiceCorrect
              : show && isPicked && !isCorrect
                ? styles.choiceWrong
                : null;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.choiceBtn, styleExtra]}
              onPress={() => onPickMeaning(opt)}
              disabled={picked != null || timedOut}
              activeOpacity={0.85}
            >
              <Text style={styles.choiceText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
        <Text style={styles.footerHint}>
          Mỗi câu {QUESTION_TIME_LIMIT_SEC}s · Hết giờ = sai · Sai: lùi 1 bước SRS · Đúng: tiến
          lịch ôn
        </Text>
      </ScrollView>
    </View>
  );
}
