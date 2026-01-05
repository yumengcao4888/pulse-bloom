import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyEmotion, classifyFeeling } from "@/lib/huggingface";
import { computeWeeklyTrends } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const healer = await prisma.healer.findUnique({
    where: { slug },
    include: {
      reflections: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!healer) {
    return NextResponse.json({ error: "Healer not found" }, { status: 404 });
  }

  const hfEnabled = Boolean(process.env.HF_TOKEN);
  const reflectionsWithAnalysis = await Promise.all(
    healer.reflections.map(async (reflection) => ({
      ...reflection,
      sentiment: hfEnabled ? await classifyFeeling(reflection.feeling) : null,
      emotion: hfEnabled ? await classifyEmotion(reflection.feeling) : null,
    })),
  );

  const weeklyTrends = computeWeeklyTrends(reflectionsWithAnalysis);

  return NextResponse.json({
    reflections: reflectionsWithAnalysis,
    weeklyTrends,
  });
}
