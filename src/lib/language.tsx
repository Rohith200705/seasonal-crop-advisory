"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { translate, type Lang } from "./i18n";

const STORAGE_KEY = "sca-lang";
const CHANGE_EVENT = "sca-lang-change";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function getSnapshot(): string {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "hi" || v === "ta" ? v : "en";
  } catch {
    return "en";
  }
}

function getServerSnapshot(): string {
  return "en";
}

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) as Lang;

  const setLang = (l: Lang) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* private mode */
    }
    document.documentElement.lang = l;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  const t = (key: string) => translate(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

export function cropLabel(
  lang: Lang,
  crop: { name: string; hindiName?: string; tamilName?: string }
): string {
  if (lang === "hi" && crop.hindiName) return crop.hindiName;
  if (lang === "ta" && crop.tamilName) return crop.tamilName;
  return crop.name;
}
