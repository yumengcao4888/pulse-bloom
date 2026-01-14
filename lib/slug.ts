import { prisma } from "@/lib/prisma";

const adjectives = [
  "gentle", "quiet", "soft", "warm", "glowing", "open", "steady", "grounded", "calm", "kind",
  "bright", "held", "supported", "luminous", "still", "tender", "fluid", "rooted", "radiant", "peaceful",
  "clear", "slow", "deep", "light", "breezy", "low", "quieted", "safe", "inviting", "centered",
  "soothing", "stable", "restful", "balanced", "present", "cozy", "subtle", "gentled", "drifting", "anchored",
  "restored", "glimmering", "settled", "resting", "welcoming", "hushed", "stable", "dim", "nurtured", "sheltering"
];

const nouns = [
  "bloom", "river", "path", "horizon", "seed", "light", "garden", "field", "harbor", "meadow",
  "pulse", "leaf", "shell", "spring", "fog", "stone", "haven", "echo", "petal", "glade",
  "root", "stream", "cloud", "shore", "rain", "branch", "drift", "dew", "moss", "shade",
  "breeze", "sunbeam", "valley", "ripple", "nest", "trail", "blush", "hush", "window", "cove",
  "grain", "knoll", "pond", "grove", "quiet", "touch", "gleam", "hollow", "lightness", "pathway"
];

export function generateSlugFromName(name: string) {
  const cleaned = name.toLowerCase().replace(/[^a-z]/g, "");
  const prefix = cleaned.substring(0, 2) || "h";

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);

  return `${prefix}-${adj}-${noun}-${num}`;
}

export async function generateUniqueSlug(name: string, maxAttempts = 50) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const slug = generateSlugFromName(name);
    const existing = await prisma.healer.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }
  }

  throw new Error("Unable to generate a unique slug");
}
