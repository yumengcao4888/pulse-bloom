"use client";

import { useState } from "react";
import { type Locale } from "@/lib/i18n";

type Labels = {
  approach: string;
  workWith: string;
  location: string;
  about: string;
  viewInLabel: string;
  revertLabel: string;
  translating: string;
  translationError: string;
};

type Values = {
  modality: string;
  focus: string;
  location: string | null;
  bio: string;
};

type Props = {
  slug: string;
  labels: Labels;
  values: Values;
  locale: Locale;
  healerLocale: Locale;
  showTranslate: boolean;
};

export default function HealerProfileDetails({
  slug,
  labels,
  values,
  locale,
  healerLocale,
  showTranslate,
}: Props) {
  const [translated, setTranslated] = useState<Values | null>(null);
  const [cachedTranslation, setCachedTranslation] = useState<Values | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState("");

  const content = translated ?? values;
  const contentLocale = translated ? locale : healerLocale;
  const isTranslated = Boolean(translated);

  const handleTranslate = async () => {
    setIsTranslating(true);
    setError("");

    try {
      const res = await fetch(`/api/healer/${slug}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLocale: healerLocale,
          targetLocale: locale,
          fields: values,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to translate");
      }

      const data = await res.json();
      if (!data?.translated) {
        throw new Error("Missing translation payload");
      }

      setTranslated(data.translated);
      setCachedTranslation(data.translated);
    } catch (err) {
      console.error(err);
      setError(labels.translationError);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggle = async () => {
    if (isTranslated) {
      setTranslated(null);
      setError("");
      return;
    }

    if (cachedTranslation) {
      setTranslated(cachedTranslation);
      setError("");
      return;
    }

    await handleTranslate();
  };

  return (
    <>
      <p className="text-gray-700">
        <b>{labels.approach}</b>{" "}
        <span lang={contentLocale}>{content.modality}</span>
      </p>
      <div className="my-2 border-t border-dashed border-gray-200" />
      <p className="text-gray-700">
        <b>{labels.workWith}</b>{" "}
        <span lang={contentLocale}>{content.focus}</span>
      </p>
      <div className="my-2 border-t border-dashed border-gray-200" />
      {content.location ? (
        <>
          <p className="text-gray-700">
            <b>{labels.location}</b>{" "}
            <span lang={contentLocale}>{content.location}</span>
          </p>
          <div className="my-2 border-t border-dashed border-gray-200" />
        </>
      ) : null}
      <p className="break-words hyphens-auto text-gray-700">
        <b>{labels.about}</b>{" "}
        <span lang={contentLocale}>{content.bio}</span>
      </p>
      {showTranslate ? (
        <div className="mt-2">
          <div className="my-2 border-t border-gray-200" />
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleToggle}
              className="inline-flex items-center justify-center rounded-full border border-pulse-bloom/30 bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-semibold text-pulse-bloom-deep shadow-sm transition-colors hover:bg-pulse-bloom-soft-hover disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-cta))] dark:text-white dark:shadow-md dark:hover:bg-[rgb(var(--dark-cta-hover))]"
              disabled={isTranslating}
            >
              {isTranslating
                ? labels.translating
                : (isTranslated ? labels.revertLabel : labels.viewInLabel)}
            </button>
            {error ? (
              <span className="text-xs text-red-500">{error}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
