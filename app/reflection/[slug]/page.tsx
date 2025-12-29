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

  const containerClassName = submitted
    ? "relative z-10 min-h-[50vh] w-full px-5 flex items-center justify-center"
    : "relative z-10 w-full max-w-xl px-5 xl:px-0";
  const cardClassName = submitted
    ? "w-full max-w-xl rounded-2xl border bg-white/70 p-6 shadow-sm"
    : "rounded-2xl border bg-white/70 p-6 shadow-sm";

  return (
    <div className={containerClassName}>
      <div className={cardClassName}>
        {submitted ? (
          <div className="mx-auto p-8 text-center text-sm sm:text-base">
            <p className="text-gray-700">
              {t("reflection.received.line1")}
            </p>
            <p className="mt-2 text-gray-700">
              <em className="italic">{t("reflection.received.line2")}</em>
            </p>
          </div>
        ) : (
          <div className="mx-auto p-8 text-sm sm:text-base">
            <h1
              className={`${sriracha.className} mb-0 line-clamp-2 break-words hyphens-auto text-xl font-bold sm:text-2xl`}
              title={headline}
              aria-label={headline}
              lang={locale}
            >
              {headline}
            </h1>
            <p className="mb-5 text-gray-600">{t("reflection.subhead")}</p>
            <ReflectionForm slug={slug} />
          </div>
        )}
      </div>
    </div>
  );
}
