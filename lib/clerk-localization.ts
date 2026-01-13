import { esES } from "@clerk/localizations";
import type { Locale } from "@/lib/i18n";

type LocalizationResource = {
  locale: string;
  [key: string]: unknown;
};

type ClerkLocalization = LocalizationResource & {
  userButton?: Record<string, unknown>;
  signIn?: { start?: Record<string, unknown> };
  signUp?: { start?: Record<string, unknown> };
};

const esESLocalization = esES as ClerkLocalization;

const spanishLocalization: LocalizationResource = {
  ...esESLocalization,
  userButton: {
    ...(esESLocalization.userButton ?? {}),
    action__manageAccount: "Administrar cuenta",
    action__signOut: "Cerrar sesión",
  },
  signIn: {
    ...(esESLocalization.signIn ?? {}),
    start: {
      ...(esESLocalization.signIn?.start ?? {}),
      title: "Inicia sesión en mi aplicación",
      titleCombined: "Inicia sesión en mi aplicación",
    },
  },
  signUp: {
    ...(esESLocalization.signUp ?? {}),
    start: {
      ...(esESLocalization.signUp?.start ?? {}),
      title: "Crea tu cuenta",
      titleCombined: "Crea tu cuenta",
    },
  },
};

export function getClerkLocalization(locale: Locale): LocalizationResource {
  if (locale === "es") {
    return spanishLocalization;
  }
  return { locale };
}
