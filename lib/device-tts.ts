import * as Speech from "expo-speech";

export function stopDeviceTts(): void {
  Speech.stop();
}

/** Chuẩn hóa chuỗi đọc TTS (bỏ HTML entity đơn giản). */
export function textForTts(htmlish: string): string {
  return htmlish
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function speakAsync(
  text: string,
  lang: "en-US" | "vi-VN"
): Promise<void> {
  const t = textForTts(text);
  if (!t) return Promise.resolve();
  return new Promise((resolve) => {
    Speech.speak(t, {
      language: lang,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}
