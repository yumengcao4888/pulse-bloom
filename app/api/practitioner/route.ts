import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received practitioner data:", body);

    const { name, pronoun, modality, focus, city, contact, bio } = body;
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
      data: { name, modality, focus, bio, pronoun, city, contact },
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