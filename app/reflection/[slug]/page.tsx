import { prisma } from "@/lib/prisma";
import ReflectionForm from "@/components/reflection/reflection-form";
import { sriracha } from '@/app/fonts';
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ submitted?: string }>;
};

export default async function ReflectionPage(props: PageProps) {

  const { slug } = await props.params;
  const locale = await getLocale();
  const t = getTranslations(locale);
  const rawSearchParams =
    props.searchParams ? await props.searchParams : ({} as { submitted?: string });

  const submitted = rawSearchParams.submitted === "1";

  const healer = await prisma.healer.findUnique({
    where: { slug },
  });

  if (!healer) {
    return <div className="relative z-10 p-8 text-red-500 text-lg">{t("healer.notFound")}</div>;
  }

  const headline = t("reflection.headline", { name: healer.name });

  return (
    <div className="relative z-10 rounded-2xl border bg-white/70 p-6 shadow-sm">
      {submitted && (
        <p className="mb-0 rounded-lg bg-emerald-50 text-emerald-800 px-4 py-2 text-sm">
          {t("reflection.thankYou")}
        </p>
      )}

      <div className="max-w-xl mx-auto p-8">
        <h1
          className={`${sriracha.className} line-clamp-2 break-all text-2xl font-bold mb-0`}
          title={headline}
          aria-label={headline}
        >
          {headline}
        </h1>
        <p className="text-gray-600 mb-5">
          {t("reflection.subhead")}
        </p>
        <ReflectionForm slug={slug} />
      </div>
    </div>
  );
}
