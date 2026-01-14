import SpaceCta from "@/components/home/space-cta";
import FeatureCards from "@/components/home/feature-cards";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const { userId } = await auth();
  const healer = userId
    ? await prisma.healer.findUnique({
        where: { clerkId: userId },
        select: { slug: true },
      })
    : null;
  const locale = await getLocale();
  const t = getTranslations(locale);
  return (
    <div className="relative z-10 flex w-full items-start px-5 xl:px-0">
      <div className="mx-auto w-full max-w-5xl space-y-8">

        <section className="rounded-3xl border bg-white/80 p-8 shadow-sm backdrop-blur md:p-12">
          <h1 className="text-3xl font-semibold leading-tight text-gray-900 md:text-5xl">
            {t("home.hero.title")}
          </h1>
          <p className="mt-4 text-base text-gray-600 md:text-lg">
            {t("home.hero.description")}
          </p>
          <p className="mt-2 text-sm text-gray-500">{t("home.hero.subtext")}</p>
        </section>

        <FeatureCards
          locale={locale}
          invite={{
            title: t("home.feature.invite.title"),
            description: t("home.feature.invite.description"),
          }}
          sense={{
            title: t("home.feature.sense.title"),
            description: t("home.feature.sense.description"),
          }}
          share={{
            title: t("home.feature.share.title"),
            description: t("home.feature.share.description"),
          }}
        />

        <SpaceCta initialSlug={healer?.slug ?? null} initialChecked={Boolean(userId)} />

      </div>
    </div>
  );
}
