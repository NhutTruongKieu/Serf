export type CategoryProgress = { remaining: number; total: number };

/** Hai loại đầu luôn mở khóa cùng lúc; loại thứ 3 (trừ ALWAYS_UNLOCKED) mở khi đã học hết cả hai. */
export const INITIAL_UNLOCKED_CATEGORY_COUNT = 2;

/** Luôn mở khóa — không phụ thuộc tiến độ các loại khác. */
export const ALWAYS_UNLOCKED_CATEGORIES: readonly string[] = ["Core 3000"];

/** Thứ tự học các loại từ vựng (không gồm "All"). */
export const VOCAB_CATEGORY_ORDER = [
  "Numbers & big units",
  "Animals",
  "Core 3000",
  "Feelings & Emotions",
  "Nature & Landscape",
  "Human Body & Health",
  "Household & Objects",
  "Common Actions",
  "Places & Directions",
  "Abstract & Qualities",
  "General",
] as const;

export type VocabCategory = (typeof VOCAB_CATEGORY_ORDER)[number];

export const CATEGORY_LABELS_VI: Record<string, string> = {
  All: "Tất cả",
  "Feelings & Emotions": "Cảm xúc & Tâm trạng",
  "Nature & Landscape": "Thiên nhiên & Phong cảnh",
  "Human Body & Health": "Cơ thể & Sức khỏe",
  "Household & Objects": "Đồ dùng & Đồ vật",
  "Common Actions": "Hành động thông thường",
  "Places & Directions": "Địa điểm & Hướng",
  "Abstract & Qualities": "Khái niệm & Phẩm chất",
  General: "Từ vựng chung",
  "Numbers & big units": "Số & Đánh vần (CVC)",
  Animals: "Động vật & Trái cây",
  "Core 3000": "3000 từ cốt lõi (Oxford)",
};

export function isCategoryComplete(
  progress: Record<string, CategoryProgress>,
  category: string
): boolean {
  const prog = progress[category];
  if (!prog || prog.total === 0) return false;
  return prog.remaining === 0;
}

/**
 * Số & đánh vần, động vật + ALWAYS_UNLOCKED (Core 3000) luôn mở.
 * Loại tiếp theo: mở khi đã học hết các loại đầu (đối với loại ngay sau nhóm mở sẵn),
 * sau đó mỗi loại mở khi học hết loại ngay trước.
 * "All" mở khi học hết mọi loại.
 */
export function isCategoryUnlocked(
  category: string,
  progress: Record<string, CategoryProgress>
): boolean {
  if (category === "All") {
    return VOCAB_CATEGORY_ORDER.every((cat) => isCategoryComplete(progress, cat));
  }

  if (ALWAYS_UNLOCKED_CATEGORIES.includes(category)) return true;

  const idx = VOCAB_CATEGORY_ORDER.indexOf(category as VocabCategory);
  if (idx === -1) return true;
  if (idx < INITIAL_UNLOCKED_CATEGORY_COUNT) return true;

  if (idx === INITIAL_UNLOCKED_CATEGORY_COUNT) {
    return VOCAB_CATEGORY_ORDER.slice(0, INITIAL_UNLOCKED_CATEGORY_COUNT).every((cat) =>
      isCategoryComplete(progress, cat)
    );
  }

  const previous = VOCAB_CATEGORY_ORDER[idx - 1];
  return isCategoryComplete(progress, previous);
}

export function getCategoryUnlockHint(
  category: string,
  progress: Record<string, CategoryProgress>
): string | null {
  if (isCategoryUnlocked(category, progress)) return null;
  if (ALWAYS_UNLOCKED_CATEGORIES.includes(category)) return null;

  if (category === "All") {
    return "Học thuộc hết tất cả các loại từ vựng để mở khóa chế độ Tất cả.";
  }

  const idx = VOCAB_CATEGORY_ORDER.indexOf(category as VocabCategory);
  if (idx < INITIAL_UNLOCKED_CATEGORY_COUNT) return null;

  if (idx === INITIAL_UNLOCKED_CATEGORY_COUNT) {
    const labels = VOCAB_CATEGORY_ORDER.slice(0, INITIAL_UNLOCKED_CATEGORY_COUNT)
      .map((c) => `"${CATEGORY_LABELS_VI[c] ?? c}"`)
      .join(", ");
    return `Học thuộc hết các loại ${labels} để mở khóa loại này.`;
  }

  const previous = VOCAB_CATEGORY_ORDER[idx - 1];
  const prevLabel = CATEGORY_LABELS_VI[previous] ?? previous;
  return `Học thuộc hết từ vựng loại "${prevLabel}" để mở khóa loại này.`;
}

/** Loại cao nhất đang được phép học (dùng khi khôi phục trạng thái đã lưu bị khóa). */
export function getHighestUnlockedCategory(
  progress: Record<string, CategoryProgress>,
  categories: string[]
): string {
  for (let i = categories.length - 1; i >= 0; i--) {
    const cat = categories[i];
    if (cat !== "All" && isCategoryUnlocked(cat, progress)) {
      return cat;
    }
  }
  return VOCAB_CATEGORY_ORDER[0];
}
