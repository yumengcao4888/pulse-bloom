import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const slug = formData.get('slug') as string | null;
    const feeling = formData.get('feeling') as string | null;

    const grounded  = formData.get('grounded') === 'on';
    const supported = formData.get('supported') === 'on';
    const connected = formData.get('connected') === 'on';

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    const practitioner = await prisma.practitioner.findUnique({
      where: { slug },
    });

    if (!practitioner) {
      return NextResponse.json({ error: 'Practitioner not found' }, { status: 404 });
    }

    const reflection = await prisma.reflection.create({
      data: {
        grounded,
        supported,
        connected,
        feeling: feeling && feeling.trim() !== '' ? feeling : null,
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