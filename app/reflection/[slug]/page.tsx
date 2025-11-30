import { prisma } from "@/lib/prisma";
import ReflectionForm from "@/components/reflection/reflection-form";
import { sriracha } from '@/app/fonts';

export default async function ReflectionPage({
    params,
    searchParams,
  }: {
    params: { slug: string };
    searchParams?: { submitted?: string };
  }) {

  const { slug } = params;
  const submitted = searchParams?.submitted === '1';

  const practitioner = await prisma.practitioner.findUnique({
    where: { slug },
  });

  if (!practitioner) {
    return <div className="relative z-10 p-8 text-red-500 text-lg">Practitioner not found.</div>;
  }

  return (
    <div className="relative z-10 rounded-2xl border bg-white/70 p-6 shadow-sm">
      {submitted && (
        <p className="mb-0 rounded-lg bg-emerald-50 text-emerald-800 px-4 py-2 text-sm">
          Thank you for taking a moment to reflect. 🌿
        </p>
      )}

      <div className="max-w-xl mx-auto p-8">
        <h1 className={`${sriracha.className} text-2xl font-bold mb-0`}>
          After your time with {practitioner.name}...
        </h1>
        <p className="text-gray-600 mb-5">
          Take a moment to notice how you feel.
        </p>
        <ReflectionForm slug={slug} />
      </div>
    </div>
  );
}