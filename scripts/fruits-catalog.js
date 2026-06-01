/** Danh mục trái cây — cùng category Animals với động vật */

/** Bộ trái cây 1 — phổ biến */
const FRUITS_SET1 = [
  { slug: "apple", voc: "apple", meaning: "quả táo", pos: "n", ipa: "/ˈæpl/", wiki: "Apple" },
  { slug: "banana", voc: "banana", meaning: "quả chuối", pos: "n", ipa: "/bəˈnɑːnə/", wiki: "Banana" },
  { slug: "orange", voc: "orange", meaning: "quả cam", pos: "n", ipa: "/ˈɒrɪndʒ/", wiki: "Orange (fruit)" },
  { slug: "grape", voc: "grape", meaning: "quả nho", pos: "n", ipa: "/ɡreɪp/", wiki: "Grape" },
  { slug: "mango", voc: "mango", meaning: "quả xoài", pos: "n", ipa: "/ˈmæŋɡəʊ/", wiki: "Mango" },
  { slug: "pineapple", voc: "pineapple", meaning: "quả dứa", pos: "n", ipa: "/ˈpaɪnæpl/", wiki: "Pineapple" },
  { slug: "watermelon", voc: "watermelon", meaning: "dưa hấu", pos: "n", ipa: "/ˈwɔːtəmelən/", wiki: "Watermelon" },
  { slug: "strawberry", voc: "strawberry", meaning: "dâu tây", pos: "n", ipa: "/ˈstrɔːbəri/", wiki: "Strawberry" },
  { slug: "lemon", voc: "lemon", meaning: "quả chanh vàng", pos: "n", ipa: "/ˈlemən/", wiki: "Lemon" },
  { slug: "peach", voc: "peach", meaning: "quả đào", pos: "n", ipa: "/piːtʃ/", wiki: "Peach" },
  { slug: "pear", voc: "pear", meaning: "quả lê", pos: "n", ipa: "/peə/", wiki: "Pear" },
  { slug: "cherry", voc: "cherry", meaning: "quả cherry", pos: "n", ipa: "/ˈtʃeri/", wiki: "Cherry" },
  { slug: "coconut", voc: "coconut", meaning: "quả dừa", pos: "n", ipa: "/ˈkəʊkənʌt/", wiki: "Coconut" },
  { slug: "avocado", voc: "avocado", meaning: "quả bơ", pos: "n", ipa: "/ˌævəˈkɑːdəʊ/", wiki: "Avocado" },
  { slug: "kiwi", voc: "kiwi", meaning: "quả kiwi", pos: "n", ipa: "/ˈkiːwiː/", wiki: "Kiwifruit" },
  { slug: "papaya", voc: "papaya", meaning: "quả đu đủ", pos: "n", ipa: "/pəˈpaɪə/", wiki: "Papaya" },
  { slug: "melon", voc: "melon", meaning: "dưa gang", pos: "n", ipa: "/ˈmelən/", wiki: "Honeydew (melon)" },
  { slug: "plum", voc: "plum", meaning: "quả mận", pos: "n", ipa: "/plʌm/", wiki: "Plum" },
  { slug: "apricot", voc: "apricot", meaning: "quả mơ", pos: "n", ipa: "/ˈeɪprɪkɒt/", wiki: "Apricot" },
  { slug: "pomegranate", voc: "pomegranate", meaning: "quả lựu", pos: "n", ipa: "/ˈpɒmɪɡrænɪt/", wiki: "Pomegranate" },
];

/** Bộ trái cây 2 — nhiệt đới & ít gặp hơn */
const FRUITS_SET2 = [
  { slug: "dragon-fruit", voc: "dragon fruit", meaning: "thanh long", pos: "n", ipa: "/ˈdræɡən fruːt/", wiki: "Pitaya" },
  { slug: "lychee", voc: "lychee", meaning: "quả vải", pos: "n", ipa: "/ˈlaɪtʃiː/", wiki: "Lychee" },
  { slug: "durian", voc: "durian", meaning: "sầu riêng", pos: "n", ipa: "/ˈdʊəriən/", wiki: "Durian" },
  { slug: "rambutan", voc: "rambutan", meaning: "chôm chôm", pos: "n", ipa: "/ræmˈbuːtən/", wiki: "Rambutan" },
  { slug: "jackfruit", voc: "jackfruit", meaning: "quả mít", pos: "n", ipa: "/ˈdʒækfruːt/", wiki: "Jackfruit" },
  { slug: "guava", voc: "guava", meaning: "quả ổi", pos: "n", ipa: "/ˈɡwɑːvə/", wiki: "Guava" },
  { slug: "passion-fruit", voc: "passion fruit", meaning: "chanh dây", pos: "n", ipa: "/ˈpæʃən fruːt/", wiki: "Passiflora edulis" },
  { slug: "blueberry", voc: "blueberry", meaning: "việt quất", pos: "n", ipa: "/ˈbluːbəri/", wiki: "Blueberry" },
  { slug: "raspberry", voc: "raspberry", meaning: "mâm xôi", pos: "n", ipa: "/ˈrɑːzbəri/", wiki: "Raspberry" },
  { slug: "blackberry", voc: "blackberry", meaning: "dâu đen", pos: "n", ipa: "/ˈblækbəri/", wiki: "Blackberry" },
  { slug: "cranberry", voc: "cranberry", meaning: "nam việt quất", pos: "n", ipa: "/ˈkrænbəri/", wiki: "Cranberry" },
  { slug: "fig", voc: "fig", meaning: "quả sung", pos: "n", ipa: "/fɪɡ/", wiki: "Fig" },
  { slug: "tangerine", voc: "tangerine", meaning: "quýt", pos: "n", ipa: "/ˌtændʒəˈriːn/", wiki: "Tangerine" },
  { slug: "grapefruit", voc: "grapefruit", meaning: "bưởi chua", pos: "n", ipa: "/ˈɡreɪpfruːt/", wiki: "Grapefruit" },
  { slug: "lime", voc: "lime", meaning: "chanh xanh", pos: "n", ipa: "/laɪm/", wiki: "Lime (fruit)" },
  { slug: "persimmon", voc: "persimmon", meaning: "quả hồng", pos: "n", ipa: "/pəˈsɪmən/", wiki: "Persimmon" },
  { slug: "starfruit", voc: "star fruit", meaning: "quả khế", pos: "n", ipa: "/ˈstɑː fruːt/", wiki: "Carambola" },
  { slug: "cantaloupe", voc: "cantaloupe", meaning: "dưa cam", pos: "n", ipa: "/ˈkæntəluːp/", wiki: "Cantaloupe" },
  { slug: "mangosteen", voc: "mangosteen", meaning: "măng cụt", pos: "n", ipa: "/ˈmæŋɡəstiːn/", wiki: "Mangosteen" },
  { slug: "date", voc: "date", meaning: "quả chà là", pos: "n", ipa: "/deɪt/", wiki: "Date palm" },
];

module.exports = {
  FRUITS_SET1,
  FRUITS_SET2,
  ALL_FRUITS: [...FRUITS_SET1, ...FRUITS_SET2],
};
