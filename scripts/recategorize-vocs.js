/**
 * Review and reclassify vocabulary in assets/vocs.ts and assets/vocs2.ts.
 * Run: node scripts/recategorize-vocs.js
 * Dry run: node scripts/recategorize-vocs.js --dry-run
 */

const fs = require("fs");
const path = require("path");

const FILES = [
  path.join(__dirname, "../assets/vocs.ts"),
  path.join(__dirname, "../assets/vocs2.ts"),
];

const CATEGORIES = [
  "Feelings & Emotions",
  "Nature & Landscape",
  "Human Body & Health",
  "Household & Objects",
  "Common Actions",
  "Places & Directions",
  "Abstract & Qualities",
  "General",
];

/** Regex patterns (+3 each) applied to normalized Vietnamese meaning */
const PATTERN_RULES = [
  {
    category: "Feelings & Emotions",
    patterns: [
      /^sự cười/i,
      /tiếng cười/i,
      /chán nản/i,
      /làm buồn/i,
      /tò mò/i,
      /hiếu kỳ/i,
      /thù oán/i,
      /mối hận/i,
      /điên/i,
      /cuồng/i,
      /mất trí/i,
      /hiền lành/i,
      /dịu dàng/i,
      /hoà nhã/i,
      /tử tế/i,
      /tốt bụng/i,
      /nhẹ nhàng/i,
      /anh chàng/i,
    ],
  },
  {
    category: "Nature & Landscape",
    patterns: [
      /sương mù/i,
      /\bướt\b/i,
      /\bẩm\b/i,
      /\bđậu\b/i,
      /khí hậu/i,
      /môi trường/i,
      /sinh thái/i,
      /hành tinh/i,
      /vũ trụ/i,
      /con chim/i,
      /con cá/i,
      /con thú/i,
      /cây cối/i,
      /hoa lá/i,
    ],
  },
  {
    category: "Human Body & Health",
    patterns: [
      /người nô lệ/i,
      /chết đói/i,
      /thiếu ăn/i,
      /cơ thể/i,
      /bệnh viện/i,
      /ốm đau/i,
    ],
  },
  {
    category: "Household & Objects",
    patterns: [
      /^lồng/i,
      /chuồng/i,
      /\bcũi\b/i,
      /gươm/i,
      /\bkiếm\b/i,
      /giá sách/i,
      /ngăn tủ/i,
      /nướng \(bánh/i,
      /\bđậu\b/i,
      /^hàng,/i,
      /giá sách/i,
    ],
  },
  {
    category: "Common Actions",
    patterns: [
      /^làm /i,
      /^gây /i,
      /quấy rầy/i,
      /làm phiền/i,
      /phản đối/i,
      /kháng nghị/i,
      /biểu tình/i,
      /^chìm/i,
      /bao quanh/i,
      /vây quanh/i,
      /trợ giúp/i,
      /đấu tranh/i,
      /chống lại/i,
      /vật lộn/i,
      /khai báo/i,
      /^bày tỏ/i,
      /gây trở ngại/i,
      /khiển trách/i,
      /trách mắng/i,
      /lăng mạ/i,
      /sỉ nhục/i,
      /chửi rủa/i,
      /^giảm/i,
      /trưng bày/i,
      /triển lãm/i,
      /tập trung/i,
      /hợp tác/i,
      /tính toán/i,
      /điều tra/i,
      /nghiên cứu/i,
      /minh hoạ/i,
      /tham gia/i,
      /sử dụng/i,
      /dùng đến/i,
      /nhờ vào/i,
      /chiếm giữ/i,
      /chiếm đóng/i,
      /mạo hiểm/i,
      /thống nhất/i,
      /hoàn thành/i,
      /trêu /i,
      /chết đói/i,
      /làm lạnh/i,
      /ướp lạnh/i,
    ],
  },
  {
    category: "Places & Directions",
    patterns: [
      /ngoài nước/i,
      /hải ngoại/i,
      /^bờ,/i,
      /\bbờ\b/i,
      /\bgờ\b/i,
      /cạnh \(hố/i,
      /\brìa\b/i,
      /\blề\b/i,
      /cuốn sách/i,
      /\bvịnh\b/i,
      /địa lý/i,
      /rạn đá/i,
      /đá ngầm/i,
    ],
  },
  {
    category: "Abstract & Qualities",
    patterns: [
      /^sự /i,
      /^tính /i,
      /nền tảng/i,
      /cơ sở/i,
      /danh tiếng/i,
      /tiếng tăm/i,
      /sứ mệnh/i,
      /nhiệm vụ/i,
      /bộ lạc/i,
      /đồng nghiệp/i,
      /hội đồng/i,
      /phá huỷ/i,
      /tàn phá/i,
      /mất trật tự/i,
      /lộn xộn/i,
      /bừa bãi/i,
      /phân chia/i,
      /sự chia/i,
      /phong phú/i,
      /dồi dào/i,
      /công dân/i,
      /quân đội/i,
      /thư ký/i,
      /bí thư/i,
      /nhật ký/i,
      /tín hiệu/i,
      /hiệu lệnh/i,
      /số lượng/i,
      /viễn cảnh/i,
      /triển vọng/i,
      /khổng lồ/i,
      /to lớn/i,
      /nhỏ xíu/i,
      /tí hon/i,
      /ngu dại/i,
      /ngớ ngẩn/i,
      /hào phóng/i,
      /rộng rãi/i,
      /bị động/i,
      /thụ động/i,
      /phương pháp/i,
      /hoá học/i,
      /môn hoá học/i,
      /lễ tang/i,
      /đám tang/i,
      /giải thoát/i,
      /xét xử/i,
      /xử án/i,
      /thiếu sót/i,
      /khuyết điểm/i,
      /thiên tài/i,
      /thu nhập/i,
      /dự báo/i,
      /hoàng gia/i,
      /sự thực/i,
      /có thật/i,
      /tuy nhiên/i,
      /tuy thế mà/i,
      /làm cho có thể/i,
      /phải, nên/i,
      /mặc dù/i,
      /bất chấp/i,
      /sự nghèo/i,
      /cuộc họp/i,
      /lắp ráp/i,
      /^truyện/i,
      /truyện ngắn/i,
      /thợ máy/i,
      /công nhân cơ khí/i,
    ],
  },
];

const PATTERN_SCORE = 3;

const RULES = [
  {
    category: "Feelings & Emotions",
    keywords: [
      "cảm xúc", "tâm trạng", "tình cảm", "lo âu", "băn khoăn", "buồn bã", "vui sướng",
      "sợ hãi", "tức giận", "ghét bỏ", "yêu thương", "thèm muốn", "ao ước", "khao khát",
      "hy vọng", "thất vọng", "tự tin", "tự hào", "xấu hổ", "hối hận", "kinh hãi",
      "lo lắng", "bình tĩnh", "hài lòng", "thỏa mãn", "hăng hái", "nhiệt tình",
      "gan dạ", "dũng cảm", "tin tưởng", "nghi ngờ", "an ủi", "đau khổ", "hưng phấn",
      "ý muốn", "ý định", "mong muốn", "sợ hãi", "tức giận", "ghen tị", "hồi hộp",
      "bối rối", "xúc động", "cảm động", "cô đơn", "lo sợ", "khó chịu", "tinh thần",
      "tâm lý", "ngưỡng mộ", "khâm phục", "yên lặng", "yên tĩnh", "tĩnh lặng",
      "sự cười", "tiếng cười", "chán nản", "tò mò", "hiếu kỳ", "thù oán", "điên",
      "cuồng", "mất trí", "hiền lành", "dịu dàng", "tử tế", "tốt bụng", "anh chàng",
    ],
    vocHint:
      /^(anxious|eager|awful|desire|intent|polite|sensitive|confident|terror|threat|anger|mood|lovely|shy|panic|delight)$/i,
  },
  {
    category: "Human Body & Health",
    keywords: [
      "cơ thể", "thân thể", "sức khỏe", "bệnh tật", "bệnh viện", "bác sĩ", "y tá",
      "thuốc men", "điều trị", "phẫu thuật", "tim ", "tim,", "phổi", "gan ", "thận",
      "máu", "xương", "não bộ", "vết thương", "gãy xương", "khỏe mạnh", "ốm đau",
      "hô hấp", "tiêu hóa", "dạ dày", "hắt hơi", "sốt cao", "cấp cứu", "y học",
      "chăm sóc", "phục hồi", "dinh dưỡng", "tiêm chủng", "khám bệnh", "ung thư",
      "ân nhân", "bảo mẫm", "điều dưỡng", "cơ bắp", "khớp xương", "răng miệng",
      "chết đói", "thiếu ăn", "người nô lệ",
    ],
    vocHint:
      /^(lung|chest|skull|wound|heal|fever|flu|surgery|victim|marathon|pale|shade|supplement|breath)$/i,
  },
  {
    category: "Nature & Landscape",
    keywords: [
      "thiên nhiên", "phong cảnh", "bầu trời", "không khí", "ánh sáng", "mưa gió",
      "bão tố", "sấm sét", "mùa xuân", "mùa hạ", "mùa thu", "mùa đông", "rừng cây",
      "núi non", "đồi núi", "biển cả", "sông ngòi", "hồ nước", "thác nước", "hang động",
      "sa mạc", "hoang mạc", "ốc đảo", "cao nguyên", "thung lũng", "đồng bằng",
      "khí hậu", "ô nhiễm", "môi trường", "sinh thái", "động vật", "thực vật",
      "côn trùng", "con chim", "con cá", "con thú", "hành tinh", "vũ trụ",
      "thiên thạch", "nông nghiệp", "cánh đồng", "ruộng lúa", "cây cối", "hoa lá",
      "toả sáng", "chiếu sáng", "bình minh", "hoàng hôn", "lũ lụt", "hạn hán",
      "sương mù", "ướt", "ẩm", "đậu",
    ],
    vocHint:
      /^(landscape|steam|weed|wing|meteor|monster|northern|southern|remote|valley|shadow|soil|mud|flood|feather|clay|seed|nest|volcano|astronomy|biology|dinosaur)$/i,
  },
  {
    category: "Places & Directions",
    keywords: [
      "địa điểm", "nơi chốn", "vị trí", "khoảng cách", "thành phố", "nông thôn",
      "thủ đô", "thị trấn", "làng mạc", "con phố", "con đường", "quốc gia", "biên giới",
      "sân bay", "bến tàu", "ga tàu", "công viên", "chợ búa", "siêu thị", "lâu đài",
      "cung điện", "đền chùa", "nhà thờ", "nghĩa trang", "trung tâm", "khu vực",
      "nước ngoài", "hướng bắc", "hướng nam", "hướng đông", "hướng tây", "phía trên",
      "phía dưới", "bên trong", "bên ngoài", "lối vào", "lối ra", "cổng vào",
      "thị trấn", "thành thị", "khu phố", "quận huyện", "tỉnh thành",
      "hạ cánh", "lên bờ", "xuống bến",
      "ngoài nước", "hải ngoại", "bờ", "gờ", "rìa", "lề", "vịnh", "rạn đá", "đá ngầm",
      "địa lý", "địa chất",
    ],
    vocHint:
      /^(abroad|border|entrance|castle|temple|palace|capital|route|destination|colony|ruins|downtown|bridge|yard|inn|cabin|chamber|fence|zone|angle|frame|path|land)$/i,
  },
  {
    category: "Household & Objects",
    keywords: [
      "nhà cửa", "căn nhà", "phòng ngủ", "phòng bếp", "cửa sổ", "mái nhà", "cầu thang",
      "bàn ghế", "giường ngủ", "chăn gối", "đèn nến", "nồi chảo", "bát đĩa", "dao kéo",
      "quần áo", "đồng hồ", "trang sức", "châu báu", "kim hoàn", "đồ chơi", "nhạc cụ",
      "đồ dùng", "vật dụng", "gia dụng", "nội thất", "thiết bị", "dụng cụ", "công cụ",
      "ô tô", "xe hơi", "xe máy", "máy bay", "tàu thủy", "vũ khí", "kiếm cung",
      "đồ ăn", "thức ăn", "gia vị", "đồ uống", "rượu bia", "trà coffee", "cà phê",
      "tiền bạc", "đồng xu", "hộp thùng", "túi xách", "ví tiền", "gia đình",
      "tráng miệng", "món ăn", "món tráng",
      "lồng", "chuồng", "cũi", "gươm", "kiếm", "giá sách", "ngăn tủ", "nướng",
    ],
    vocHint:
      /^(jewelry|statue|arrow|bow|weapon|candle|pot|bin|bowl|cash|boot|cloth|curtain|furniture|ingredient|metal|household|fee|fare|debt|fund|carriage|costume|gift)$/i,
  },
  {
    category: "Common Actions",
    keywords: [
      "hành động", "thực hiện", "xảy ra", "xuất hiện", "nảy sinh", "bắt đầu", "kết thúc",
      "chạy nhảy", "đi bộ", "ăn uống", "ngủ nghỉ", "nói chuyện", "viết đọc", "nghe nhìn",
      "tìm kiếm", "mua bán", "gửi nhận", "học tập", "dạy học", "sửa chữa", "xây dựng",
      "mở cửa", "đóng cửa", "quét dọn", "rửa sạch", "chiến đấu", "tấn công", "phòng thủ",
      "bảo vệ", "bắn súng", "khuyên răn", "khuyên bảo", "chỉ bảo", "trao đổi", "đổi chác",
      "săn đuổi", "xua đuổi", "đuổi theo", "nâng lên", "nhấc lên", "bốc hàng", "chất tải",
      "chuyển động", "sở hữu", "chiếm hữu", "khâm phục", "ngưỡng mộ", "bảo đảm", "bảo lãnh",
      "đồng ý", "từ chối", "chấp nhận", "quyết định", "thảo luận", "tranh luận", "bắt gặp",
      "gặp gỡ", "rời khỏi", "trở về", "tiếp tục", "dừng lại", "giúp đỡ", "cầu xin",
      "van xin", "cười khóc", "la hét", "thì thầm", "vuốt lên", "vuốt xuống",
      "suy tàn", "suy sụp", "mục nát", "đổ nát", "thối rữa",
      "quấy rầy", "làm phiền", "phản đối", "kháng nghị", "biểu tình", "chìm",
      "bao quanh", "vây quanh", "trợ giúp", "đấu tranh", "chống lại", "vật lộn",
      "khai báo", "bày tỏ", "khiển trách", "trách mắng", "lăng mạ", "sỉ nhục",
      "trưng bày", "triển lãm", "tập trung", "hợp tác", "tính toán", "điều tra",
      "minh hoạ", "tham gia", "sử dụng", "dùng đến", "nhờ vào", "chiếm giữ",
      "mạo hiểm", "thống nhất", "hoàn thành", "trêu", "làm lạnh",
    ],
    posHint: ["v"],
    vocHint:
      /^(consist|seek|shine|spill|bring|command|submit|ensure|lift|load|obey|secure|trust|twist|wrap|battle|intend|proceed|praise|attempt|defend|resist|reveal|trap|admit|approve|capture|expose|forbid|hire|insist|oppose|permit|preserve|reject|weigh|accompany|dare|cast|cheat|conclude|convey|depart|detect|devote|donate|elevate|emphasize|estimate|fascinate|gesture|handle|impress|inherit|inspect|interrupt|invent|persuade|pretend|recover|recall|regret|remind|satisfy|scream|stare|steal|succeed|swallow|swing|throw|urge|warn|whisper|decay)$/i,
  },
  {
    category: "Abstract & Qualities",
    keywords: [
      "tính chất", "phẩm chất", "đặc điểm", "đặc tính", "ý nghĩa", "quan trọng",
      "cần thiết", "chính xác", "thành công", "thất bại", "công bằng", "bất công",
      "tự do", "công lý", "trách nhiệm", "quy tắc", "nguyên tắc", "lý do", "nguyên nhân",
      "kết quả", "hậu quả", "mục tiêu", "kế hoạch", "khả năng", "cơ hội", "nguy cơ",
      "thách thức", "giải pháp", "ý kiến", "quan điểm", "sự thật", "bí mật", "triết học",
      "triết lý", "toán học", "thống kê", "khoa học", "lịch sử", "văn hóa", "xã hội",
      "chính trị", "kinh tế", "giáo dục", "khái niệm", "định nghĩa", "độc đáo", "đặc biệt",
      "bình thường", "chính thức", "hợp pháp", "bất hợp pháp", "mãi mãi", "vĩnh viễn",
      "ấn tượng", "bất lợi", "thiệt hại", "tổn thất", "thế bất lợi", "sự bất lợi",
      "quan trọng", "trọng đại", "đáng chú ý", "rõ ràng", "xác định", "hiển nhiên",
      "chính thức", "nghiêm túc", "cơ bản", "cụ thể", "tổng quát", "cá biệt",
      "quy mô", "phạm vi", "khoảng rộng",
      "nền tảng", "cơ sở", "danh tiếng", "tiếng tăm", "sứ mệnh", "nhiệm vụ",
      "bộ lạc", "đồng nghiệp", "hội đồng", "phá huỷ", "tàn phá", "mất trật tự",
      "lộn xộn", "phân chia", "phong phú", "dồi dào", "công dân", "quân đội",
      "thư ký", "nhật ký", "tín hiệu", "số lượng", "viễn cảnh", "khổng lồ",
      "to lớn", "nhỏ xíu", "ngu dại", "hào phóng", "rộng rãi", "bị động",
      "phương pháp", "hoá học", "lễ tang", "giải thoát", "xét xử",
      "thiếu sót", "khuyết điểm", "thiên tài", "thu nhập", "dự báo", "hoàng gia",
      "truyện", "thợ máy", "cuộc họp", "sự nghèo", "tuy nhiên", "mặc dù",
    ],
    posHint: ["adj", "adv"],
    vocHint:
      /^(rapidly|hardly|unless|steady|honor|confidence|consequence|disaster|narrow|pale|rough|superior|thick|unique|upper|violent|ideal|incredible|legend|mere|modest|ordinary|permanent|rational|strict|sufficient|tough|virtual|annual|approximate|broad|capable|classic|considerable|definite|distinct|elementary|formal|gradual|initial|military|principal|professional|pure|senior|significant|solid|abstract|guilty|innocent|criminal|logical|mutual|potential|precise|primary|private|public|random|rapid|remote|rural|secure|severe|similar|simple|sincere|social|special|specific|spiritual|stable|standard|strange|strong|subjective|sudden|technical|temporary|terrible|traditional|typical|unable|unfair|unhappy|uniform|unique|united|universal|unknown|unlikely|unusual|upset|urgent|useful|useless|usual|valid|valuable|various|vast|verbal|violent|visible|vital|wealthy|wicked|willing|wise|wonderful|worldwide|worried|worthy|wrong|youth)$/i,
  },
];

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/&nbsp;/g, " ")
    .replace(/[;,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsKeyword(text, keyword) {
  const kw = keyword.toLowerCase().trim();
  if (kw.length < 2) return false;
  const re = new RegExp(
    `(^|[\\s,;(\\[/\"'\\-–—])${escapeRegex(kw)}([\\s,;)\\]/\"'\\-–—]|$)`,
    "i"
  );
  return re.test(text);
}

function scorePatterns(meaning) {
  const scores = {};
  for (const { category, patterns } of PATTERN_RULES) {
    for (const pattern of patterns) {
      if (pattern.test(meaning)) {
        scores[category] = (scores[category] || 0) + PATTERN_SCORE;
        break;
      }
    }
  }
  return scores;
}

function classifyEntry(entry) {
  const meaning = normalizeText(entry.meaning);
  const pos = entry.pos.toLowerCase().replace(/[^a-z]/g, "");
  const voc = entry.voc.split(/[;/,]/)[0].trim().toLowerCase();
  const patternScores = scorePatterns(meaning);

  const totals = {};
  for (const cat of CATEGORIES) {
    if (cat !== "General") totals[cat] = patternScores[cat] || 0;
  }

  for (const rule of RULES) {
    let score = totals[rule.category] || 0;

    for (const kw of rule.keywords) {
      if (containsKeyword(meaning, kw)) {
        score += kw.length >= 8 ? 4 : kw.length >= 5 ? 3 : 2;
      }
    }

    if (rule.posHint?.includes(pos)) score += 1;
    if (rule.vocHint?.test(voc)) score += 5;

    totals[rule.category] = score;
  }

  let best = { category: "General", score: 0 };
  for (const [category, score] of Object.entries(totals)) {
    if (score > best.score) {
      best = { category, score };
    }
  }

  return best;
}

function shouldApplyChange(oldCategory, newCategory, score) {
  if (oldCategory === newCategory) return false;
  if (newCategory === "General") return false;
  if (oldCategory === "General") return score >= 2;
  return score >= 5;
}

function parseMeaning(block) {
  const posIdx = block.indexOf("pos:");
  if (posIdx < 0) return "";
  const zone = block.slice(posIdx).split(/\n\s*(?:ipa|category):/)[0];

  const inlineDouble = zone.match(/meaning:\s*"((?:\\.|[^"\\])*)"/);
  if (inlineDouble) return inlineDouble[1].replace(/\\"/g, '"');

  const quoted = zone.match(
    /meaning:\s*(?:\n\s*)?['"]((?:\\.|[^'\"\\])*)['"]/
  );
  if (quoted) return quoted[1].replace(/\\(['"])/g, "$1");

  return "";
}

function parseEntries(content) {
  const entries = [];
  const idRe = /id:\s*"([^"]+)"/g;
  let m;
  while ((m = idRe.exec(content))) {
    const index = m.index;
    const block = content.slice(index, index + 3000);
    const voc = block.match(/voc:\s*"([^"]+)"/)?.[1];
    const pos = block.match(/pos:\s*"([^"]+)"/)?.[1];
    const category = block.match(/category:\s*"([^"]+)"/)?.[1];
    const meaning = parseMeaning(block);
    if (!voc || !pos || !category) continue;
    entries.push({
      id: m[1],
      voc,
      pos,
      meaning,
      category,
      index,
    });
  }
  return entries;
}

