/**
 * Generate assets/vocs-learning-animals.ts from animals + fruits catalogs.
 * Run: node scripts/generate-animals-vocs.js
 */

const fs = require("fs");
const path = require("path");
const {
  ANIMALS_SET1,
  ANIMALS_SET2,
  ANIMALS_SET3,
  ANIMALS_SET4,
} = require("./animals-catalog");
const { FRUITS_SET1, FRUITS_SET2 } = require("./fruits-catalog");

const SETS = [
  { items: ANIMALS_SET1, setGroup: "basic", imageDir: "animals", idPrefix: "LEARN_ANIMAL", idStart: 1 },
  { items: ANIMALS_SET2, setGroup: "wild", imageDir: "animals", idPrefix: "LEARN_ANIMAL", idStart: 21 },
  { items: ANIMALS_SET3, setGroup: "advanced", imageDir: "animals", idPrefix: "LEARN_ANIMAL", idStart: 41 },
  { items: ANIMALS_SET4, setGroup: "expert", imageDir: "animals", idPrefix: "LEARN_ANIMAL", idStart: 61 },
  { items: FRUITS_SET1, setGroup: "fruit", imageDir: "fruits", idPrefix: "LEARN_FRUIT", idStart: 1 },
  { items: FRUITS_SET2, setGroup: "fruit-exotic", imageDir: "fruits", idPrefix: "LEARN_FRUIT", idStart: 21 },
];

function emitEntry(row, id, setGroup, imageDir, idPrefix) {
  return `  {
    id: "${idPrefix}_${String(id).padStart(2, "0")}",
    voc: ${JSON.stringify(row.voc)},
    pos: ${JSON.stringify(row.pos)},
    meaning: ${JSON.stringify(row.meaning)},
    ipa: ${JSON.stringify(row.ipa)},
    category: "Animals",
    setGroup: ${JSON.stringify(setGroup)},
    image: require("./data/${imageDir}/${row.slug}.jpg"),
    useDeviceTts: true,
  }`;
}

const entries = [];
for (const set of SETS) {
  set.items.forEach((row, i) => {
    entries.push(emitEntry(row, set.idStart + i, set.setGroup, set.imageDir, set.idPrefix));
  });
}

const total = SETS.reduce((n, s) => n + s.items.length, 0);

const content = `import type { Vocabulary } from "@/lib/vocab-types";

/** Động vật & trái cây — sinh từ scripts/*-catalog.js (node scripts/generate-animals-vocs.js) */
export const animalsLearningVocs: Vocabulary[] = [
${entries.join(",\n")},
];
`;

const out = path.join(__dirname, "../assets/vocs-learning-animals.ts");
fs.writeFileSync(out, content, "utf8");
console.log("Wrote", out, "—", total, "entries");
