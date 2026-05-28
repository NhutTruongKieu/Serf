import type { Vocabulary } from "@/assets/vocs";

const SET_SIZE = 20;

export function getFilteredVocs(vocs: Vocabulary[], category: string): Vocabulary[] {
  return vocs.filter((v) => category === "All" || v.category === category);
}

function chunkBy(items: Vocabulary[], size: number): Vocabulary[][] {
  if (items.length === 0) return [];
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size)
  );
}

/**
 * Chia category thành các set 20 từ. Items khác `setGroup` không gộp chung
 * set — thứ tự nhóm theo lần xuất hiện đầu tiên trong `vocs`. Nhờ vậy có
 * thể chèn các bộ phụ (ví dụ CVC trong Numbers) thành set độc lập.
 */
export function getSetsForCategory(
  vocs: Vocabulary[],
  category: string
): Vocabulary[][] {
  const filtered = getFilteredVocs(vocs, category);
  const groupOrder: string[] = [];
  const groupItems = new Map<string, Vocabulary[]>();

  for (const v of filtered) {
    const key = v.setGroup ?? "";
    if (!groupItems.has(key)) {
      groupItems.set(key, []);
      groupOrder.push(key);
    }
    groupItems.get(key)!.push(v);
  }

  const result: Vocabulary[][] = [];
  for (const key of groupOrder) {
    result.push(...chunkBy(groupItems.get(key) ?? [], SET_SIZE));
  }
  return result;
}
