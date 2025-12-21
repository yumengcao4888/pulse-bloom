"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { getTranslations, type Locale, type MessageKey } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = useMemo(() => getTranslations(locale), [locale]);
  const value = useMemo(() => ({ locale, t }), [locale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
