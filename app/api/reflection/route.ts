import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { classifyFeeling } from "@/lib/huggingface";
import { calculateEmotionalWarmth } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, grounded, supported, connected, feeling, honeypot, startedAt } = body;
    const vercelEnv = process.env.VERCEL_ENV;
    const isLocalDev = !vercelEnv && process.env.NODE_ENV === "development";
    const bypassBotProtection =
      vercelEnv === "development" ||
      vercelEnv === "preview" ||
      isLocalDev;
    const minSubmitMs = 2000;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    if (!bypassBotProtection) {
      if (typeof honeypot === "string" && honeypot.trim() !== "") {
        return NextResponse.json({ error: "Bot detected" }, { status: 400 });
      }

      const startedAtMs = typeof startedAt === "number" ? startedAt : Number(startedAt);
      if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) {
        return NextResponse.json({ error: "Invalid submission time" }, { status: 400 });
      }

      const elapsedMs = Date.now() - startedAtMs;
      if (elapsedMs < minSubmitMs) {
        return NextResponse.json({ error: "Submission too fast" }, { status: 429 });
      }
    }

    const healer = await prisma.healer.findUnique({
      where: { slug },
    });

    if (!healer) {
      return NextResponse.json(
        { error: 'Healer not found' },
        { status: 404 }
      );
    }

    const groundedBool = grounded === "yes";
    const supportedBool = supported === "yes";
    const connectedBool = connected === "yes";

    const trimmedFeeling =
      typeof feeling === "string" && feeling.trim() !== "" ? feeling.trim() : null;
    const sentiment = await classifyFeeling(trimmedFeeling);
    const emotionalWarmth = calculateEmotionalWarmth(sentiment);

    const reflection = await prisma.reflection.create({
      data: {
        grounded: groundedBool,
        supported: supportedBool,
        connected: connectedBool,
        feeling: trimmedFeeling,
        emotionalWarmth:
          emotionalWarmth == null
            ? null
            : new Prisma.Decimal(emotionalWarmth.toFixed(2)),
        healerId: healer.id,
      },
    });

    return NextResponse.json(
      { success: true, id: reflection.id },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/reflection:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
