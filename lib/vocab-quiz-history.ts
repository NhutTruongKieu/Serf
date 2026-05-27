import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/lib/storage-keys";

export type QuizSessionItem = {
  vocabId: string;
  correct: boolean;
};

export type QuizSession = {
  id: string;
  startedAt: string;
  endedAt: string;
  items: QuizSessionItem[];
};

export async function loadQuizSessions(): Promise<QuizSession[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.quizSessions);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as QuizSession[]) : [];
  } catch {
    return [];
  }
}

export async function appendQuizSession(session: QuizSession): Promise<void> {
  const prev = await loadQuizSessions();
  prev.push(session);
  await AsyncStorage.setItem(STORAGE_KEYS.quizSessions, JSON.stringify(prev));
}

export async function clearQuizSessions(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.quizSessions);
}
