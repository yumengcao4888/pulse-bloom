"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, locales, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/shared/locale-provider";

export default function LanguageSwitcher() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  useEffect(() => {
    if (!pendingLocale) return;
    document.cookie = `${LOCALE_COOKIE}=${pendingLocale}; path=/; max-age=31536000`;
    router.refresh();
  }, [pendingLocale, router]);

  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
      <span className="hidden text-gray-500 dark:text-white sm:inline">
        {t("nav.language")}
      </span>
      <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white/70 dark:border-gray-800">
        {locales.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              if (item !== locale) {
                setPendingLocale(item);
              }
            }}
            className={`px-2.5 py-1 transition ${
              item === locale
                ? item === "es"
                  ? "bg-black text-white dark:bg-[rgb(138,92,188)]"
                  : "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100 dark:bg-[rgb(var(--pulse-bloom-midnight))] dark:hover:bg-[rgb(var(--pulse-bloom-dusk))]"
            }`}
            aria-pressed={item === locale}
          >
            {t(`nav.locale.${item}` as const)}
          </button>
        ))}
      </div>
    </div>
  );
}
