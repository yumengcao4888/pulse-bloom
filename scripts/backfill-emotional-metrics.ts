import "dotenv/config";
import { EmotionalTone, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { classifyEmotion, classifyFeeling } from "@/lib/huggingface";
import { calculateEmotionalWarmth } from "@/lib/utils";

async function main() {
  if (!process.env.HF_TOKEN) {
    throw new Error("HF_TOKEN is not set. Aborting backfill.");
  }

  const reflections = await prisma.reflection.findMany({
    where: {
      feeling: { not: null },
      OR: [{ emotionalWarmth: null }, { emotionalTone: null }],
    },
    select: {
      id: true,
      feeling: true,
      emotionalWarmth: true,
      emotionalTone: true,
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const reflection of reflections) {
    const feeling = reflection.feeling?.trim();
    if (!feeling) {
      skipped += 1;
      continue;
    }

    const [sentiment, emotion] = await Promise.all([
      classifyFeeling(feeling),
      classifyEmotion(feeling),
    ]);
    const emotionalWarmth = calculateEmotionalWarmth(sentiment);
    const emotionalTone =
      emotion?.label && (Object.values(EmotionalTone) as string[]).includes(emotion.label)
        ? (emotion.label as EmotionalTone)
        : null;

    if (emotionalWarmth == null && emotionalTone == null) {
      skipped += 1;
      continue;
    }

    await prisma.reflection.update({
      where: { id: reflection.id },
      data: {
        emotionalWarmth:
          reflection.emotionalWarmth == null && emotionalWarmth != null
            ? new Prisma.Decimal(emotionalWarmth.toFixed(2))
            : undefined,
        emotionalTone:
          reflection.emotionalTone == null && emotionalTone != null
            ? emotionalTone
            : undefined,
      },
    });
    updated += 1;
  }

  console.log(
    `Backfill complete. Updated: ${updated}. Skipped: ${skipped}. Total: ${reflections.length}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
