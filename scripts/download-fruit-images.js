/**
 * Tải ảnh trái cây qua Wikipedia MediaWiki API (pageimages).
 * Run: node scripts/download-fruit-images.js
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const OUT_DIR = path.join(__dirname, "../assets/data/fruits");
const WIKI_API = "https://en.wikipedia.org/w/api.php";
const HEADERS = {
  "User-Agent": "SerfVocabApp/1.0 (React Native vocabulary app)",
};

const { ALL_FRUITS } = require("./fruits-catalog");

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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0;
  let fail = 0;

  for (const item of ALL_FRUITS) {
    const dest = path.join(OUT_DIR, `${item.slug}.jpg`);
    try {
      if (!fs.existsSync(dest)) {
        const imageUrl = await fetchWikiImageUrl(item.wiki);
        if (!imageUrl) throw new Error("no image on Wikipedia");
        await downloadImage(imageUrl, dest);
        console.log("Downloaded:", item.slug);
      } else {
        console.log("Exists:", item.slug);
      }
      ok++;
    } catch (err) {
      console.error("Failed:", item.slug, err.message);
      fail++;
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`Done: ${ok} ok, ${fail} failed → ${OUT_DIR}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
