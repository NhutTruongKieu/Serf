export type Vocabulary = {
  id: string;
  voc: string;
  pos: string;
  meaning: string;
  category: string;
  sound?: any;
  exampleSound?: any;
  meaningSound?: any;
  /** Bộ số LEARN_NUM_* có thể bỏ qua (dùng VocabularyNumberGraphic). */
  image?: any;
  ipa?: string;
  /** Phát âm bằng TTS thiết bị (không dùng file mp3 trong bundle). */
  useDeviceTts?: boolean;
  /** Ngôn ngữ TTS cho nút nghĩa; mặc định vi-VN khi dùng useDeviceTts. */
  ttsMeaningLang?: "en-US" | "vi-VN";
};
