export type CategoryProgress = { remaining: number; total: number };

/** Thứ tự học các loại từ vựng (không gồm "All"). */
export const VOCAB_CATEGORY_ORDER = [
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
};

export function isCategoryComplete(
  progress: Record<string, CategoryProgress>,
  category: string
): boolean {
  const prog = progress[category];
  if (!prog || prog.total === 0) return false;
  return prog.remaining === 0;
}

/** Loại đầu tiên luôn mở; loại sau mở khi đã học hết loại trước. "All" mở khi học hết mọi loại. */
export function isCategoryUnlocked(
  category: string,
  progress: Record<string, CategoryProgress>
): boolean {
  if (category === "All") {
    return VOCAB_CATEGORY_ORDER.every((cat) => isCategoryComplete(progress, cat));
  }

  const idx = VOCAB_CATEGORY_ORDER.indexOf(category as VocabCategory);
  if (idx === -1) return true;
  if (idx === 0) return true;

  const previous = VOCAB_CATEGORY_ORDER[idx - 1];
  return isCategoryComplete(progress, previous);
}

export function getCategoryUnlockHint(
  category: string,
  progress: Record<string, CategoryProgress>
): string | null {
  if (isCategoryUnlocked(category, progress)) return null;

  if (category === "All") {
    return "Học thuộc hết tất cả các loại từ vựng để mở khóa chế độ Tất cả.";
  }

  const idx = VOCAB_CATEGORY_ORDER.indexOf(category as VocabCategory);
  if (idx <= 0) return null;

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
