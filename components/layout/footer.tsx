import Link from "next/link";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";

export default async function Footer() {
  const locale = await getLocale();
  const t = getTranslations(locale);
  return (
    <footer className="w-full">
      <div className="mx-auto w-full max-w-5xl px-5 pb-10 text-center text-xs text-gray-500 dark:text-gray-400">
        <p className="whitespace-nowrap">
          {t("footer.grownWithCarePrefix")}{" "}
          <Link
            href="https://chieac.org/"
            className="text-gray-600 underline-offset-4 hover:underline dark:text-gray-300"
          >
            ChiEAC
          </Link>
        </p>
        <p>
          <Link
            href="https://github.com/yumengcao4888/pulse-bloom"
            className="text-gray-600 underline-offset-4 hover:underline dark:text-gray-300"
          >
            GitHub
          </Link>{" "}
          • {t("footer.copyleft")}
        </p>
      </div>
    </footer>
  );
}
