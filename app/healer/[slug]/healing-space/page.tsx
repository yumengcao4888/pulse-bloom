import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";
import PrintProfileButton from "@/components/healer/print-profile-button";
import HealerProfileImage from "@/components/healer/healer-profile-image";
import InviteReflectionButton from "@/components/healer/invite-reflection-button";
import EditProfileSheet from "@/components/healer/edit-space-sheet";
import ReflectionsDisclosure from "@/components/healer/reflections-disclosure";
import { clerkClient } from "@clerk/nextjs/server";

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function HealingSpacePage(props: PageProps) {
  const { slug } = await props.params;
  const locale = await getLocale();
  const t = getTranslations(locale);

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

  const reflectionLink = `http://pulse-bloom.vercel.app/reflection/${slug}`;
  const sharableLink = `http://pulse-bloom.vercel.app/healer/${slug}`;
  const reflectionsCount = healer._count?.reflections ?? 0;

  return (
    <>
      <div className="relative z-10 w-full max-w-2xl px-5 xl:px-0">
        <div className="my-10 mx-auto w-full">
          <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
            <div className="flex items-center gap-4 sm:items-start">
              <div className="flex flex-col items-center gap-3 sm:items-start">
                <HealerProfileImage
                  src={profileImageUrl}
                  alt={t("healer.profile.photoAlt")}
                  width={88}
                  height={88}
                  className="h-[88px] w-[88px] rounded-full object-cover"
                />
                <div className="flex flex-col items-center gap-2 sm:hidden">
                  <EditProfileSheet
                    healer={{
                      name: healer.name,
                      pronouns: healer.pronouns,
                      modality: healer.modality,
                      focus: healer.focus,
                      city: healer.city,
                      contact: healer.contact,
                      bio: healer.bio,
                    }}
                  />
                  <InviteReflectionButton reflectionLink={reflectionLink} />
                </div>
              </div>
              <div className="flex flex-1 items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-2">
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
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-gray-700">
                    <span>{healer.modality}</span>
                    <span aria-hidden="true">·</span>
                    <span>{healer.focus}</span>
                    <span aria-hidden="true">·</span>
                    <span>{healer.city}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">
                    <b>{t("healer.dev.contact")}:</b> {healer.contact}
                  </p>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                  <EditProfileSheet
                    healer={{
                      name: healer.name,
                      pronouns: healer.pronouns,
                      modality: healer.modality,
                      focus: healer.focus,
                      city: healer.city,
                      contact: healer.contact,
                      bio: healer.bio,
                    }}
                  />
                  <InviteReflectionButton reflectionLink={reflectionLink} />
                </div>
              </div>
            </div>
            <div className="my-4 border-t border-gray-200" />
            <p className="text-gray-700">
              <b>{t("healer.dev.bio")}:</b> {healer.bio}
            </p>
            <p className="text-gray-700">
              <b>Sharable link:</b>{" "}
              <Link href={sharableLink} className="text-blue-600 underline">
                {sharableLink}
              </Link>
            </p>
            <div className="flex flex-wrap items-center gap-3 text-gray-700">
              <p>
                <b>{t("healer.dev.reflectionsCount")}:</b> {reflectionsCount}
              </p>
              <PrintProfileButton slug={healer.slug} />
            </div>
          </div>
        </div>
      </div>

      {reflectionsCount > 0 && (
        <ReflectionsDisclosure slug={slug} />
      )}
    </>
  );
}
