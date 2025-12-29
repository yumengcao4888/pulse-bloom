"use client";

import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import useMediaQuery from "@/lib/hooks/use-media-query";
import { useLocale } from "@/components/shared/locale-provider";
import { cn } from "@/lib/utils";
import { isValidPronouns } from "@/lib/pronouns";

type HealerProfile = {
  name: string;
  pronouns: string | null;
  modality: string;
  focus: string;
  city: string | null;
  contact: string | null;
  contactType: "email" | "phone" | "website" | "social" | "other" | null;
  bio: string;
};

type EditProfileSheetProps = {
  healer: HealerProfile;
};

export default function EditProfileSheet({ healer }: EditProfileSheetProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<HealerProfile>(healer);
  const [pronounError, setPronounError] = useState("");
  const [contactError, setContactError] = useState("");
  const pronounsRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLTextAreaElement>(null);
  const { isMobile } = useMediaQuery();
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    if (open) {
      setForm(healer);
      setPronounError("");
      setContactError("");
    }
  }, [open, healer]);

  const handleChange =
    (field: keyof HealerProfile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const validatePronouns = (value: string) => {
    if (!value.trim()) return "";
    return isValidPronouns(value) ? "" : t("form.healer.pronouns.error");
  };

  const validateContact = (contactType: HealerProfile["contactType"], value: string) => {
    if (contactType !== "email") return "";
    const trimmed = value.trim();
    if (!trimmed) return t("form.healer.contact.email.error");
    const isValidEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed);
    return isValidEmail ? "" : t("form.healer.contact.email.error");
  };

  const handleContactTypeSelect = (contactType: HealerProfile["contactType"]) => {
    const nextType = form.contactType === contactType ? null : contactType;
    setForm((prev) => ({ ...prev, contactType: nextType }));
    if (contactError && !validateContact(nextType, form.contact ?? "")) {
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

  const handleSave = async () => {
    const pronounsValidation = validatePronouns(form.pronouns ?? "");
    if (pronounsValidation) {
      setPronounError(pronounsValidation);
      return;
    }

    const contactValidation = validateContact(form.contactType, form.contact ?? "");
    if (contactValidation) {
      setContactError(contactValidation);
      if (contactRef.current) {
        contactRef.current.setCustomValidity(contactValidation);
        contactRef.current.reportValidity();
        contactRef.current.setCustomValidity("");
      }
      return;
    }

    setIsSaving(true);
    const payload = {
      ...form,
      contactType: form.contact?.trim() ? form.contactType ?? null : null,
      contact: form.contact?.trim() || null,
    };

    try {
      const res = await fetch("/api/healer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const data = await res.json();
          if (data?.error === "invalid_pronouns") {
            const error = t("form.healer.pronouns.error");
            setPronounError(error);
            return;
          }
        }
        throw new Error("Failed to update healer");
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to update healer profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSave();
  };

  const panelContent = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b px-6 py-4">
        <Dialog.Title className="text-lg font-semibold">Edit your space</Dialog.Title>
        <p className="text-sm text-gray-500">These details help others recognize and feel your space.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <div className="rounded-2xl border bg-white/70 p-4 shadow-sm space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                {t("form.healer.name.label")}
              </label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder={t("form.healer.name.placeholder")}
                value={form.name}
                onChange={handleChange("name")}
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
                value={form.pronouns ?? ""}
                onChange={handlePronounsChange}
                ref={pronounsRef}
              />
              {pronounError ? (
                <p className="text-sm text-red-600">{pronounError}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                {t("form.healer.modality.label")}
              </label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder={t("form.healer.modality.placeholder")}
                value={form.modality}
                onChange={handleChange("modality")}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                {t("form.healer.focus.label")}
              </label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder={t("form.healer.focus.placeholder")}
                value={form.focus}
                onChange={handleChange("focus")}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                {t("form.healer.city.label")}{" "}
                <span className="text-gray-500 text-sm">{t("form.optional")}</span>
              </label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder={t("form.healer.city.placeholder")}
                value={form.city ?? ""}
                onChange={handleChange("city")}
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
                    className={`rounded-full border px-3 py-1 hover:bg-gray-100 ${
                      form.contactType === type.id ? "bg-gray-100" : ""
                    }`}
                    onClick={() => handleContactTypeSelect(type.id)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                placeholder={t("form.healer.contact.placeholder")}
                value={form.contact ?? ""}
                onChange={handleContactChange}
                ref={contactRef}
              />
              {contactError ? (
                <p className="text-sm text-red-600">{contactError}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                {t("form.healer.bio.label")}
              </label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[120px]"
                placeholder={t("form.healer.bio.placeholder")}
                value={form.bio}
                onChange={handleChange("bio")}
                required
              />
            </div>
          </div>
        </div>
        <div className="border-t px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={cn(
                "rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800",
                isSaving && "opacity-70",
              )}
            >
              Save changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300"
        >
          Edit your space
        </button>
        <Drawer.Root open={open} onOpenChange={setOpen}>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-gray-100 bg-opacity-10 backdrop-blur" />
          <Drawer.Portal>
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[85vh] flex-col rounded-t-[16px] border-t border-gray-200 bg-white overflow-hidden">
          <div className="sticky top-0 z-20 flex w-full items-center justify-center rounded-t-[16px] bg-inherit">
            <div className="my-3 h-1 w-12 rounded-full bg-gray-300" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">{panelContent}</div>
        </Drawer.Content>
            <Drawer.Overlay />
          </Drawer.Portal>
        </Drawer.Root>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300"
      >
        Edit your space
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-gray-100 bg-opacity-40 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-gray-200 bg-white shadow-xl">
            {panelContent}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
