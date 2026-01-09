"use client";

import { useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/shared/locale-provider";
import { isValidPronouns } from "@/lib/pronouns";
import { cn } from "@/lib/utils";

type HealerForm = {
  name: string;
  pronouns: string;
  modality: string;
  focus: string;
  location: string;
  contact: string;
  contactType: "email" | "phone" | "website" | "social" | "";
  bio: string;
};

const initialForm: HealerForm = {
  name: '',
  pronouns: '',
  modality: '',
  focus: '',
  location: '',
  contact: '',
  contactType: '',
  bio: '',
};

const BIO_WORD_LIMIT = 300;
const getWordCount = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};
const limitWords = (value: string, limit: number) => {
  const trimmed = value.trim();
  if (!trimmed) return value;
  const words = trimmed.split(/\s+/);
  if (words.length <= limit) return value;
  return `${words.slice(0, limit).join(" ")} `;
};

export default function HealerForm() {
  const [form, setForm] = useState<HealerForm>(initialForm);
  const [pronounError, setPronounError] = useState("");
  const [contactError, setContactError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [startedAt] = useState(() => Date.now());
  const pronounsRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLocale();
  const router = useRouter();

  const handleChange =
    (field: keyof HealerForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const validatePronouns = (value: string) => {
    if (!value.trim()) return "";
    return isValidPronouns(value) ? "" : t("form.healer.pronouns.error");
  };

  const validateContact = (contactType: HealerForm["contactType"], value: string) => {
    const trimmed = value.trim();
    if (!contactType) return "";
    if (!trimmed) return "";
    if (contactType === "email") {
      const isValidEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed);
      return isValidEmail ? "" : t("form.healer.contact.email.error");
    }
    if (contactType === "phone") {
      const normalized = trimmed.replace(/\s+/g, " ").trim();
      const hasDigit = /[0-9]/.test(normalized);
      const isValidPhone =
        hasDigit &&
        /^[0-9+().#\-\s]*$/.test(normalized) &&
        !/[a-wyz]/i.test(normalized) &&
        /^.*?(?:\b(?:ext|x|#)\s*\d+)?$/i.test(normalized);
      return isValidPhone ? "" : t("form.healer.contact.phone.error");
    }
    if (contactType === "website") {
      const hasDot = /\./.test(trimmed);
      const hasSpaces = /\s/.test(trimmed);
      const startsWithAlnum = /^[a-z0-9]/i.test(trimmed);
      const isValidWebsite = hasDot && !hasSpaces && startsWithAlnum;
      return isValidWebsite ? "" : t("form.healer.contact.website.error");
    }
    if (contactType === "social") {
      const hasColon = /^[^:\s][^:]*:\s+.+$/.test(trimmed);
      return hasColon ? "" : t("form.healer.contact.social.error");
    }
    return "";
  };

  const handleContactTypeSelect = (contactType: HealerForm["contactType"]) => {
    const nextType = form.contactType === contactType ? "" : contactType;
    const nextContact = nextType === "social"
      ? (() => {
          const trimmed = form.contact.trim();
          const hasSocialFormat = /^[^:\s][^:]*:\s+.+$/.test(trimmed);
          const trimmedStart = form.contact.trimStart();
          const prefixed = trimmedStart.startsWith("Platform: ")
            ? trimmedStart
            : `Platform: ${trimmedStart}`;
          return hasSocialFormat ? form.contact : prefixed;
        })()
      : form.contact;
    setForm((prev) => {
      if (nextType !== "social") {
        return { ...prev, contactType: nextType };
      }
      return {
        ...prev,
        contactType: nextType,
        contact: nextContact,
      };
    });
    if (!nextType && nextContact.trim()) {
      setContactError("Just one more step. What type of contact is this?");
      return;
    }
    const error = validateContact(nextType, nextContact);
    setContactError(error);
  };

  const handlePronounsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, pronouns: value }));
    const error = validatePronouns(value);
    setPronounError(error);
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, contact: value }));
    if (!form.contactType && value.trim()) {
      setContactError("Just one more step. What type of contact is this?");
      return;
    }
    const error = validateContact(form.contactType, value);
    setContactError(error);
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = limitWords(e.target.value, BIO_WORD_LIMIT);
    setForm((prev) => ({ ...prev, bio: nextValue }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedContact = form.contactType ? form.contact : "";
    if (!form.contactType && form.contact) {
      setContactError("Just one more step. What type of contact is this?");
      return;
    }
    const pronounsValidation = validatePronouns(form.pronouns);
    if (pronounsValidation) {
      setPronounError(pronounsValidation);
      return;
    }

    const contactValidation = validateContact(form.contactType, normalizedContact);
    if (contactValidation) {
      setContactError(contactValidation);
      return;
    }

    const payload = {
      ...form,
      contactType: normalizedContact.trim() ? form.contactType || null : null,
      contact: normalizedContact.trim() || null,
      honeypot,
      startedAt,
    };

    try {
      const res = await fetch("/api/healer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        alert(t("form.healer.save.error"));
        return;
      }

      if (res.status === 409) {
        const data = await res.json();
        if (data?.healer?.slug) {
          router.push(`/healer/${data.healer.slug}/space`);
          return;
        }
      }

      if (!res.ok) {
        if (res.status === 400) {
          const data = await res.json();
          if (data?.error === "invalid_pronouns") {
            const error = t("form.healer.pronouns.error");
            setPronounError(error);
            return;
          }
        }
        throw new Error(t("form.healer.save.fail"));
      }

      const data = await res.json();
      console.log("Saved healer:", data);

      setForm(initialForm);
      if (data?.healer?.slug) {
        router.push(`/healer/${data.healer.slug}/space`);
      }
    } catch (err) {
      console.error(err);
      alert(t("form.healer.save.error"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <div className="space-y-1">
        <label className="block text-sm font-medium">{t("form.healer.name.label")}</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
          placeholder={t("form.healer.name.placeholder")}
          value={form.name}
          onChange={handleChange('name')}
          minLength={1}
          maxLength={255}
          onInvalid={(e) => {
            e.currentTarget.setCustomValidity("Please fill out this field.");
          }}
          onInput={(e) => {
            e.currentTarget.setCustomValidity("");
          }}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">
          {t("form.healer.pronouns.label")}{" "}
          <span className="text-gray-500 text-sm">{t("form.optional")}</span>
        </label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
          placeholder={t("form.healer.pronouns.placeholder")}
          value={form.pronouns}
          onChange={handlePronounsChange}
          ref={pronounsRef}
        />
        {pronounError ? (
          <p className="text-sm text-red-600 dark:text-red-300">{pronounError}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">{t("form.healer.modality.label")}</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
          placeholder={t("form.healer.modality.placeholder")}
          value={form.modality}
          onChange={handleChange('modality')}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">{t("form.healer.focus.label")}</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
          placeholder={t("form.healer.focus.placeholder")}
          value={form.focus}
          onChange={handleChange('focus')}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">
          Where do you usually offer care?{" "}
          <span className="text-gray-500 text-sm">(optional)</span>
        </label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
          placeholder="e.g. Online / Chicago, IL / Hybrid"
          value={form.location}
          onChange={handleChange('location')}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">
          {t("form.healer.contact.label")}{" "}
          <span className="text-gray-500 text-sm">{t("form.optional")}</span>
        </label>

        <div className="flex flex-wrap gap-2 text-sm">
          {(
            [
              { id: "email", label: t("form.healer.contact.type.email") },
              { id: "phone", label: t("form.healer.contact.type.phone") },
              { id: "website", label: t("form.healer.contact.type.website") },
              { id: "social", label: t("form.healer.contact.type.social") },
            ] as const
          ).map((type) => (
            <button
              type="button"
              key={type.id}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                form.contactType === type.id
                  ? "bg-gray-900 border-gray-900 text-white dark:bg-[rgb(var(--dark-cta-hover))] dark:border-[rgb(var(--dark-cta))] dark:text-white dark:ring-1 dark:ring-pulse-bloom/30"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-[rgb(var(--dark-border))] dark:text-gray-100 dark:hover:bg-[rgb(var(--dark-card-hover))]"
              )}
              onClick={() => handleContactTypeSelect(type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>

        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
          placeholder={t("form.healer.contact.placeholder")}
          value={form.contact}
          onChange={handleContactChange}
          ref={contactRef}
          rows={2}
        />
        {contactError ? (
          <p className="text-sm text-red-600 dark:text-red-300">{contactError}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">{t("form.healer.bio.label")}</label>
        <div className="space-y-0">
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[88px] dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
            placeholder={t("form.healer.bio.placeholder")}
            value={form.bio}
            onChange={handleBioChange}
            required
          />
          <div className="-mt-1 flex justify-end text-xs text-gray-500 dark:text-gray-400">
            {getWordCount(form.bio)}/{BIO_WORD_LIMIT}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900 dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:hover:border-white dark:hover:text-white"
          onClick={() => {
            setForm(initialForm);
            setPronounError("");
            setContactError("");
          }}
        >
          {t("form.reset")}
        </button>
        <button
          type="submit"
          className="rounded-full border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 hover:border-gray-700 dark:border-[rgb(var(--dark-cta))] dark:bg-[rgb(var(--dark-cta-hover))] dark:text-white dark:ring-1 dark:ring-pulse-bloom/30 dark:hover:border-white dark:hover:bg-pulse-bloom-soft dark:hover:text-gray-900"
        >
          {t("form.save")}
        </button>
      </div>
    </form>
  );
}
