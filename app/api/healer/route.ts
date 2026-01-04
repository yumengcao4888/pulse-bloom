import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { isValidPronouns, normalizePronouns } from "@/lib/pronouns";

const adjectives = [
  "gentle", "quiet", "soft", "warm", "glowing", "open", "steady",
  "grounded", "calm", "kind", "bright", "held", "supported",
];

const nouns = [
  "bloom", "river", "path", "horizon", "seed", "light",
  "garden", "field", "harbor", "meadow", "pulse", "leaf",
];

type BotCheckPayload = {
  honeypot?: string;
  startedAt?: number | string;
};

function generateSlugFromName(name: string) {

  const cleaned = name.toLowerCase().replace(/[^a-z]/g, "");
  const prefix = cleaned.substring(0, 2) || "h";

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  const num = Math.floor(Math.random() * 100);

  return `${prefix}-${adj}-${noun}-${num}`;
}

function getBotProtectionError(body: BotCheckPayload) {
  const vercelEnv = process.env.VERCEL_ENV;
  const bypassBotProtection =
    vercelEnv === "development" ||
    vercelEnv === "preview" ||
    process.env.NODE_ENV === "development";
  const minSubmitMs = 2000;

  if (bypassBotProtection) {
    return null;
  }

  if (typeof body.honeypot === "string" && body.honeypot.trim() !== "") {
    return { status: 400, error: "Bot detected" };
  }

  const startedAtMs =
    typeof body.startedAt === "number" ? body.startedAt : Number(body.startedAt);
  if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) {
    return { status: 400, error: "Invalid submission time" };
  }

  const elapsedMs = Date.now() - startedAtMs;
  if (elapsedMs < minSubmitMs) {
    return { status: 429, error: "Submission too fast" };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Received healer data:", body);

    const botError = getBotProtectionError(body);
    if (botError) {
      return NextResponse.json({ error: botError.error }, { status: botError.status });
    }

    const { name, pronouns, modality, focus, location, contact, contactType, bio } = body;
    const normalizedPronouns = normalizePronouns(pronouns);
    const allowedContactTypes = ["email", "phone", "website", "social"] as const;
    const normalizedContactType =
      contactType && allowedContactTypes.includes(contactType) ? contactType : null;
    const missing: string[] = [];
    if (!name) missing.push("name");
    if (!modality) missing.push("modality");
    if (!focus) missing.push("focus");
    if (!bio) missing.push("bio");
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missing,
        },
        { status: 400 }
      );
    }
    if (!isValidPronouns(pronouns)) {
      return NextResponse.json(
        { error: "invalid_pronouns" },
        { status: 400 }
      );
    }
    if (contactType && !normalizedContactType) {
      return NextResponse.json(
        { error: "invalid_contact_type" },
        { status: 400 }
      );
    }

    const existingHealer = await prisma.healer.findUnique({
      where: { clerkId: userId },
    });

    if (existingHealer) {
      return NextResponse.json(
        { error: "Healer already exists", healer: existingHealer },
        { status: 409 }
      );
    }

    const healer = await prisma.healer.create({
      data: {
        clerkId: userId,
        name,
        pronouns: normalizedPronouns,
        modality,
        focus,
        location,
        contact,
        contactType: normalizedContactType,
        bio,
        slug: generateSlugFromName(name),
      },
    });

    return NextResponse.json(
      { success: true, healer },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/healer:", err);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const healer = await prisma.healer.findUnique({
      where: { clerkId: userId },
      select: { slug: true },
    });

    return NextResponse.json({ healer }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/healer GET:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const botError = getBotProtectionError(body);
    if (botError) {
      return NextResponse.json({ error: botError.error }, { status: botError.status });
    }

    const { name, pronouns, modality, focus, location, contact, contactType, bio } = body;
    const normalizedPronouns = normalizePronouns(pronouns);
    const allowedContactTypes = ["email", "phone", "website", "social"] as const;
    const normalizedContactType =
      contactType && allowedContactTypes.includes(contactType) ? contactType : null;
    const missing: string[] = [];
    if (!name) missing.push("name");
    if (!modality) missing.push("modality");
    if (!focus) missing.push("focus");
    if (!bio) missing.push("bio");
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missing,
        },
        { status: 400 },
      );
    }
    if (!isValidPronouns(pronouns)) {
      return NextResponse.json(
        { error: "invalid_pronouns" },
        { status: 400 },
      );
    }
    if (contactType && !normalizedContactType) {
      return NextResponse.json(
        { error: "invalid_contact_type" },
        { status: 400 },
      );
    }

    const existingHealer = await prisma.healer.findUnique({
      where: { clerkId: userId },
    });

    if (!existingHealer) {
      return NextResponse.json(
        { error: "Healer not found" },
        { status: 404 },
      );
    }

    const healer = await prisma.healer.update({
      where: { clerkId: userId },
      data: {
        name,
        pronouns: normalizedPronouns,
        modality,
        focus,
        location,
        contact,
        contactType: normalizedContactType,
        bio,
      },
    });

    return NextResponse.json(
      { success: true, healer },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error in /api/healer PUT:", err);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 500 },
    );
  }
}
