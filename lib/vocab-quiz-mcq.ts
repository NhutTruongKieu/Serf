import type { Vocabulary } from "@/lib/vocab-types";

const DEFAULT_CHOICES = 4;

function shuffleInPlace<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Trắc nghiệm nghĩa: đúng = `target.meaning`, thêm nghĩa sai từ `pool` (khác id & khác chuỗi nghĩa).
 */
export function buildMeaningChoices(
  target: Vocabulary,
  pool: Vocabulary[],
  choiceCount = DEFAULT_CHOICES
): { correctMeaning: string; options: string[] } {
  const correctMeaning = target.meaning.trim();
  const wrongPool = pool.filter(
    (v) => v.id !== target.id && v.meaning.trim() && v.meaning.trim() !== correctMeaning
  );

  const seen = new Set<string>();
  const wrongs: string[] = [];
  const shuffled = shuffleInPlace(wrongPool);
  for (const v of shuffled) {
    const m = v.meaning.trim();
    if (seen.has(m)) continue;
    seen.add(m);
    wrongs.push(m);
    if (wrongs.length >= choiceCount - 1) break;
  }

  while (wrongs.length < choiceCount - 1) {
    wrongs.push(`(${wrongs.length + 1}) Khác nghĩa trên`);
  }

  const options = shuffleInPlace([correctMeaning, ...wrongs.slice(0, choiceCount - 1)]);
  return { correctMeaning, options };
}
