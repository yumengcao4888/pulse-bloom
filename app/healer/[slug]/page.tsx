import { prisma } from "@/lib/prisma";
import {
  computeScores,
  getMonthlyReflections,
  getTopEmotionWords,
  roundToTwo,
} from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations, locales, type Locale, type MessageKey } from "@/lib/i18n";
import AutoPrint from "@/components/healer/auto-print";
import ProfileImage from "@/components/healer/profile-image";
import FeltCard from "@/components/healer/felt-card";
import HealerProfileDetails from "@/components/healer/healer-profile-details";
import { clerkClient } from "@clerk/nextjs/server";

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function HealerPage(props: PageProps) {
  const { slug } = await props.params;
  const locale = await getLocale();
  const t = getTranslations(locale);
  const formatPercent = (value: number | null | undefined) =>
    value == null ? t("common.none") : `${value}%`;
  const contactTypeLabels = {
    email: t("form.healer.contact.type.email"),
    phone: t("form.healer.contact.type.phone"),
    website: t("form.healer.contact.type.website"),
    social: t("form.healer.contact.type.social"),
  } as const;
  const formatContactWithDots = (value: string | null) => {
    if (!value) return "";
    return value.replace(/\./g, ".\u200b");
  };
  const formatSocialContact = (value: string | null) => {
    if (!value) return { label: "", rest: "" };
    const splitIndex = value.indexOf(":");
    if (splitIndex === -1) return { label: "", rest: value };
    return {
      label: value.slice(0, splitIndex + 1),
      rest: value.slice(splitIndex + 1).trimStart(),
    };
  };

  const healer = await prisma.healer.findUnique({
    where: { slug },
    include: {
      reflections: {
        orderBy: { createdAt: "desc" },
        select: {
          grounded: true,
          supported: true,
          connected: true,
          createdAt: true,
          emotionalWarmth: true,
          emotionalTone: true,
        },
      },
    },
  });

  if (!healer) {
    return <div className="relative z-10 p-6 text-red-500">{t("healer.notFound")}</div>;
  }

  let profileImageUrl = "/default-healer.jpg";
  if (healer.clerkId) {
    try {
      const client = await clerkClient();
      const healerUser = await client.users.getUser(healer.clerkId);
      if (healerUser.hasImage && healerUser.imageUrl) {
        profileImageUrl = healerUser.imageUrl;
      }
    } catch (err) {
      console.error("Failed to load healer profile image:", err);
    }
  }

  const scores = computeScores(healer.reflections);
  const monthlyReflections = getMonthlyReflections(healer.reflections);
  const getAverageWarmth = (
    reflections: Array<{ emotionalWarmth: { toString(): string } | number | null }>,
  ) => {
    const warmthScores = reflections
      .map((reflection) =>
        reflection.emotionalWarmth == null
          ? null
          : Number(reflection.emotionalWarmth),
      )
      .filter((score): score is number => Number.isFinite(score));
    if (warmthScores.length === 0) return null;
    const avg = warmthScores.reduce((total, value) => total + value, 0) / warmthScores.length;
    return roundToTwo(avg);
  };
  const formatWarmth = (value: number | null) =>
    value == null ? t("common.none") : `${Math.round(value)} / 100`;
  const translateEmotionLabel = (label: string) => {
    const key = `emotion.${label.toLowerCase()}` as MessageKey;
    const translated = t(key);
    return translated !== key ? translated : label;
  };
  const translateTopWords = (words: string[]) => words.map(translateEmotionLabel);
  const monthlySentiment = getAverageWarmth(monthlyReflections);
  const allTimeSentiment = getAverageWarmth(healer.reflections);
  const monthlyTopWords = translateTopWords(getTopEmotionWords(monthlyReflections));
  const allTimeTopWords = translateTopWords(getTopEmotionWords(healer.reflections));
  const normalizedHealerLocale =
    typeof healer.locale === "string" && locales.includes(healer.locale as Locale)
      ? (healer.locale as Locale)
      : locale;
  const shouldShowTranslate = normalizedHealerLocale !== locale;
  const languageDisplay = new Intl.DisplayNames([locale], { type: "language" });
  const viewInLabel = shouldShowTranslate
    ? t("healer.profile.seeIn", { language: languageDisplay.of(locale) ?? locale })
    : "";
  const revertLabel = shouldShowTranslate
    ? t("healer.profile.seeIn", {
        language: languageDisplay.of(normalizedHealerLocale) ?? normalizedHealerLocale,
      })
    : "";


  const monthlyCount = monthlyReflections.length;
  const totalCount = healer.reflections.length;
  const showMonthlyToggle = monthlyCount > 0 && monthlyCount !== totalCount;
  const monthlyCardData = {
    title: t("healer.monthly.title"),
    groundedLabel: t("healer.monthly.grounded"),
    groundedValue: formatPercent(scores.monthly.grounded),
    groundedValueLabel: t("healer.monthly.grounded.value"),
    supportedLabel: t("healer.monthly.supported"),
    supportedValue: formatPercent(scores.monthly.supported),
    supportedValueLabel: t("healer.monthly.supported.value"),
    connectedLabel: t("healer.monthly.connected"),
    connectedValue: formatPercent(scores.monthly.connected),
    connectedValueLabel: t("healer.monthly.connected.value"),
    moodLabel: t("healer.monthly.mood"),
    moodValueLabel: t("healer.monthly.mood.value"),
    moodValue: formatWarmth(monthlySentiment),
    topWordsLabel: t("healer.monthly.topWords"),
    topWordsValueLabel: t("healer.monthly.topWords.value"),
    topWords: monthlyTopWords,
    noneLabel: t("common.none"),
  };
  const allTimeCardData = {
    title: t("healer.monthly.titleAllTime"),
    groundedLabel: t("healer.monthly.grounded"),
    groundedValue: formatPercent(scores.allTime.grounded),
    groundedValueLabel: t("healer.monthly.grounded.value"),
    supportedLabel: t("healer.monthly.supported"),
    supportedValue: formatPercent(scores.allTime.supported),
    supportedValueLabel: t("healer.monthly.supported.value"),
    connectedLabel: t("healer.monthly.connected"),
    connectedValue: formatPercent(scores.allTime.connected),
    connectedValueLabel: t("healer.monthly.connected.value"),
    moodLabel: t("healer.monthly.mood"),
    moodValueLabel: t("healer.monthly.mood.value"),
    moodValue: formatWarmth(allTimeSentiment),
    topWordsLabel: t("healer.monthly.topWords"),
    topWordsValueLabel: t("healer.monthly.topWords.value"),
    topWords: allTimeTopWords,
    noneLabel: t("common.none"),
  };

  return (
    <>
      <AutoPrint />
      <div className="relative z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="my-10 mx-auto max-w-xl flex flex-col items-center space-y-6">
          <ProfileImage
            src={profileImageUrl}
            alt={t("healer.profile.photoAlt")}
            width={200}
            height={200}
            className="rounded-full object-cover"
          />
          <div className="mb-5 flex min-w-0 w-full flex-col items-center gap-1 text-3xl font-semibold">
            <h1
              className="line-clamp-2 min-w-0 max-w-[60%] w-full break-words text-center leading-tight pb-1"
              title={healer.name}
              aria-label={healer.name}
            >
              {healer.name}
            </h1>
            {healer.pronouns && (
              <span className="w-full text-center text-xl font-normal text-gray-600">
                ({healer.pronouns})
              </span>
            )}
            {healer.contactType ? (
              <p className="line-clamp-3 break-words text-center text-base font-normal text-gray-600">
                {healer.contactType === "social" ? (
                  (() => {
                    const { label, rest } = formatSocialContact(healer.contact);
                    if (!label) {
                      return formatContactWithDots(healer.contact);
                    }
                    return (
                      <>
                        <b>{label}</b>
                        {rest ? ` ${formatContactWithDots(rest)}` : ""}
                      </>
                    );
                  })()
                ) : (
                  <>
                    <b>
                      {`${contactTypeLabels[
                        healer.contactType as keyof typeof contactTypeLabels
                      ]}:`}
                    </b>{" "}
                    {formatContactWithDots(healer.contact)}
                  </>
                )}
              </p>
            ) : null}
          </div>
          <div className="w-full rounded-2xl border bg-white/70 p-6 shadow-sm">
            <HealerProfileDetails
              slug={slug}
              labels={{
                approach: t("healer.profile.approach"),
                workWith: t("healer.profile.workWith"),
                location: t("healer.profile.location"),
                about: t("healer.profile.about"),
                viewInLabel,
                revertLabel,
                translating: t("healer.profile.translating"),
                translationError: t("healer.profile.translationError"),
              }}
              values={{
                modality: healer.modality,
                focus: healer.focus,
                location: healer.location,
                bio: healer.bio,
              }}
              locale={locale}
              healerLocale={normalizedHealerLocale}
              showTranslate={shouldShowTranslate && Boolean(viewInLabel) && Boolean(revertLabel)}
            />
          </div>
          {healer.reflections.length > 0 ? (
            <FeltCard
              monthly={monthlyCardData}
              allTime={allTimeCardData}
              monthlyLabel={t("healer.monthly.toggle.month")}
              overTimeLabel={t("healer.monthly.toggle.allTime")}
              showToggle={showMonthlyToggle}
              defaultView={monthlyCount === 0 ? "allTime" : "monthly"}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
