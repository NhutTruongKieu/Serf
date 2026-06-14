import { Audio } from "expo-av";
import type { MutableRefObject } from "react";

import { stopDeviceTts, speakAsync, textForTts } from "@/lib/device-tts";
import type { Vocabulary } from "@/lib/vocab-types";

export type VocSoundMode = "word" | "meaning" | "example";

export const VOC_SOUND_MODES: VocSoundMode[] = ["word", "meaning", "example"];

export const VOC_SOUND_MODE_LABEL_VI: Record<VocSoundMode, string> = {
  word: "Từ",
  meaning: "Nghĩa",
  example: "Ví dụ",
};

export function parseVocSoundMode(value: string | null): VocSoundMode {
  if (value === "meaning" || value === "example") return value;
  return "word";
}

export function getVocTtsPayload(
  voc: Vocabulary,
  mode: VocSoundMode
): { text: string; lang: "en-US" | "vi-VN" } | null {
  if (!voc.useDeviceTts) return null;
  if (mode === "meaning") {
    return {
      text: textForTts(voc.meaning),
      lang: voc.ttsMeaningLang ?? "vi-VN",
    };
  }
  return { text: voc.voc, lang: "en-US" };
}

export function canPlayVocabularyMode(
  voc: Vocabulary,
  mode: VocSoundMode
): boolean {
  if (getVocTtsPayload(voc, mode)) return true;
  return !!getVocAssetSource(voc, mode);
}

export function getVocAssetSource(voc: Vocabulary, mode: VocSoundMode): any {
  if (mode === "word") return voc.sound;
  if (mode === "meaning") return voc.meaningSound;
  return voc.exampleSound;
}

export async function playVocabularyMode(
  voc: Vocabulary,
  mode: VocSoundMode,
  ctx: {
    isMute: boolean;
    soundRef: MutableRefObject<Audio.Sound | null>;
  }
): Promise<void> {
  if (ctx.isMute) return;
  stopDeviceTts();
  try {
    if (ctx.soundRef.current) {
      await ctx.soundRef.current.unloadAsync();
      ctx.soundRef.current = null;
    }
  } catch {
    /* empty */
  }

  const tts = getVocTtsPayload(voc, mode);
  if (tts) {
    await speakAsync(tts.text, tts.lang);
    return;
  }

  const soundSource = getVocAssetSource(voc, mode);
  if (!soundSource) return;

  try {
    const { sound } = await Audio.Sound.createAsync(soundSource, {
      shouldPlay: true,
    });
    ctx.soundRef.current = sound;
  } catch {
    /* empty */
  }
}

export { stopDeviceTts };
