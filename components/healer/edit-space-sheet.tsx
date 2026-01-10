"use client";

import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import useMediaQuery from "@/lib/hooks/use-media-query";
import { useLocale } from "@/components/shared/locale-provider";
import Modal from "@/components/shared/modal";
import { cn } from "@/lib/utils";
import { isValidPronouns } from "@/lib/pronouns";

type HealerProfile = {
  name: string;
  pronouns: string | null;
  modality: string;
  focus: string;
  location: string | null;
  contact: string | null;
  contactType: "email" | "phone" | "website" | "social" | null;
  bio: string;
};

type EditProfileSheetProps = {
  healer: HealerProfile;
  buttonClassName?: string;
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

export default function EditProfileSheet({ healer, buttonClassName }: EditProfileSheetProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<HealerProfile>(healer);
  const [pronounError, setPronounError] = useState("");
  const [contactError, setContactError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearError, setClearError] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const startedAtRef = useRef(Date.now());
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

  useEffect(() => {
    if (!deleteOpen) {
      setDeleteError("");
      setIsDeleting(false);
    }
  }, [deleteOpen]);

  useEffect(() => {
    if (!clearOpen) {
      setClearError("");
      setIsClearing(false);
    }
  }, [clearOpen]);
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      startedAtRef.current = Date.now();
      setHoneypot("");
    }
    setOpen(nextOpen);
  };

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

  const handleContactTypeSelect = (contactType: HealerProfile["contactType"]) => {
    const nextType = form.contactType === contactType ? null : contactType;
    const nextContact = nextType === "social"
      ? (() => {
          const trimmed = (form.contact ?? "").trim();
          const hasSocialFormat = /^[^:\s][^:]*:\s+.+$/.test(trimmed);
          const trimmedStart = (form.contact ?? "").trimStart();
          const prefixed = trimmedStart.startsWith("Platform: ")
            ? trimmedStart
            : `Platform: ${trimmedStart}`;
          return hasSocialFormat ? form.contact ?? "" : prefixed;
        })()
      : form.contact ?? "";
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
      setContactError(t("form.healer.contact.missingType"));
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
      setContactError(t("form.healer.contact.missingType"));
      return;
    }
    const error = validateContact(form.contactType, value);
    setContactError(error);
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = limitWords(e.target.value, BIO_WORD_LIMIT);
    setForm((prev) => ({ ...prev, bio: nextValue }));
  };

  const handleSave = async () => {
    const normalizedContact = form.contactType ? form.contact ?? "" : "";
    if (!form.contactType && form.contact) {
      setContactError(t("form.healer.contact.missingType"));
      return;
    }
    const pronounsValidation = validatePronouns(form.pronouns ?? "");
    if (pronounsValidation) {
      setPronounError(pronounsValidation);
      return;
    }

    const contactValidation = validateContact(form.contactType, normalizedContact);
    if (contactValidation) {
      setContactError(contactValidation);
      return;
    }

    setIsSaving(true);
    const payload = {
      ...form,
      contactType: normalizedContact.trim() ? form.contactType ?? null : null,
      contact: normalizedContact.trim() || null,
      honeypot,
      startedAt: startedAtRef.current,
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

  const handleDeleteSpace = async () => {
    setDeleteError("");
    setIsDeleting(true);
    try {
      const res = await fetch("/api/healer", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to delete healer");
      }
      setDeleteOpen(false);
      setOpen(false);
      router.push("/healer");
      router.refresh();
    } catch (err) {
      console.error("Failed to delete healer space:", err);
      setDeleteError(
        t("editSpace.error.delete"),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearReflections = async () => {
    setClearError("");
    setIsClearing(true);
    try {
      const res = await fetch("/api/healer/reflections", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to clear reflections");
      }
      setClearOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to clear reflections:", err);
      setClearError(t("editSpace.error.clear"));
    } finally {
      setIsClearing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSave();
  };

  const panelContent = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b px-6 py-4 dark:border-[rgb(var(--dark-border))]">
        <Dialog.Title className="text-lg font-semibold">{t("editSpace.panel.title")}</Dialog.Title>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          {t("editSpace.panel.description")}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col">
        <input type="hidden" name="startedAt" value={startedAtRef.current} />
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
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <div className="rounded-2xl border bg-white/70 p-4 shadow-sm space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                {t("form.healer.name.label")}
              </label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
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
                className="w-full rounded-md border px-3 py-2 text-sm dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
                placeholder={t("form.healer.pronouns.placeholder")}
                value={form.pronouns ?? ""}
                onChange={handlePronounsChange}
                ref={pronounsRef}
              />
              {pronounError ? (
                <p className="text-sm text-red-600 dark:text-red-300">{pronounError}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                {t("form.healer.modality.label")}
              </label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
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
                className="w-full rounded-md border px-3 py-2 text-sm dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
                placeholder={t("form.healer.focus.placeholder")}
                value={form.focus}
                onChange={handleChange("focus")}
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
                value={form.location ?? ""}
                onChange={handleChange("location")}
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
                        ? "bg-gray-900 border-gray-900 text-white dark:bg-[rgb(var(--dark-cta-hover))] dark:border-[rgb(var(--dark-cta))] dark:text-white dark:ring-1 dark:ring-pulse-bloom/40"
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
                value={form.contact ?? ""}
                onChange={handleContactChange}
                ref={contactRef}
                rows={2}
              />
              {contactError ? (
                <p className="text-sm text-red-600 dark:text-red-300">{contactError}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                {t("form.healer.bio.label")}
              </label>
              <div className="space-y-0">
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm min-h-[104px] dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:placeholder:text-gray-400"
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
          </div>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-300/40 dark:bg-amber-500/15">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">
              {t("editSpace.clear.title")}
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-200">
              {t("editSpace.clear.bannerDescription")}
            </p>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setClearOpen(true)}
                className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                {t("editSpace.clear.button")}
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-300/40 dark:bg-red-500/15">
            <p className="text-sm font-semibold text-red-700 dark:text-red-200">
              {t("editSpace.delete.title")}
            </p>
            <p className="mt-1 text-xs text-red-700 dark:text-red-200">
              {t("editSpace.delete.description")}
            </p>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                {t("editSpace.delete.button")}
              </button>
            </div>
          </div>
        </div>
        <div className="border-t px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-100 dark:hover:border-[rgb(var(--dark-border))] dark:hover:bg-[rgb(var(--dark-card-hover))]"
            >
              {t("button.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={cn(
                "rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800",
                isSaving && "opacity-70",
              )}
            >
              {t("editSpace.saveButton")}
            </button>
          </div>
        </div>
      </form>
      <Modal open={deleteOpen} setOpen={setDeleteOpen} title={t("editSpace.delete.title")}>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("editSpace.delete.prompt")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("editSpace.delete.description")}{" "}
              {t("editSpace.delete.warning")}
            </p>
          </div>
          {deleteError ? (
            <p className="text-sm text-red-600 dark:text-red-300">{deleteError}</p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleDeleteSpace}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              disabled={isDeleting}
            >
              {t("editSpace.delete.button")}
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300"
            >
              {t("button.cancel")}
            </button>
          </div>
        </div>
      </Modal>
      <Modal open={clearOpen} setOpen={setClearOpen} title={t("editSpace.clear.title")}>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("editSpace.clear.prompt")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("editSpace.clear.modalDescription")}
            </p>
          </div>
          {clearError ? (
            <p className="text-sm text-red-600 dark:text-red-300">{clearError}</p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleClearReflections}
              className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              disabled={isClearing}
            >
              {t("editSpace.clear.button")}
            </button>
            <button
              type="button"
              onClick={() => setClearOpen(false)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300"
            >
              {t("button.cancel")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => handleOpenChange(true)}
          className={cn(
            "inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50",
            buttonClassName,
          )}
        >
          {t("editSpace.button")}
        </button>
        <Drawer.Root open={open} onOpenChange={handleOpenChange}>
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
        onClick={() => handleOpenChange(true)}
        className={cn(
          "inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50",
          buttonClassName,
        )}
      >
        {t("editSpace.button")}
      </button>
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
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
