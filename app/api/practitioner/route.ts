import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const adjectives = [
  "gentle", "quiet", "soft", "warm", "glowing", "open", "steady",
  "grounded", "calm", "kind", "bright", "held", "supported",
];

const nouns = [
  "bloom", "river", "path", "horizon", "seed", "light",
  "garden", "field", "harbor", "meadow", "pulse", "leaf",
];

function generateSlugFromName(name: string) {

  const cleaned = name.toLowerCase().replace(/[^a-z]/g, "");
  const prefix = cleaned.substring(0, 2) || "p";

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  const num = Math.floor(Math.random() * 100);

  return `${prefix}-${adj}-${noun}-${num}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received practitioner data:", body);

    const { name, pronouns, modality, focus, city, contact, bio } = body;
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

    const practitioner = await prisma.practitioner.create({
      data: { name, pronouns, modality, focus, city, contact, bio, slug: generateSlugFromName(name) },
    });

    return NextResponse.json(
      { success: true, practitioner: body },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/practitioner:", err);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 500 }
    );
  }
}