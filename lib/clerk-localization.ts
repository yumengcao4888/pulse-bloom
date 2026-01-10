import type { Locale } from "@/lib/i18n";

type LocalizationResource = {
  locale: string;
  [key: string]: unknown;
};

const spanishLocalization: LocalizationResource = {
  locale: "es",
  userButton: {
    action__manageAccount: "Administrar cuenta",
    action__signOut: "Cerrar sesión",
  },
  signIn: {
    start: {
      title: "Inicia sesión en mi aplicación",
      titleCombined: "Inicia sesión en mi aplicación",
    },
  },
  signUp: {
    start: {
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
