import { prisma } from "@/lib/prisma";
import {
  computeScores,
  getMonthlyReflections,
} from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";
import AutoPrint from "@/components/healer/auto-print";
import HealerProfileImage from "@/components/healer/healer-profile-image";
import WhatWeFeltCardAsync from "@/components/healer/what-we-felt-card-async";
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
  const placeholderToken = "\u2014";
  const pendingMoodValue = `${placeholderToken} / 100`;
  const pendingTopWords = Array.from({ length: 3 }, () => placeholderToken);


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
    moodValue: pendingMoodValue,
    topWordsLabel: t("healer.monthly.topWords"),
    topWordsValueLabel: t("healer.monthly.topWords.value"),
    topWords: pendingTopWords,
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
    moodValue: pendingMoodValue,
    topWordsLabel: t("healer.monthly.topWords"),
    topWordsValueLabel: t("healer.monthly.topWords.value"),
    topWords: pendingTopWords,
    noneLabel: t("common.none"),
  };

  return (
    <>
      <AutoPrint />
      <div className="relative z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="my-10 mx-auto max-w-xl flex flex-col items-center space-y-6">
          <HealerProfileImage
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
            <p className="text-gray-700">
              <b>{t("healer.profile.approach")}</b> {healer.modality}
            </p>
            <div className="my-2 border-t border-dashed border-gray-200" />
            <p className="text-gray-700">
              <b>{t("healer.profile.workWith")}</b> {healer.focus}
            </p>
            <div className="my-2 border-t border-dashed border-gray-200" />
            {healer.location ? (
              <>
                <p className="text-gray-700">
                  <b>{t("healer.profile.location")}</b> {healer.location}
                </p>
                <div className="my-2 border-t border-dashed border-gray-200" />
              </>
            ) : null}
            <p className="break-words hyphens-auto text-gray-700" lang={locale}>
              <b>{t("healer.profile.about")}</b> {healer.bio}
            </p>
          </div>
          {healer.reflections.length > 0 ? (
            <WhatWeFeltCardAsync
              slug={slug}
              monthly={monthlyCardData}
              allTime={allTimeCardData}
              monthlyLabel={t("healer.monthly.toggle.month")}
              allTimeLabel={t("healer.monthly.toggle.allTime")}
              showToggle={showMonthlyToggle}
              defaultView={monthlyCount === 0 ? "allTime" : "monthly"}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
