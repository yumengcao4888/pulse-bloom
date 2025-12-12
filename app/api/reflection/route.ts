import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, grounded, supported, connected, feeling } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
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

    const reflection = await prisma.reflection.create({
      data: {
        grounded: groundedBool,
        supported: supportedBool,
        connected: connectedBool,
        feeling: feeling && feeling.trim() !== "" ? feeling : null,
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