function updateCategories(content, entries) {
  let result = content;
  const sorted = [...entries].sort((a, b) => b.index - a.index);

  for (const entry of sorted) {
    const catRe = new RegExp(
      `(id:\\s*"${escapeRegex(entry.id)}"[\\s\\S]*?category:\\s*")[^"]+(")`,
      "m"
    );
    result = result.replace(catRe, `$1${entry.category}$2`);
  }

  return result;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const allEntries = [];
  const changes = [];

  for (const filePath of FILES) {
    const content = fs.readFileSync(filePath, "utf8");
    const entries = parseEntries(content);

    for (const entry of entries) {
      const { category: newCategory, score } = classifyEntry(entry);
      const item = {
        ...entry,
        file: path.basename(filePath),
        newCategory,
        score,
      };
      allEntries.push(item);

      if (shouldApplyChange(entry.category, newCategory, score)) {
        changes.push({
          id: entry.id,
          voc: entry.voc,
          from: entry.category,
          to: newCategory,
          score,
          meaning: entry.meaning.slice(0, 80),
        });
        entry.category = newCategory;
      }
    }

    if (!dryRun) {
      fs.writeFileSync(filePath, updateCategories(content, entries));
    }
  }

  const projected = {};
  for (const cat of CATEGORIES) projected[cat] = 0;
  for (const e of allEntries) {
    const { category, score } = classifyEntry(e);
    const finalCat = shouldApplyChange(e.category, category, score)
      ? category
      : e.category;
    projected[finalCat] = (projected[finalCat] || 0) + 1;
  }

  const reportPath = path.join(__dirname, "../assets/recategorize-report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        total: allEntries.length,
        changesCount: changes.length,
        fromGeneral: changes.filter((c) => c.from === "General").length,
        byCategory: projected,
        changes,
      },
      null,
      2
    )
  );

  console.log(dryRun ? "[dry-run] " : "", "Recategorization complete.");
  console.log("By category:", projected);
  console.log(`Changed: ${changes.length} (from General: ${changes.filter((c) => c.from === "General").length})`);
  console.log(`Report: ${reportPath}`);
}

main();
