"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useLocale } from "@/components/shared/locale-provider";

const STORAGE_KEY = "pulsebloom-theme";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const isDark = theme === "dark";
  const { t } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-sm transition hover:border-pulse-bloom/40 hover:bg-pulse-bloom-soft/30 hover:text-gray-900 hover:shadow-md dark:border-gray-800 dark:bg-black dark:text-gray-100 dark:hover:border-pulse-bloom/50 dark:hover:bg-pulse-bloom/20"
      aria-pressed={isDark}
      aria-label={t("theme.toggle.aria")}
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">
        {isDark ? t("theme.toggle.light") : t("theme.toggle.dark")}
      </span>
    </button>
  );
}
