export const STORAGE_KEYS = {
  authSession: "AUTH_SESSION",
  googleBackupAt: "GOOGLE_BACKUP_AT",
  currentCategory: "CURRENT_CATEGORY",
  currentSet: "CURRENT_SET",
  mute: "SETTINGS_MUTE",
  soundIconsAlign: "SETTINGS_SOUND_ICONS_ALIGN",
  soundIconsInlinePicker: "SETTINGS_SOUND_ICONS_INLINE_PICKER",
  reviewScope: "REVIEW_SHUFFLE_SCOPE",
  reviewSoundMode: "REVIEW_SHUFFLE_SOUND_MODE",
  themeMode: "SETTINGS_THEME_MODE",
  progressUsesIds: "PROGRESS_STORAGE_V2",
  /** Legacy — chỉ đọc khi migrate sang SRS. */
  reviewMasteredIds: "REVIEW_MASTERED_IDS",
  srsCardStates: "SRS_CARD_STATES_V1",
  quizSessions: "QUIZ_SESSIONS_V1",
  importedVocabDecks: "IMPORTED_VOCAB_DECKS",
  importedVocabData: (deckId: string) => `IMPORTED_VOCAB_${deckId}`,
  learnedVocs: (category: string, setIdx: number) =>
    `LEARNED_VOCS_${category}_SET_${setIdx}`,
} as const;

export const LEARNED_VOCS_PREFIX = "LEARNED_VOCS_";
