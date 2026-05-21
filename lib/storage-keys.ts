export const STORAGE_KEYS = {
  currentCategory: "CURRENT_CATEGORY",
  currentSet: "CURRENT_SET",
  mute: "SETTINGS_MUTE",
  soundIconsAlign: "SETTINGS_SOUND_ICONS_ALIGN",
  learnedVocs: (category: string, setIdx: number) =>
    `LEARNED_VOCS_${category}_SET_${setIdx}`,
} as const;

export const LEARNED_VOCS_PREFIX = "LEARNED_VOCS_";
