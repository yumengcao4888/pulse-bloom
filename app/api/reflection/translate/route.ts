import { NextResponse } from "next/server";
import { locales, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const MODEL_BY_PAIR: Record<string, string> = {
  "en:es": "Helsinki-NLP/opus-mt-en-es",
  "es:en": "Helsinki-NLP/opus-mt-es-en",
};

const HF_BASE_URL = "https://router.huggingface.co/hf-inference/models";

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

function extractTranslation(payload: unknown): string | null {
  if (Array.isArray(payload) && payload[0] && typeof payload[0] === "object") {
    const entry = payload[0] as { translation_text?: string };
    if (typeof entry.translation_text === "string") {
      return entry.translation_text;
    }
  }

  if (payload && typeof payload === "object" && "translation_text" in payload) {
    const entry = payload as { translation_text?: string };
    if (typeof entry.translation_text === "string") {
      return entry.translation_text;
    }
  }

  if (payload && typeof payload === "object" && "error" in payload) {
    console.error("HF translation error payload:", payload);
  }

  return null;
}

async function translateText(model: string, text: string): Promise<string | null> {
  if (!text.trim()) return text;
  if (!process.env.HF_TOKEN) {
    console.warn("Missing HF_TOKEN, skipping translation");
    return null;
  }

  const response = await fetch(`${HF_BASE_URL}/${model}`, {
    method: "POST",
    body: JSON.stringify({ inputs: text }),
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("HF translation request failed", await response.text());
    return null;
  }

  const data = await response.json();
  return extractTranslation(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { sourceLocale, targetLocale, text } = body as {
    sourceLocale?: unknown;
    targetLocale?: unknown;
    text?: unknown;
  };

  if (!isLocale(sourceLocale) || !isLocale(targetLocale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  if (typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const model = MODEL_BY_PAIR[`${sourceLocale}:${targetLocale}`];
  if (!model) {
    return NextResponse.json({ error: "Unsupported locale pair" }, { status: 400 });
  }

  const translated = await translateText(model, text);
  if (translated == null) {
    return NextResponse.json({ error: "Translation failed" }, { status: 502 });
  }

  return NextResponse.json({ translated });
}
