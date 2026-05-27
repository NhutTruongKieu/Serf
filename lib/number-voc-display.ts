const LEARN_NUM_ID = /^LEARN_NUM_(\d+)$/;

/** Trả về giá trị số nếu thẻ thuộc bộ LEARN_NUM_* (10–100). */
export function getLearnNumberDigit(voc: { id: string }): number | null {
  const m = LEARN_NUM_ID.exec(voc.id);
  if (!m) return null;
  return parseInt(m[1], 10);
}
