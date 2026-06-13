import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

import type { ParsedApkgDeck } from "@/lib/anki-apkg-import";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Vocabulary } from "@/lib/vocab-types";

export type ImportedDeckMeta = {
  id: string;
  name: string;
  category: string;
  importedAt: string;
  wordCount: number;
};

type StoredVocabulary = Omit<
  Vocabulary,
  "sound" | "exampleSound" | "meaningSound" | "image"
> & {
  soundUri?: string;
  exampleSoundUri?: string;
  meaningSoundUri?: string;
  imageUri?: string;
};

function toStored(v: Vocabulary): StoredVocabulary {
  const { sound, exampleSound, meaningSound, image, ...rest } = v;
  const stored: StoredVocabulary = { ...rest };
  if (sound?.uri) stored.soundUri = sound.uri;
  if (exampleSound?.uri) stored.exampleSoundUri = exampleSound.uri;
  if (meaningSound?.uri) stored.meaningSoundUri = meaningSound.uri;
  if (image?.uri) stored.imageUri = image.uri;
  return stored;
}

function fromStored(v: StoredVocabulary): Vocabulary {
  const { soundUri, exampleSoundUri, meaningSoundUri, imageUri, ...rest } = v;
  const entry: Vocabulary = { ...rest };
  if (soundUri) entry.sound = { uri: soundUri };
  if (exampleSoundUri) entry.exampleSound = { uri: exampleSoundUri };
  if (meaningSoundUri) entry.meaningSound = { uri: meaningSoundUri };
  if (imageUri) entry.image = { uri: imageUri };
  return entry;
}

async function loadDeckMetaList(): Promise<ImportedDeckMeta[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.importedVocabDecks);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ImportedDeckMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveDeckMetaList(list: ImportedDeckMeta[]): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.importedVocabDecks,
    JSON.stringify(list)
  );
}

export async function listImportedDecks(): Promise<ImportedDeckMeta[]> {
  return loadDeckMetaList();
}

export async function loadImportedVocabulary(): Promise<Vocabulary[]> {
  const decks = await loadDeckMetaList();
  const all: Vocabulary[] = [];

  for (const deck of decks) {
    const raw = await AsyncStorage.getItem(
      STORAGE_KEYS.importedVocabData(deck.id)
    );
    if (!raw) continue;
    try {
      const stored = JSON.parse(raw) as StoredVocabulary[];
      if (Array.isArray(stored)) {
        all.push(...stored.map(fromStored));
      }
    } catch {
      /* skip corrupt deck */
    }
  }

  return all;
}

export async function saveImportedDeck(
  parsed: ParsedApkgDeck
): Promise<ImportedDeckMeta> {
  const deckId = parsed.entries[0]?.setGroup ?? `deck_${Date.now()}`;
  const category =
    parsed.entries[0]?.category ?? `Imported: ${parsed.deckName}`;

  const meta: ImportedDeckMeta = {
    id: deckId,
    name: parsed.deckName,
    category,
    importedAt: new Date().toISOString(),
    wordCount: parsed.entries.length,
  };

  const stored = parsed.entries.map(toStored);
  await AsyncStorage.setItem(
    STORAGE_KEYS.importedVocabData(deckId),
    JSON.stringify(stored)
  );

  const list = await loadDeckMetaList();
  const existingIdx = list.findIndex((d) => d.id === deckId);
  if (existingIdx >= 0) {
    list[existingIdx] = meta;
  } else {
    list.push(meta);
  }
  await saveDeckMetaList(list);

  return meta;
}

export async function removeImportedDeck(deckId: string): Promise<void> {
  const list = await loadDeckMetaList();
  const deck = list.find((d) => d.id === deckId);
  await AsyncStorage.removeItem(STORAGE_KEYS.importedVocabData(deckId));
  await saveDeckMetaList(list.filter((d) => d.id !== deckId));

  if (deck) {
    const dir = `${FileSystem.documentDirectory}imported-apkg/${deckId}/`;
    try {
      await FileSystem.deleteAsync(dir, { idempotent: true });
    } catch {
      /* ignore */
    }
  }
}

export async function importApkgDeck(
  parsed: ParsedApkgDeck
): Promise<ImportedDeckMeta> {
  return saveImportedDeck(parsed);
}
