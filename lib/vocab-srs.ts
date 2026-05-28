import type { Vocabulary } from "@/lib/vocab-types";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/lib/storage-keys";
import { collectLearnedVocs } from "@/lib/vocab-learned";

/** 0 = mới vào SRS; 6 = ổn định, ôn hàng tháng. */
export type SrsStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const MAX_SRS_STEP: SrsStep = 6;

export type SrsCardState = {
  step: SrsStep;
  /** ISO — so sánh bằng `Date` (local parse). */
  nextReviewAt: string;
};

export type SrsMap = Record<string, SrsCardState>;

function addLocalHours(from: Date, hours: number): Date {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

function addLocalDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/** Cộng tháng theo lịch local (xử lý cuối tháng giống `setMonth`). */
export function addLocalCalendarMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Sau trả lời đúng, chuyển sang `newStep` — khoảng cách tới lần ôn tiếp theo. */
export function nextReviewAfterCorrect(from: Date, newStep: SrsStep): Date {
  switch (newStep) {
    case 1:
      return addLocalHours(from, 6);
    case 2:
      return addLocalDays(from, 1);
    case 3:
      return addLocalDays(from, 2);
    case 4:
      return addLocalDays(from, 3);
    case 5:
      return addLocalDays(from, 7);
    case 6:
      return addLocalCalendarMonths(from, 1);
    default:
      return from;
  }
}

export async function loadSrsMap(): Promise<SrsMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.srsCardStates);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as SrsMap;
  } catch {
    return {};
  }
}

export async function saveSrsMap(map: SrsMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.srsCardStates, JSON.stringify(map));
}

/** Đọc legacy REVIEW_MASTERED_IDS → bước max, ôn sau 1 tháng (local); xóa key cũ. */
export async function migrateReviewMasteredToSrs(): Promise<void> {
  let map = await loadSrsMap();
  if (Object.keys(map).length > 0) {
    await AsyncStorage.removeItem(STORAGE_KEYS.reviewMasteredIds);
    return;
  }

  const raw = await AsyncStorage.getItem(STORAGE_KEYS.reviewMasteredIds);
  if (!raw) return;

  try {
    const ids = JSON.parse(raw) as unknown;
    if (!Array.isArray(ids)) return;
    const now = new Date();
    const next = addLocalCalendarMonths(now, 1).toISOString();
    for (const id of ids) {
      if (typeof id !== "string") continue;
      map[id] = { step: MAX_SRS_STEP, nextReviewAt: next };
    }
    await saveSrsMap(map);
  } finally {
    await AsyncStorage.removeItem(STORAGE_KEYS.reviewMasteredIds);
  }
}

export async function clearSrsMap(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.srsCardStates);
}

export async function clearSrsAndLegacyReview(): Promise<void> {
  await clearSrsMap();
  await AsyncStorage.removeItem(STORAGE_KEYS.reviewMasteredIds);
}

/** Từ đã học thuộc và đến hạn ôn (theo `nextReviewAt` ≤ now). */
export async function getDueLearnedVocs(allVocs: Vocabulary[]): Promise<Vocabulary[]> {
  await migrateReviewMasteredToSrs();
  const learned = await collectLearnedVocs(allVocs);
  const srs = await loadSrsMap();
  const now = Date.now();

  return learned.filter((v) => {
    const s = srs[v.id];
    if (!s) return true;
    const t = new Date(s.nextReviewAt).getTime();
    return t <= now;
  });
}

/** Cập nhật SRS sau một câu trả lời quiz. */
export async function applySrsQuizAnswer(
  vocabId: string,
  correct: boolean,
  allSrs?: SrsMap
): Promise<void> {
  const map = allSrs ?? (await loadSrsMap());
  const now = new Date();
  const prev = map[vocabId];
  const step = (prev?.step ?? 0) as SrsStep;

  if (correct) {
    const newStep = Math.min(MAX_SRS_STEP, step + 1) as SrsStep;
    const nextAt = nextReviewAfterCorrect(now, newStep);
    map[vocabId] = { step: newStep, nextReviewAt: nextAt.toISOString() };
  } else {
    const newStep = Math.max(0, step - 1) as SrsStep;
    map[vocabId] = { step: newStep, nextReviewAt: now.toISOString() };
  }

  await saveSrsMap(map);
}
