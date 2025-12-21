import HealerForm from "@/components/healer/healer-form";
import { italianno } from '@/app/fonts';
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";

export default async function HealerPage() {
  const locale = await getLocale();
  const t = getTranslations(locale);

  return (
    <>
      <div className="relative z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="my-10 mx-auto max-w-xl">
          <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
            <h2 className={`${italianno.className} text-gray-800 text-3xl leading-snug md:text-5xl md:leading-normal`}>
              {t("home.title")}
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              {t("home.subtitle")}
            </p>
            <HealerForm />
          </div>
        </div>
      </div>
    </>
  );
}
