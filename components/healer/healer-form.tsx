"use client";

import { useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/shared/locale-provider";
import { isValidPronouns } from "@/lib/pronouns";

type HealerForm = {
  name: string;
  pronouns: string;
  modality: string;
  focus: string;
  city: string;
  contact: string;
  contactType: "email" | "phone" | "website" | "social" | "other" | "";
  bio: string;
};

const initialForm: HealerForm = {
  name: '',
  pronouns: '',
  modality: '',
  focus: '',
  city: '',
  contact: '',
  contactType: '',
  bio: '',
};

export default function HealerForm() {
  const [form, setForm] = useState<HealerForm>(initialForm);
  const [pronounError, setPronounError] = useState("");
  const [contactError, setContactError] = useState("");
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
    if (contactType !== "email") return "";
    const trimmed = value.trim();
    if (!trimmed) return t("form.healer.contact.email.error");
    const isValidEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed);
    return isValidEmail ? "" : t("form.healer.contact.email.error");
  };

  const handleContactTypeSelect = (contactType: HealerForm["contactType"]) => {
    const nextType = form.contactType === contactType ? "" : contactType;
    setForm((prev) => ({ ...prev, contactType: nextType }));
    if (contactError && !validateContact(nextType, form.contact)) {
      setContactError("");
    }
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
    if (contactError && !validateContact(form.contactType, value)) {
      setContactError("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const pronounsValidation = validatePronouns(form.pronouns);
    if (pronounsValidation) {
      setPronounError(pronounsValidation);
      return;
    }

    const contactValidation = validateContact(form.contactType, form.contact);
    if (contactValidation) {
      setContactError(contactValidation);
      if (contactRef.current) {
        contactRef.current.setCustomValidity(contactValidation);
        contactRef.current.reportValidity();
        contactRef.current.setCustomValidity("");
      }
      return;
    }

    const payload = {
      ...form,
      contactType: form.contact.trim() ? form.contactType || null : null,
      contact: form.contact.trim() || null,
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
          router.push(`/healer/${data.healer.slug}/healing-space`);
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

      alert(t("form.healer.save.success"));
      setForm(initialForm);
      if (data?.healer?.slug) {
        router.push(`/healer/${data.healer.slug}/healing-space`);
      }
    } catch (err) {
      console.error(err);
      alert(t("form.healer.save.error"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium">{t("form.healer.name.label")}</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm"
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
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder={t("form.healer.pronouns.placeholder")}
          value={form.pronouns}
          onChange={handlePronounsChange}
          ref={pronounsRef}
        />
        {pronounError ? (
          <p className="text-sm text-red-600">{pronounError}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">{t("form.healer.modality.label")}</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm"
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
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder={t("form.healer.focus.placeholder")}
          value={form.focus}
          onChange={handleChange('focus')}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">
          {t("form.healer.city.label")} {t("form.optional")}
        </label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder={t("form.healer.city.placeholder")}
          value={form.city}
          onChange={handleChange('city')}
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
                { id: "other", label: t("form.healer.contact.type.other") },
              ] as const
            ).map((type) => (
            <button
                type="button"
                key={type.id}
                className={`rounded-full border px-3 py-1 hover:bg-gray-100 ${form.contactType === type.id ? "bg-gray-100" : ""}`}
                onClick={() => handleContactTypeSelect(type.id)}
            >
                {type.label}
            </button>
            ))}
        </div>

        <textarea
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
            placeholder={t("form.healer.contact.placeholder")}
            value={form.contact}
            onChange={handleContactChange}
            ref={contactRef}
        />
        {contactError ? (
          <p className="text-sm text-red-600">{contactError}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">{t("form.healer.bio.label")}</label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
          placeholder={t("form.healer.bio.placeholder")}
          value={form.bio}
          onChange={handleChange('bio')}
          required
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
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
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          {t("form.save")}
        </button>
      </div>
    </form>
  );
}
