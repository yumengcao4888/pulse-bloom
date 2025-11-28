import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received practitioner data:", body);

    const { name, modality, focus, bio } = body;
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