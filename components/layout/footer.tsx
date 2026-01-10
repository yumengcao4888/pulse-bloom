"use client";

import Link from "next/link";
import { useLocale } from "@/components/shared/locale-provider";

export default function Footer() {
  const { t } = useLocale();
  return (
    <footer className="w-full">
      <div className="mx-auto w-full max-w-5xl px-5 pb-10 text-center text-xs text-gray-500 dark:text-gray-400">
        <div className="flex flex-nowrap items-center justify-center gap-2">
          <p className="whitespace-nowrap">{t("footer.openSource")}</p>
        </div>
        <p>
          <Link
            href="https://github.com/yumengcao4888/pulse-bloom"
            className="text-gray-600 underline-offset-4 hover:underline dark:text-gray-300"
          >
            GitHub
          </Link>{" "}
          © Copyleft 2025 PulseBloom
        </p>
      </div>
    </footer>
  );
}
