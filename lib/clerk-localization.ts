import { esES } from "@clerk/localizations";
import type { Locale } from "@/lib/i18n";

type LocalizationResource = {
  locale: string;
  [key: string]: unknown;
};

type ZxcvbnLocalization = {
  zxcvbn?: {
    couldBeStronger?: string;
    goodPassword?: string;
    notEnough?: string;
    suggestions?: Record<string, string>;
  };
};

type ClerkLocalization = LocalizationResource &
  ZxcvbnLocalization & {
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
  zxcvbn: {
    ...(esESLocalization.zxcvbn ?? {}),
    couldBeStronger:
      "Tu contraseña funciona, pero podría ser más fuerte. Intenta agregar más caracteres.",
    goodPassword: "Tu contraseña cumple con todos los requisitos necesarios.",
    notEnough: "Tu contraseña no es lo suficientemente fuerte.",
    suggestions: {
      ...(esESLocalization.zxcvbn?.suggestions ?? {}),
      allUppercase: "Pon en mayúscula algunas letras, pero no todas.",
      anotherWord: "Agrega más palabras que sean menos comunes.",
      associatedYears: "Evita años que estén asociados contigo.",
      capitalization: "Pon en mayúscula más que solo la primera letra.",
      dates: "Evita fechas y años asociados contigo.",
      l33t: "Evita sustituciones predecibles como '@' por 'a'.",
      longerKeyboardPattern:
        "Usa patrones de teclado más largos y cambia la dirección varias veces.",
      noNeed: "Puedes crear contraseñas fuertes sin usar símbolos, números o mayúsculas.",
      pwned: "Si usas esta contraseña en otro lugar, deberías cambiarla.",
      recentYears: "Evita años recientes.",
      repeated: "Evita palabras y caracteres repetidos.",
      reverseWords: "Evita palabras comunes al revés.",
      sequences: "Evita secuencias comunes de caracteres.",
      useWords: "Usa varias palabras, pero evita frases comunes.",
    },
  },
};

export function getClerkLocalization(locale: Locale): LocalizationResource {
  if (locale === "es") {
    return spanishLocalization;
  }
  return { locale };
}
