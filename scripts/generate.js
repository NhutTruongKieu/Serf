const fs = require("fs");
const path = require("path");
const axios = require("axios");
const googleTTS = require("google-tts-api");

const words = [
  { voc: "apple", meaning: "quả táo" },
  { voc: "banana", meaning: "quả chuối" },
  { voc: "cat", meaning: "con mèo" },
  { voc: "dog", meaning: "con chó" },
  { voc: "elephant", meaning: "con voi" },
  { voc: "fish", meaning: "con cá" },
  { voc: "goat", meaning: "con dê" },
  { voc: "horse", meaning: "con ngựa" },
  { voc: "ice cream", meaning: "kem" },
  { voc: "juice", meaning: "nước ép" },
  { voc: "kite", meaning: "con diều" },
  { voc: "lion", meaning: "sư tử" },
  { voc: "monkey", meaning: "con khỉ" },
  { voc: "nest", meaning: "cái tổ" },
  { voc: "orange", meaning: "quả cam" },
  { voc: "penguin", meaning: "chim cánh cụt" },
  { voc: "queen", meaning: "nữ hoàng" },
  { voc: "rabbit", meaning: "con thỏ" },
  { voc: "snake", meaning: "con rắn" },
  { voc: "tiger", meaning: "con hổ" },
  { voc: "umbrella", meaning: "cái ô" },
  { voc: "violin", meaning: "đàn vĩ cầm" },
  { voc: "water", meaning: "nước" },
  { voc: "xylophone", meaning: "đàn mộc cầm" },
  { voc: "yacht", meaning: "du thuyền" },
  { voc: "zebra", meaning: "ngựa vằn" },
  { voc: "airplane", meaning: "máy bay" },
  { voc: "bicycle", meaning: "xe đạp" },
  { voc: "car", meaning: "ô tô" },
  { voc: "dinosaur", meaning: "khủng long" },
  { voc: "eagle", meaning: "đại bàng" },
  { voc: "flower", meaning: "bông hoa" },
  { voc: "guitar", cursor: "đàn ghi ta" },
  { voc: "hat", meaning: "cái mũ" },
  { voc: "island", meaning: "hòn đảo" },
  { voc: "jacket", meaning: "áo khoác" },
  { voc: "kangaroo", meaning: "chuột túi" },
  { voc: "lemon", meaning: "quả chanh" },
  { voc: "mountain", meaning: "ngọn núi" },
  { voc: "notebook", meaning: "quyển vở" },
  { voc: "ocean", meaning: "đại dương" },
  { voc: "pizza", meaning: "bánh pizza" },
  { voc: "quilt", meaning: "cái chăn" },
  { voc: "rainbow", meaning: "cầu vồng" },
  { voc: "sun", meaning: "mặt trời" },
  { voc: "tree", meaning: "cái cây" },
  { voc: "unicorn", meaning: "kỳ lân" },
  { voc: "volcano", meaning: "núi lửa" },
  { voc: "window", meaning: "cửa sổ" },
  { voc: "yarn", meaning: "sợi len" },
];

const dataPath = path.join(__dirname, "../data");
if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);

async function downloadAudio(word) {
  const safeName = word.replace(/\s+/g, "_");
  const dest = path.join(dataPath, `${safeName}.mp3`);
  
  if (fs.existsSync(dest)) return `${safeName}.mp3`;

  try {
    const url = googleTTS.getAudioUrl(word, {
      lang: "en",
      slow: false,
      host: "https://translate.google.com",
    });
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(dest, res.data);
    return `${safeName}.mp3`;
  } catch (err) {
    console.error(`Failed to download audio for ${word}`);
    return null;
  }
}

async function downloadImage(word) {
  const safeName = word.replace(/\s+/g, "_");
  const dest = path.join(dataPath, `${safeName}.jpg`);
  
  if (fs.existsSync(dest)) return `${safeName}.jpg`;

  try {
    // Generate a simple colored avatar with the word's initials and a unique color
    // This is instant and doesn't fail or block
    const shortName = word.substring(0, 2).toUpperCase();
    const url = `https://ui-avatars.com/api/?name=${shortName}&background=random&color=fff&size=400&font-size=0.4`;
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(dest, res.data);
    return `${safeName}.jpg`;
  } catch (err) {
    console.error(`Failed to get image for ${word}`);
    return null;
  }
}

async function run() {
  console.log("Starting generation of 50 vocabularies...");
  
  let tsContent = `export type Vocabulary = {
  voc: string;
  meaning: string;
  sound: any;
  image: any;
};\n\n`;

  tsContent += `export const new_vocs: Vocabulary[] = [\n`;

  // We can run these in parallel batches
  const BATCH_SIZE = 10;
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i/BATCH_SIZE + 1}...`);
    
    await Promise.all(batch.map(async (w) => {
      const audioFile = await downloadAudio(w.voc);
      const imgFile = await downloadImage(w.voc);
      w.audioFile = audioFile;
      w.imgFile = imgFile;
    }));
  }

  for (const w of words) {
    const soundReq = w.audioFile ? `require("../data/${w.audioFile}")` : `null`;
    const imgReq = w.imgFile ? `require("../data/${w.imgFile}")` : `require("../data/images.jpg")`;
    const mean = w.meaning || w.cursor;

    tsContent += `  {
    voc: "${w.voc}",
    meaning: "${mean}",
    sound: ${soundReq},
    image: ${imgReq},
  },\n`;
  }
  
  tsContent += `];\n\n`;
  tsContent += `export const vocs: Vocabulary[] = [...new_vocs];\n`;

  fs.writeFileSync(path.join(__dirname, "../assets/vocs.ts"), tsContent);
  console.log("Finished generating assets/vocs.ts!");
}

run();
