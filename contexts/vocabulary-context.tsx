import { vocs as builtInVocs } from "@/assets/vocs";
import { useAppSettings } from "@/contexts/app-settings";
import { loadImportedVocabulary } from "@/lib/imported-vocab-storage";
import type { Vocabulary } from "@/lib/vocab-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type VocabularyContextValue = {
  allVocs: Vocabulary[];
  isLoading: boolean;
  reloadVocabulary: () => Promise<void>;
};

const VocabularyContext = createContext<VocabularyContextValue | null>(null);

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const { vocabReloadToken } = useAppSettings();
  const [importedVocs, setImportedVocs] = useState<Vocabulary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadVocabulary = useCallback(async () => {
    setIsLoading(true);
    try {
      const imported = await loadImportedVocabulary();
      setImportedVocs(imported);
    } catch {
      setImportedVocs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadVocabulary();
  }, [reloadVocabulary, vocabReloadToken]);

  const allVocs = useMemo(
    () => [...builtInVocs, ...importedVocs],
    [importedVocs]
  );

  const value = useMemo(
    () => ({
      allVocs,
      isLoading,
      reloadVocabulary,
    }),
    [allVocs, isLoading, reloadVocabulary]
  );

  return (
    <VocabularyContext.Provider value={value}>
      {children}
    </VocabularyContext.Provider>
  );
}

export function useVocabulary() {
  const ctx = useContext(VocabularyContext);
  if (!ctx) {
    throw new Error("useVocabulary must be used within VocabularyProvider");
  }
  return ctx;
}

export function isImportedCategory(category: string): boolean {
  return category.startsWith("Imported:");
}

export function importedCategoryLabel(category: string): string {
  if (!isImportedCategory(category)) return category;
  return category.replace(/^Imported:\s*/, "Nhập: ");
}
