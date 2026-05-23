export const STORAGE_KEYS = {
  authSession: "AUTH_SESSION",
  googleBackupAt: "GOOGLE_BACKUP_AT",
  currentCategory: "CURRENT_CATEGORY",
  currentSet: "CURRENT_SET",
  mute: "SETTINGS_MUTE",
  soundIconsAlign: "SETTINGS_SOUND_ICONS_ALIGN",
  themeMode: "SETTINGS_THEME_MODE",
  progressUsesIds: "PROGRESS_STORAGE_V2",
  learnedVocs: (category: string, setIdx: number) =>
    `LEARNED_VOCS_${category}_SET_${setIdx}`,
} as const;

export const LEARNED_VOCS_PREFIX = "LEARNED_VOCS_";
