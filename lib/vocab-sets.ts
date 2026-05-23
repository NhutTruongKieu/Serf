import type { Vocabulary } from "@/assets/vocs";

export function getFilteredVocs(vocs: Vocabulary[], category: string): Vocabulary[] {
  return vocs.filter((v) => category === "All" || v.category === category);
}

export function getSetsForCategory(
  vocs: Vocabulary[],
  category: string
): Vocabulary[][] {
  const filtered = getFilteredVocs(vocs, category);
  return Array.from({ length: Math.ceil(filtered.length / 20) }, (_, i) =>
    filtered.slice(i * 20, i * 20 + 20)
  );
}
