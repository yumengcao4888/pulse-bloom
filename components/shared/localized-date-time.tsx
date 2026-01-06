"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/shared/locale-provider";

type LocalizedDateTimeProps = {
  value: string | Date;
  options?: Intl.DateTimeFormatOptions;
  locale?: string;
  className?: string;
  fallback?: string;
};

function formatDate(
  value: string | Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString(locale, options);
}

export function LocalizedDateTime({
  value,
  options,
  locale: localeOverride,
  className,
  fallback = "",
}: LocalizedDateTimeProps) {
  const { locale } = useLocale();
  const [formatted, setFormatted] = useState<string | null>(null);
  const resolvedLocale = localeOverride ?? locale;

  useEffect(() => {
    setFormatted(formatDate(value, resolvedLocale, options));
  }, [value, resolvedLocale, options]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatted ?? fallback}
    </span>
  );
}
