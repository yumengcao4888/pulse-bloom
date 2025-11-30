import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, grounded, supported, connected, feeling } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const practitioner = await prisma.practitioner.findUnique({
      where: { slug },
    });

    if (!practitioner) {
      return NextResponse.json({ error: 'Practitioner not found' }, { status: 404 });
    }

    const groundedBool = grounded === "yes";
    const supportedBool = supported === "yes";
    const connectedBool = connected === "yes";

    const reflection = await prisma.reflection.create({
      data: {
        grounded: groundedBool,
        supported: supportedBool,
        connected: connectedBool,
        feeling: feeling && feeling.trim() !== "" ? feeling : null,
        practitionerId: practitioner.id,
      },
    });

    const redirectUrl = new URL(`/reflection/${slug}?submitted=1`, req.url);
    return NextResponse.redirect(redirectUrl);

  } catch (err) {
    console.error("Error in /api/reflection:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}