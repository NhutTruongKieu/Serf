const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../assets/vocs.ts');
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}
let content = fs.readFileSync(filePath, 'utf8');

// Update Vocabulary type
content = content.replace(
  /export type Vocabulary = \{[\s\S]*?\};/,
  `export type Vocabulary = {
  voc: string;
  meaning: string;
  sound: any;
  exampleSound: any;
  meaningSound: any;
  image: any;
};`
);

// Update all entries
// Pattern: sound: require("./data/4000B2_(.+).mp3"),
content = content.replace(
  /sound: require\("\.\/data\/4000B2_(.+)\.mp3"\),/g,
  (match, word) => {
    return `sound: require("./data/4000B2_${word}.mp3"),
    exampleSound: require("./data/4000B2_${word}_example.mp3"),
    meaningSound: require("./data/4000B2_${word}_meaning.mp3"),`;
  }
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated vocs.ts');
