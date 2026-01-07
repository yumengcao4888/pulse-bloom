import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { classifyFeeling } from "@/lib/huggingface";
import { calculateEmotionalWarmth } from "@/lib/utils";

async function main() {
  if (!process.env.HF_TOKEN) {
    throw new Error("HF_TOKEN is not set. Aborting backfill.");
  }

  const reflections = await prisma.reflection.findMany({
    where: {
      emotionalWarmth: null,
      feeling: { not: null },
    },
    select: {
      id: true,
      feeling: true,
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

    const sentiment = await classifyFeeling(feeling);
    const emotionalWarmth = calculateEmotionalWarmth(sentiment);
    if (emotionalWarmth == null) {
      skipped += 1;
      continue;
    }

    await prisma.reflection.update({
      where: { id: reflection.id },
      data: {
        emotionalWarmth: new Prisma.Decimal(emotionalWarmth.toFixed(2)),
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
