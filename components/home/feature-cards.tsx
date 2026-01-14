"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Modal from "@/components/shared/modal";
import useMediaQuery from "@/lib/hooks/use-media-query";

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
  const { isDesktop } = useMediaQuery();
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (event: React.PointerEvent) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start) {
      return;
    }
    const deltaX = Math.abs(event.clientX - start.x);
    const deltaY = Math.abs(event.clientY - start.y);
    if (deltaX < 5 && deltaY < 5) {
      setActive(null);
    }
  };

  const setOpen = (nextOpen: boolean | ((prevState: boolean) => boolean)) => {
    const resolvedOpen = typeof nextOpen === "function" ? nextOpen(true) : nextOpen;
    if (!resolvedOpen) {
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
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!isDesktop) {
                  setActive(key);
                }
              }}
              onKeyDown={(event) => {
                if (!isDesktop && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  setActive(key);
                }
              }}
              className="relative min-w-[240px] flex-1 rounded-2xl border bg-white/80 p-5 text-left text-sm text-gray-700 shadow-sm transition hover:shadow-md md:min-w-0"
            >
              <button
                type="button"
                aria-label="Open feature preview"
                onClick={(event) => {
                  event.stopPropagation();
                  setActive(key);
                }}
                className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-400 transition hover:border-gray-300 hover:text-gray-600"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="M13 13l4 4" strokeLinecap="round" />
                </svg>
              </button>
              <span className="block text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-300">
                {feature.title}
              </span>
              {feature.description}
            </div>
          );
        })}
      </section>

      <Modal
        open={open}
        setOpen={setOpen}
        className="h-fit w-fit max-w-none max-h-none bg-transparent p-0 overflow-visible border-0"
        mobileClassName={
          isShare
            ? "w-fit max-w-[92vw] bg-transparent p-0 !left-1/2 !right-auto !-translate-x-1/2 !max-h-[90dvh] !border-0 !overflow-hidden"
            : "h-fit w-fit max-w-[92vw] bg-transparent p-0 !left-1/2 !right-auto !-translate-x-1/2 !overflow-visible !max-h-[90dvh] !border-0"
        }
        title="Feature preview"
        hideHandle
      >
        {activeConfig ? (
          <div className="inline-flex h-fit items-center justify-center">
            <div
              className={
                isShare
                  ? "flex max-h-[90dvh] flex-col items-center gap-2 overflow-y-auto md:max-h-none md:flex-row md:overflow-visible"
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
                  draggable={false}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
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
