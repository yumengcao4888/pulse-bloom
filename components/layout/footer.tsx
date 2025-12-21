import { BuyMeACoffee } from "../shared/icons";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";

export default async function Footer() {
  const locale = await getLocale();
  const t = getTranslations(locale);

  return (
    <div className="absolute w-full py-5 text-center">
      <p className="text-gray-500">
        {t("footer.projectBy")}{" "}
        <a
          className="font-semibold text-gray-600 underline-offset-4 transition-colors hover:underline"
          href="https://twitter.com/steventey"
          target="_blank"
          rel="noopener noreferrer"
        >
          Steven Tey
        </a>
      </p>
      <a
        href="https://www.buymeacoffee.com/steventey"
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto mt-2 flex max-w-fit items-center justify-center space-x-2 rounded-lg border border-gray-200 bg-white px-6 py-2 transition-all duration-75 hover:scale-105"
      >
        <BuyMeACoffee className="h-6 w-6" />
        <p className="font-medium text-gray-600">{t("footer.buyCoffee")}</p>
      </a>
    </div>
  );
}
