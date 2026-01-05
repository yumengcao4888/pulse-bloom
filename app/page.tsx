import HealingSpaceCta from "@/components/home/healing-space-cta";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const { userId } = await auth();
  const healer = userId
    ? await prisma.healer.findUnique({
        where: { clerkId: userId },
        select: { slug: true },
      })
    : null;
  return (
    <div className="relative z-10 flex w-full items-start px-5 xl:px-0">
      <div className="mx-auto w-full max-w-5xl space-y-8">

        <section className="rounded-3xl border bg-white/80 p-8 shadow-sm backdrop-blur md:p-12">
          <h1 className="text-3xl font-semibold leading-tight text-gray-900 md:text-5xl">
            For healers who hold space.
          </h1>
          <p className="mt-4 text-base text-gray-600 md:text-lg">
            PulseBloom lets you invite clients to gently reflect and share the feeling of your space.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Let the atmosphere of your care speak for itself.
          </p>
        </section>

        <section className="flex gap-4 overflow-x-auto pb-2 md:grid md:overflow-visible md:pb-0 md:grid-cols-3">
          <div className="min-w-[240px] flex-1 rounded-2xl border bg-white/80 p-5 text-sm text-gray-700 shadow-sm md:min-w-0">
            <span className="block text-xs uppercase tracking-[0.2em] text-gray-400">
              Invite
            </span>
            Clients reflect with a few gentle taps.
          </div>
          <div className="min-w-[240px] flex-1 rounded-2xl border bg-white/80 p-5 text-sm text-gray-700 shadow-sm md:min-w-0">
            <span className="block text-xs uppercase tracking-[0.2em] text-gray-400">
              Sense
            </span>
            Shared feelings emerge over time.
          </div>
          <div className="min-w-[240px] flex-1 rounded-2xl border bg-white/80 p-5 text-sm text-gray-700 shadow-sm md:min-w-0">
            <span className="block text-xs uppercase tracking-[0.2em] text-gray-400">
              Share
            </span>
            The atmosphere your care creates.
          </div>
        </section>

        <HealingSpaceCta
          initialHealerSlug={healer?.slug ?? null}
          initialChecked={Boolean(userId)}
        />

      </div>
    </div>
  );
}
