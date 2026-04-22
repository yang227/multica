import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createPersistStorage, defaultStorage } from "../platform";

export const locales = ["en", "zh", "ja", "ko", "es", "fr", "de", "pt"] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "multica_locale",
      storage: createJSONStorage(() => createPersistStorage(defaultStorage)),
    },
  ),
);
