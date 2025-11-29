import { PrismaClient } from "@prisma/client";
import { QRCodeSVG } from "qrcode.react";
import { sriracha } from '@/app/fonts';

const prisma = new PrismaClient();

export default async function ReflectionPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const practitioner = await prisma.practitioner.findUnique({
    where: { slug },
  });

  const url = "http://localhost:3000/reflection/" + slug;

  if (!practitioner) {
    return <div className="z-10 p-8 text-red-500 text-lg">Practitioner not found.</div>;
  }

  return (
    <div className="relative z-10 rounded-2xl border bg-white/70 p-6 shadow-sm">
      <div className="mb-0 flex justify-center">
        <QRCodeSVG value={url} size={120} />
      </div>
      <div className="max-w-xl mx-auto p-8">
        <h1 className={`${sriracha.className} text-2xl font-bold mb-0`}>
          After your time with {practitioner.name}...
        </h1>
        <p className="text-gray-600 mb-5">
          Take a moment to notice how you feel.
        </p>

        <button
          type="button"
          className="block w-30 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition mb-2"
        >
          I feel grounded 🌱
        </button>

        <button
          type="button"
          className="block w-30 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition mb-2"
        >
          I feel supported 💛
        </button>

        <button
          type="button"
          className="block w-30 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition mb-2"
        >
          I feel connected 🤝
        </button>

        <form action="/api/reflection" method="POST" className="space-y-4">
          <input type="hidden" name="slug" value={slug} />

          <label className="block">
            <span className="text-gray-700">A few words, if you&aposd like (optional)</span>
            <textarea
              name="content"
              className="w-full border p-3 rounded mt-1"
              placeholder="e.g. a word, a feeling, or a quiet thought…"
              rows={3}
            />
          </label>

          <button
            type="submit"
            className="bg-blue-50/60 text-blue-800 hover:bg-violet-100/80 px-4 py-2 rounded transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}