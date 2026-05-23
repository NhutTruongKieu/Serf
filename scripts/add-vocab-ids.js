/**
 * Adds stable id fields to vocabulary entries from image filenames (4000B2_601, etc.)
 * Run: node scripts/add-vocab-ids.js
 */

const fs = require("fs");
const path = require("path");

const FILES = [
  path.join(__dirname, "../assets/vocs.ts"),
  path.join(__dirname, "../assets/vocs2.ts"),
];

function addIdsToContent(content) {
  const lines = content.split("\n");
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    out.push(line);

    if (line.trim() !== "{") continue;

    const next = lines[i + 1];
    if (!next?.includes("voc:") || next.includes("id:")) continue;

    let imageId = null;
    for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
      const match = lines[j].match(/(4000B\d+_\d+)/);
      if (match) {
        imageId = match[1];
        break;
      }
    }

    if (imageId) {
      const indent = next.match(/^(\s*)/)[1];
      out.push(`${indent}id: "${imageId}",`);
    }
  }

  return out.join("\n");
}

function updateTypeDefinition(content) {
  if (!content.includes("export type Vocabulary")) return content;
  if (content.includes("id: string")) return content;

  return content.replace(
    /export type Vocabulary = \{\n/,
    "export type Vocabulary = {\n  id: string;\n"
  );
}

for (const filePath of FILES) {
  let content = fs.readFileSync(filePath, "utf8");
  if (filePath.endsWith("vocs.ts")) {
    content = updateTypeDefinition(content);
  }
  content = addIdsToContent(content);
  fs.writeFileSync(filePath, content);

  const count = (content.match(/^\s+id: "/gm) || []).length;
  const vocCount = (content.match(/voc: "/g) || []).length;
  console.log(`${path.basename(filePath)}: ${count} ids / ${vocCount} entries`);
}
