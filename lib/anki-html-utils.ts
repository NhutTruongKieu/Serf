export function cleanHtmlText(html: string): string {
  let s = html || "";
  s = s.replace(/\{\{c\d+::([^}]+)\}\}/g, "$1");
  s = s.replace(/<br\s*\/?>/gi, " ");
  s = s.replace(/<\/div>\s*→/gi, " → ");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&nbsp;?/gi, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  s = s.replace(/\s+/g, " ");
  return s.trim();
}

export function parseTexts(raw: string): {
  meaningText: string;
  exampleText: string;
} {
  const normalized = (raw || "")
    .replace(/<br\s*\/?>\s*→/gi, " → ")
    .replace(/<\/div>\s*→/gi, " → ");
  const parts = normalized.split(/\s*(?:&nbsp;)?→(?:&nbsp;)?\s*/);
  return {
    meaningText: cleanHtmlText(parts[0] || ""),
    exampleText: cleanHtmlText(parts.slice(1).join(" → ") || ""),
  };
}

export function extractSound(raw: string): string | null {
  const m = (raw || "").match(/\[sound:([^\]]+)\]/);
  return m ? m[1] : null;
}

export function extractImage(raw: string): string | null {
  const m = (raw || "").match(/src=['"]([^'"]+)['"]/);
  return m ? m[1] : null;
}

export function formatIpa(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;
  if (s.startsWith("[") && s.endsWith("]")) return s;
  s = s.replace(/ˈ/g, "'");
  s = s.replace(/ˌ/g, ",");
  return `[${s}]`;
}

export function extractPos(html: string): string {
  const h = html || "";
  if (/tính từ/i.test(h)) return "adj";
  if (/danh từ/i.test(h)) return "n";
  if (/trạng từ/i.test(h)) return "adv";
  if (/giới từ/i.test(h)) return "prep";
  if (/liên từ/i.test(h)) return "conj";
  if (/đại từ/i.test(h)) return "pron";
  if (/động từ/i.test(h)) return "v";
  return "";
}
