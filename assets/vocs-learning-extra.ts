import type { Vocabulary } from "@/lib/vocab-types";

/** Ảnh dùng chung cho bộ đánh vần (không có ảnh riêng). */
const PLACEHOLDER_IMG = require("./data/4000B2_603.jpg");

const hangDonVi = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const hangChuc = ["", "", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

/** Số tròn chục ngoài dải 10–30 (20, 30 đã nằm trong 10–30). */
const ROUND_TENS = [40, 50, 60, 70, 80, 90] as const;

const BIG_UNITS = [1000, 10000, 100000, 1000000, 1000000000] as const;

function englishNumberWord(n: number): string {
  switch (n) {
    case 100:
      return "one hundred";
    case 1000:
      return "one thousand";
    case 10000:
      return "ten thousand";
    case 100000:
      return "one hundred thousand";
    case 1000000:
      return "one million";
    case 1000000000:
      return "one billion";
    default:
      break;
  }

  if (n < 20) {
    const names = [
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    return names[n];
  }
  const t = Math.floor(n / 10);
  const u = n % 10;
  const tensNames = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const tenW = tensNames[t];
  if (u === 0) return tenW;
  const onesUnder10 = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  return `${tenW}-${onesUnder10[u]}`;
}

function vietnameseNumberWord(n: number): string {
  switch (n) {
    case 100:
      return "một trăm";
    case 1000:
      return "một ngàn";
    case 10000:
      return "mười ngàn";
    case 100000:
      return "một trăm ngàn";
    case 1000000:
      return "một triệu";
    case 1000000000:
      return "một tỷ";
    default:
      break;
  }

  if (n < 20) {
    if (n === 10) return "mười";
    const u = n % 10;
    if (u === 5) return "mười lăm";
    if (u === 4) return "mười bốn";
    return `mười ${hangDonVi[u]}`;
  }
  const chuc = Math.floor(n / 10);
  const donVi = n % 10;
  let s = `${hangChuc[chuc]} mươi`;
  if (donVi === 0) return s;
  if (donVi === 1) return `${s} mốt`;
  if (donVi === 5) return `${s} lăm`;
  if (donVi === 4) return `${s} tư`;
  return `${s} ${hangDonVi[donVi]}`;
}

function collectNumberLearningValues(): number[] {
  const set = new Set<number>();
  for (let n = 10; n <= 30; n++) set.add(n);
  for (const n of ROUND_TENS) set.add(n);
  set.add(100);
  for (const n of BIG_UNITS) set.add(n);
  return Array.from(set).sort((a, b) => a - b);
}

function buildNumbersLearningSet(): Vocabulary[] {
  return collectNumberLearningValues().map((n) => ({
    id: `LEARN_NUM_${n}`,
    voc: englishNumberWord(n),
    pos: "num",
    meaning: vietnameseNumberWord(n),
    category: "Numbers & big units",
    useDeviceTts: true,
  }));
}

/** Từ CVC đơn giản + gợi ý đánh vần (TTS nghĩa đọc tiếng Anh cho ổn định). */
const PHONICS_CVC: { voc: string; ipa: string; meaning: string }[] = [
  { voc: "cat", ipa: "/kæt/", meaning: "c — a — t — cat" },
  { voc: "dog", ipa: "/dɒɡ/", meaning: "d — o — g — dog" },
  { voc: "pig", ipa: "/pɪɡ/", meaning: "p — i — g — pig" },
  { voc: "hat", ipa: "/hæt/", meaning: "h — a — t — hat" },
  { voc: "bat", ipa: "/bæt/", meaning: "b — a — t — bat" },
  { voc: "sit", ipa: "/sɪt/", meaning: "s — i — t — sit" },
  { voc: "cup", ipa: "/kʌp/", meaning: "c — u — p — cup" },
  { voc: "pen", ipa: "/pen/", meaning: "p — e — n — pen" },
  { voc: "ten", ipa: "/ten/", meaning: "t — e — n — ten" },
  { voc: "sun", ipa: "/sʌn/", meaning: "s — u — n — sun" },
  { voc: "apple", ipa: "/æppl/", meaning: "a — p — p — l — e — apple" },
  { voc: "banana", ipa: "/bænənə/", meaning: "b — a — n — a — n — a — banana" },
  { voc: "cherry", ipa: "/ˈʃeri/", meaning: "c — h — e — r — r — y — cherry" },
  { voc: "orange", ipa: "/ˈɔːrɪʤən/", meaning: "o — r — a — n — g — e — orange" },
  { voc: "pineapple", ipa: "/ˈpaɪnəppl/", meaning: "p — i — n — e — a — p — p — l — e — pineapple" },
  { voc: "strawberry", ipa: "/ˈstrɔːb(ə)ri/", meaning: "s — t — r — a — w — b — e — r — r — y — strawberry" },
  { voc: "watermelon", ipa: "/ˈwɔːtəm(ə)lən/", meaning: "w — a — t — e — r — m — e — l — o — n — watermelon" },
  { voc: "grape", ipa: "/greɪp/", meaning: "g — r — a — p — e — grape" },
  { voc: "melon", ipa: "/ˈmelən/", meaning: "m — e — l — o — n — melon" },
];
function buildPhonicsCvc(): Vocabulary[] {
  return PHONICS_CVC.map((row, i) => ({
    id: `LEARN_PHONICS_${i + 1}`,
    voc: row.voc,
    pos: "n",
    meaning: row.meaning,
    ipa: row.ipa,
    category: "Numbers & big units",
    setGroup: "cvc",
    image: PLACEHOLDER_IMG,
    useDeviceTts: true,
    ttsMeaningLang: "en-US" as const,
  }));
}

export const learningExtraVocs: Vocabulary[] = [
  ...buildNumbersLearningSet(),
  ...buildPhonicsCvc(),
];
