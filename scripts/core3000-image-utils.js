/**
 * Shared helpers: slug, existing image index, Wikipedia image fetch.
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "assets");
const CORE3000_DIR = path.join(ASSETS, "data/core3000");
const PLACEHOLDER = "./data/4000B2_603.jpg";
const WIKI_API = "https://en.wikipedia.org/w/api.php";
const HEADERS = {
  "User-Agent": "SerfVocabApp/1.0 (React Native vocabulary app)",
};

const VOC_FILES = [
  path.join(ASSETS, "vocs.ts"),
  path.join(ASSETS, "vocs2.ts"),
  path.join(ASSETS, "vocs-learning-animals.ts"),
  path.join(ASSETS, "vocs-learning-extra.ts"),
];

function slugify(word) {
  return word
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseVocBlocks(content) {
  const entries = [];
  const blockRe = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  let m;
  while ((m = blockRe.exec(content))) {
    const block = m[0];
    if (!block.includes('id: "') || !block.includes('voc: "')) continue;

    const get = (key) => {
      const hit = block.match(new RegExp(`${key}:\\s*"([^"]*)"`));
      return hit ? hit[1] : undefined;
    };
    const getRaw = (key) => {
      const hit = block.match(new RegExp(`${key}:\\s*(require\\([^)]+\\))`));
      return hit ? hit[1] : undefined;
    };

    const voc = get("voc");
    const image = getRaw("image");
    if (!voc || !image) continue;
    entries.push({ voc, image });
  }
  return entries;
}

function requirePath(raw) {
  const m = String(raw).match(/require\("([^"]+)"\)/);
  return m ? m[1] : null;
}

function isPlaceholderImage(imagePath) {
  return !imagePath || imagePath.includes("4000B2_603.jpg");
}

/** voc (lower) → "./data/....jpg" (non-placeholder only) */
function buildExistingImageIndex() {
  const byWord = new Map();
  for (const file of VOC_FILES) {
    if (!fs.existsSync(file)) continue;
    for (const { voc, image } of parseVocBlocks(fs.readFileSync(file, "utf8"))) {
      const p = requirePath(image);
      if (!p || isPlaceholderImage(p)) continue;
      const key = voc.toLowerCase().trim();
      if (!byWord.has(key)) byWord.set(key, p);
    }
  }
  return byWord;
}

function assetExists(relativePath) {
  const p = path.join(ASSETS, relativePath.replace(/^\.\//, ""));
  return fs.existsSync(p) && fs.statSync(p).size > 500;
}

/** Resolve best image path for a vocabulary word. */
function resolveImagePath(word, imageIndex) {
  const idx = imageIndex ?? buildExistingImageIndex();
  const key = word.toLowerCase().trim();
  const slug = slugify(word);

  const fromVocs = idx.get(key);
  if (fromVocs && assetExists(fromVocs)) return fromVocs;

  for (const sub of ["animals", "fruits", "core3000"]) {
    const rel = `./data/${sub}/${slug}.jpg`;
    if (assetExists(rel)) return rel;
  }

  return PLACEHOLDER;
}

function listCore3000Words() {
  const file = path.join(ASSETS, "vocs-learning-core3000.ts");
  if (!fs.existsSync(file)) return [];
  const words = [];
  const re = /voc:\s*"([^"]+)"/g;
  let m;
  const content = fs.readFileSync(file, "utf8");
  while ((m = re.exec(content))) words.push(m[1]);
  return words;
}

async function downloadImage(imageUrl, destPath, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: { ...HEADERS, Referer: "https://en.wikipedia.org/" },
      });
      fs.writeFileSync(destPath, data);
      return;
    } catch (err) {
      const status = err.response?.status;
      if ((status === 429 || status === 503) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

async function fetchWikiImageUrl(title, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get(WIKI_API, {
        params: {
          action: "query",
          titles: title,
          prop: "pageimages",
          format: "json",
          pithumbsize: 800,
          pilicense: "any",
        },
        headers: HEADERS,
        timeout: 15000,
      });
      const pages = data?.query?.pages ?? {};
      const page = Object.values(pages)[0];
      if (!page || page.missing !== undefined) return null;
      return page.thumbnail?.source ?? null;
    } catch (err) {
      const status = err.response?.status;
      if ((status === 429 || status === 503) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  return null;
}

async function searchWikiImageUrl(query, retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get(WIKI_API, {
        params: {
          action: "query",
          list: "search",
          srsearch: query,
          srlimit: 5,
          format: "json",
        },
        headers: HEADERS,
        timeout: 15000,
      });
      const hits = data?.query?.search ?? [];
      for (const hit of hits) {
        const url = await fetchWikiImageUrl(hit.title);
        if (url) return url;
        await new Promise((r) => setTimeout(r, 600));
      }
      return null;
    } catch (err) {
      const status = err.response?.status;
      if ((status === 429 || status === 503) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  return null;
}

/** Try direct title, then one Wikipedia search (minimal API calls). */
async function findWikiImageForWord(word) {
  const title =
    word.includes(" ") || word.includes("-")
      ? word.replace(/\b\w/g, (c) => c.toUpperCase())
      : word.charAt(0).toUpperCase() + word.slice(1);

  const direct = await fetchWikiImageUrl(title);
  if (direct) return direct;

  await new Promise((r) => setTimeout(r, 800));
  return searchWikiImageUrl(word);
}

module.exports = {
  ASSETS,
  CORE3000_DIR,
  PLACEHOLDER,
  HEADERS,
  slugify,
  buildExistingImageIndex,
  resolveImagePath,
  listCore3000Words,
  assetExists,
  isPlaceholderImage,
  downloadImage,
  fetchWikiImageUrl,
  findWikiImageForWord,
};
