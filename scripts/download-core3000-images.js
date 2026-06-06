/**
 * Tải ảnh cho Oxford Core 3000:
 * 1) Dùng ảnh đã có trong vocs / animals / fruits nếu trùng từ
 * 2) Không có → tìm trên Wikipedia và lưu vào assets/data/core3000/
 *
 * Run: node scripts/download-core3000-images.js
 *      node scripts/download-core3000-images.js --limit 50
 */

const fs = require("fs");
const path = require("path");
const {
  CORE3000_DIR,
  slugify,
  buildExistingImageIndex,
  resolveImagePath,
  listCore3000Words,
  isPlaceholderImage,
  downloadImage,
  findWikiImageForWord,
} = require("./core3000-image-utils");

const MANIFEST_PATH = path.join(__dirname, "data/core3000-images.json");
const DELAY_MS = 3500;
const DELAY_AFTER_429_MS = 15000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

function saveManifest(manifest) {
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
}

function parseLimit() {
  const idx = process.argv.indexOf("--limit");
  if (idx === -1) return Infinity;
  return parseInt(process.argv[idx + 1], 10) || Infinity;
}

const RETRY_FAILED = process.argv.includes("--retry-failed");

async function main() {
  fs.mkdirSync(CORE3000_DIR, { recursive: true });

  const words = listCore3000Words();
  if (words.length === 0) {
    console.error("No words in vocs-learning-core3000.ts — run generate-core3000-vocs.js first.");
    process.exit(1);
  }

  const limit = parseLimit();
  const manifest = loadManifest();
  const existingImages = buildExistingImageIndex();

  let reused = 0;
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  let processed = 0;

  for (const word of words) {
    if (processed >= limit) break;

    const key = word.toLowerCase();
    const slug = slugify(word);
    const dest = path.join(CORE3000_DIR, `${slug}.jpg`);

    if (RETRY_FAILED) {
      const entry = manifest[key];
      if (!entry || entry.status !== "failed") continue;
      delete manifest[key];
    }

    const resolved = resolveImagePath(word, existingImages);
    if (!isPlaceholderImage(resolved)) {
      if (manifest[key]?.path === resolved && manifest[key]?.status === "ok") {
        skipped++;
        continue;
      }
      manifest[key] = { slug, path: resolved, status: "ok", source: "existing" };
      if (existingImages.has(key)) reused++;
      else if (fs.existsSync(dest)) skipped++;
      saveManifest(manifest);
      continue;
    }

    if (fs.existsSync(dest) && fs.statSync(dest).size > 500) {
      manifest[key] = {
        slug,
        path: `./data/core3000/${slug}.jpg`,
        status: "ok",
        source: "core3000",
      };
      skipped++;
      saveManifest(manifest);
      continue;
    }

    processed++;
    try {
      const imageUrl = await findWikiImageForWord(word);
      if (!imageUrl) throw new Error("no Wikipedia image");
      await downloadImage(imageUrl, dest);
      manifest[key] = {
        slug,
        path: `./data/core3000/${slug}.jpg`,
        status: "ok",
        source: "wikipedia",
      };
      downloaded++;
      console.log(`[${downloaded}] Downloaded: ${word} → ${slug}.jpg`);
    } catch (err) {
      manifest[key] = { slug, status: "failed", error: err.message };
      failed++;
      console.error(`Failed: ${word} — ${err.message}`);
      if (String(err.message).includes("429")) {
        console.log(`  rate limited — waiting ${DELAY_AFTER_429_MS / 1000}s…`);
        await sleep(DELAY_AFTER_429_MS);
      }
    }

    saveManifest(manifest);
    await sleep(DELAY_MS);
  }

  console.log("\nDone:");
  console.log(`  reused existing: ${reused}`);
  console.log(`  downloaded:      ${downloaded}`);
  console.log(`  skipped:         ${skipped}`);
  console.log(`  failed:          ${failed}`);
  console.log(`  manifest:        ${MANIFEST_PATH}`);
  console.log("\nRun: npm run generate:core3000-vocs");

  if (downloaded > 0 || reused > 0) {
    console.log("\nRegenerating vocs-learning-core3000.ts…");
    require("child_process").execSync("node scripts/generate-core3000-vocs.js", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
