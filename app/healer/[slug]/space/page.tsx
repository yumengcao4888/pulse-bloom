import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";
import ProfileImage from "@/components/healer/profile-image";
import ShareLinkButton from "@/components/healer/share-link-button";
import EditProfileSheet from "@/components/healer/edit-space-sheet";
import ReflectionCard from "@/components/healer/reflection-card";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function HealingSpacePage(props: PageProps) {
  const { slug } = await props.params;
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }
  const locale = await getLocale();
  const t = getTranslations(locale);
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
      _count: {
        select: {
          reflections: true,
        },
      },
    },
  });

  if (!healer) {
    return <div className="relative z-10 p-6 text-red-500">{t("healer.notFound")}</div>;
  }

  if (healer.clerkId !== userId) {
    redirect("/");
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

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const baseUrl = host ? `${protocol}://${host}` : "https://pulse-bloom.vercel.app";
  const reflectionLink = `${baseUrl}/healer/${slug}/reflect`;
  const sharableLink = `${baseUrl}/healer/${slug}`;
  const reflectionsCount = healer._count?.reflections ?? 0;
  const monthlyThreshold = new Date();
  monthlyThreshold.setDate(monthlyThreshold.getDate() - 30);
  const [
    groundedCount,
    supportedCount,
    connectedCount,
    monthlyCount,
    monthlyGroundedCount,
    monthlySupportedCount,
    monthlyConnectedCount,
    commentsCount,
    monthlyCommentsCount,
  ] = await Promise.all([
    prisma.reflection.count({ where: { healerId: healer.id, grounded: true } }),
    prisma.reflection.count({ where: { healerId: healer.id, supported: true } }),
    prisma.reflection.count({ where: { healerId: healer.id, connected: true } }),
    prisma.reflection.count({
      where: { healerId: healer.id, createdAt: { gte: monthlyThreshold } },
    }),
    prisma.reflection.count({
      where: { healerId: healer.id, grounded: true, createdAt: { gte: monthlyThreshold } },
    }),
    prisma.reflection.count({
      where: { healerId: healer.id, supported: true, createdAt: { gte: monthlyThreshold } },
    }),
    prisma.reflection.count({
      where: { healerId: healer.id, connected: true, createdAt: { gte: monthlyThreshold } },
    }),
    prisma.reflection.count({
      where: {
        healerId: healer.id,
        feeling: { not: null },
        NOT: { feeling: "" },
      },
    }),
    prisma.reflection.count({
      where: {
        healerId: healer.id,
        feeling: { not: null },
        NOT: { feeling: "" },
        createdAt: { gte: monthlyThreshold },
      },
    }),
  ]);

  return (
    <>
      <div className="relative z-10 w-full max-w-2xl px-5 xl:px-0">
        <div className="my-10 mx-auto w-full">
          <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
            <div className="flex items-center gap-4 sm:items-start">
              <div className="flex flex-col items-center gap-3 sm:items-start">
                <ProfileImage
                  src={profileImageUrl}
                  alt={t("healer.profile.photoAlt")}
                  width={88}
                  height={88}
                  className="h-[88px] w-[88px] rounded-full object-cover"
                />
              </div>
              <div className="flex flex-1 items-center justify-between gap-4">
                <div className="min-w-0 text-center sm:text-left">
                  <div className="flex min-w-0 flex-col items-center gap-1 sm:items-start">
                    <h1
                      className="line-clamp-2 min-w-0 max-w-full flex-1 break-all text-2xl font-semibold"
                      title={healer.name}
                      aria-label={healer.name}
                    >
                      {healer.name}
                    </h1>
                    {healer.pronouns && (
                      <span className="text-lg font-normal text-gray-600">
                        ({healer.pronouns})
                      </span>
                    )}
                  </div>
                  {healer.contactType ? (
                    <p className="mt-1 line-clamp-3 break-words text-sm text-gray-700">
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
                <div className="hidden shrink-0 flex-col items-center gap-2 sm:flex">
                  <EditProfileSheet
                    healer={{
                      name: healer.name,
                      pronouns: healer.pronouns,
                      modality: healer.modality,
                      focus: healer.focus,
                      location: healer.location,
                      contact: healer.contact,
                      contactType: healer.contactType,
                      bio: healer.bio,
                    }}
                  />
                  <ShareLinkButton
                    link={sharableLink}
                    buttonLabel="Share your space"
                    title="Share your space"
                    description="Share this link or QR code to let others see your space."
                    buttonClassName="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
                  />
                  <ShareLinkButton
                    link={reflectionLink}
                    buttonLabel="Invite reflection"
                    title="Invite reflection"
                    description="Share this link or QRcode with your clients."
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex w-full items-center justify-center gap-2 sm:hidden">
              <EditProfileSheet
                healer={{
                  name: healer.name,
                  pronouns: healer.pronouns,
                  modality: healer.modality,
                  focus: healer.focus,
                  location: healer.location,
                  contact: healer.contact,
                  contactType: healer.contactType,
                  bio: healer.bio,
                }}
              />
              <ShareLinkButton
                link={sharableLink}
                buttonLabel="Share your space"
                title="Share your space"
                description="Share this link or QR code to let others see your space."
                buttonClassName="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
              />
              <ShareLinkButton
                link={reflectionLink}
                buttonLabel="Invite reflection"
                title="Invite reflection"
                description="Share this link or QRcode with your clients."
              />
            </div>
            <div className="my-4 border-t border-gray-200" />
            <div className="text-gray-700">
              <p>
                <b>{"Modality"}:</b> {healer.modality}
              </p>
              <div className="my-2 border-t border-dashed border-gray-200" />
              <p>
                <b>{t("healer.dev.focus")}:</b> {healer.focus}
              </p>
              <div className="my-2 border-t border-dashed border-gray-200" />
              {healer.location ? (
                <>
                  <p>
                    <b>{t("healer.dev.city")}:</b> {healer.location}
                  </p>
                  <div className="my-2 border-t border-dashed border-gray-200" />
                </>
              ) : null}
              <p className="break-words hyphens-auto text-gray-700" lang={locale}>
                <b>{t("healer.dev.bio")}:</b> {healer.bio}
              </p>
            </div>
          </div>
        </div>
      </div>

      {reflectionsCount > 0 && (
        <ReflectionCard
          slug={slug}
          reflectionsCount={reflectionsCount}
          allTimeCounts={{
            total: reflectionsCount,
            grounded: groundedCount,
            supported: supportedCount,
            connected: connectedCount,
            comments: commentsCount,
          }}
          monthlyCounts={{
            total: monthlyCount,
            grounded: monthlyGroundedCount,
            supported: monthlySupportedCount,
            connected: monthlyConnectedCount,
            comments: monthlyCommentsCount,
          }}
        />
      )}
    </>
  );
}
