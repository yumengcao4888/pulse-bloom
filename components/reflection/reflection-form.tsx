"use client";

import { useState } from "react";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TriStateButton } from "@/components/reflection/tristate-button";
import { useLocale } from "@/components/shared/locale-provider";

type Props = {
  slug: string;
};

type TriState = null | "yes" | "no";
const WORD_LIMIT = 300;
const countWords = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).length;

export default function ReflectionForm({ slug }: Props) {
  const router = useRouter();
  const { t } = useLocale();

  const [grounded, setGrounded] = useState<TriState>(null);
  const [supported, setSupported] = useState<TriState>(null);
  const [connected, setConnected] = useState<TriState>(null);
  const [feeling, setFeeling] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!grounded || !supported || !connected) {
      setError(t("reflection.error.missing"));
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          grounded,
          supported,
          connected,
          feeling,
          honeypot,
          startedAt,
        }),
      });

      if (!res.ok) {
        setError(t("reflection.error"));
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      router.push(`/healer/${slug}/reflect?submitted=1`);
    } catch (err) {
      console.error(err);
      setError(t("reflection.error"));
      setSubmitting(false);
    }
  }

  return (
    <form
      action="/api/reflection"
      onSubmit={handleSubmit}
      method="POST"
      className="space-y-4 text-sm sm:text-base"
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="absolute left-[-10000px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="company">
          Company
        </label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <TriStateButton
          name="grounded"
          label={t("reflection.form.grounded")}
          value={grounded}
          onChange={setGrounded}
        />
        <TriStateButton
          name="supported"
          label={t("reflection.form.supported")}
          value={supported}
          onChange={setSupported}
        />
        <TriStateButton
          name="connected"
          label={t("reflection.form.connected")}
          value={connected}
          onChange={setConnected}
        />

        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}
      </div>

      <label className="block">
        <span className="text-gray-700">
          {t("reflection.form.optional")} <span className="text-gray-500">{t("form.optional")}</span>
        </span>
        <textarea
          name="feeling"
          className="w-full border p-3 rounded mt-1"
          placeholder={t("reflection.form.placeholder")}
          onChange={(e) => {
            const nextValue = e.target.value;
            if (countWords(nextValue) <= WORD_LIMIT) {
              setFeeling(nextValue);
              return;
            }
            const words = nextValue.trim().split(/\s+/).slice(0, WORD_LIMIT);
            setFeeling(words.join(" "));
          }}
          value={feeling}
          rows={3}
        />
        <p className="mt-0.5 text-right text-xs text-gray-500">
          {countWords(feeling)}/{WORD_LIMIT}
        </p>
      </label>

      <div className="flex justify-center">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full border border-pulse-bloom/30 bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-semibold text-pulse-bloom-deep shadow-sm transition-colors hover:bg-pulse-bloom-soft-hover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? t("reflection.submitting") : t("reflection.submit")}
        </button>
      </div>
    </form>
  );
}
