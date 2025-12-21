import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale, LOCALE_COOKIE } from "@/lib/i18n";

function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const base = value.toLowerCase().split("-")[0];
  return locales.includes(base as Locale) ? (base as Locale) : null;
}

async function getHeaderLocale(): Promise<Locale | null> {
  const headerList = await headers();
  const acceptLanguage = headerList.get("accept-language");
  if (!acceptLanguage) return null;
  const candidate = acceptLanguage.split(",")[0]?.trim();
  return normalizeLocale(candidate);
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  return cookieLocale ?? (await getHeaderLocale()) ?? defaultLocale;
}
