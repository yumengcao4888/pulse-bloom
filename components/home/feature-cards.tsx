"use client";

import { useState } from "react";
import Image from "next/image";
import Modal from "@/components/shared/modal";

type FeatureKey = "invite" | "sense" | "share";

type FeatureCopy = {
  title: string;
  description: string;
};

type Props = {
  locale: string;
  invite: FeatureCopy;
  sense: FeatureCopy;
  share: FeatureCopy;
};

const featureOrder: FeatureKey[] = ["invite", "sense", "share"];

export default function FeatureCards({ locale, invite, sense, share }: Props) {
  const [active, setActive] = useState<FeatureKey | null>(null);
  const open = active !== null;

  const setOpen = (nextOpen: boolean) => {
    if (!nextOpen) {
      setActive(null);
    }
  };

  const config = {
    invite: {
      copy: invite,
      images: [
        {
          src: `/screenshots/invite-flow-${locale}.jpg`,
          alt: "Invite flow screenshot",
        },
      ],
    },
    sense: {
      copy: sense,
      images: [
        {
          src: `/screenshots/sense-experience-${locale}.jpg`,
          alt: "Sense experience screenshot",
        },
      ],
    },
    share: {
      copy: share,
      images: [
        {
          src: `/screenshots/share-connection-${locale}-1.jpg`,
          alt: "Share connection screenshot one",
        },
        {
          src: `/screenshots/share-connection-${locale}-2.jpg`,
          alt: "Share connection screenshot two",
        },
      ],
    },
  } as const;

  const activeConfig = active ? config[active] : null;
  const isShare = active === "share";

  return (
    <>
      <section className="flex gap-4 overflow-x-auto pb-2 md:grid md:overflow-visible md:pb-0 md:grid-cols-3">
        {featureOrder.map((key) => {
          const feature = config[key].copy;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className="min-w-[240px] flex-1 rounded-2xl border bg-white/80 p-5 text-left text-sm text-gray-700 shadow-sm transition hover:shadow-md md:min-w-0"
            >
              <span className="block text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-300">
                {feature.title}
              </span>
              {feature.description}
            </button>
          );
        })}
      </section>

      <Modal
        open={open}
        setOpen={setOpen}
        className="w-fit max-w-none bg-transparent p-0"
        title="Feature preview"
      >
        {activeConfig ? (
          <div className="inline-flex h-fit items-center justify-center">
            <div
              className={
                isShare
                  ? "flex flex-col items-center justify-center gap-2 md:flex-row"
                  : "flex items-center justify-center"
              }
            >
              {activeConfig.images.map((image) => (
                <Image
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  width={1400}
                  height={900}
                  className={
                    isShare
                      ? "h-auto w-auto max-h-[80vh] max-w-[90vw] rounded-xl object-contain md:max-w-[44vw]"
                      : "h-auto w-auto max-h-[80vh] max-w-[90vw] rounded-xl object-contain"
                  }
                />
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
