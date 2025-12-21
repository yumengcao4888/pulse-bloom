import { italianno } from "@/app/fonts";

export default async function HealerPage() {
  return (
    <div className="relative z-10 w-full px-5 pb-20 pt-12 md:pt-16 xl:px-0">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <section className="rounded-3xl border bg-white/80 p-6 shadow-sm backdrop-blur md:p-10">
          <p className={`${italianno.className} text-2xl text-gray-700 md:text-3xl`}>
            PulseBloom
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-gray-900 md:text-5xl md:leading-tight">
            For healers who hold space, not scores.
          </h1>
          <p className="mt-4 text-base text-gray-600 md:text-lg">
            PulseBloom helps healers gently show the impact of their care.
            Without metrics. Without judgment. Just presence.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Invite your community to reflect. Let the feeling speak for itself.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white/80 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Invite reflection</p>
            <p className="mt-3 text-base text-gray-700">
              Clients gently reflect on how they felt in your space.
            </p>
          </div>
          <div className="rounded-2xl border bg-white/80 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Feel the pattern</p>
            <p className="mt-3 text-base text-gray-700">
            PulseBloom notices shared emotional signals -- grounded, supported, connected.
            </p>
          </div>
          <div className="rounded-2xl border bg-white/80 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Share your bloom</p>
            <p className="mt-3 text-base text-gray-700">
              A soft snapshot of your space, ready to share.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border bg-white/80 p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-semibold text-gray-900 md:text-xl">Not a review system</h2>
          <p className="mt-3 text-base text-gray-700">
            PulseBloom is not a review system. It doesn’t rank, compare, or judge.
          </p>
          <p className="mt-2 text-base text-gray-700">
            It simply reflects what your space feels like -- over time, together.
          </p>
        </section>

        <section className="rounded-2xl border bg-white/80 p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-semibold text-gray-900 md:text-xl">
            Designed to protect both you and your community
          </h2>
          <div className="mt-4 grid gap-3 text-base text-gray-700 sm:grid-cols-3">
            <p>No public comments</p>
            <p>No individual tracking</p>
            <p>No "performance" pressure</p>
          </div>
        </section>

        <section className="flex flex-col items-start gap-4 rounded-2xl border bg-white/80 p-6 shadow-sm md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">A gentle output</p>
          <p className="text-lg text-gray-800 md:text-xl">
            "This month, our community felt grounded 83% of the time."
          </p>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border bg-white/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 md:text-xl">Begin with a gentle pulse</h2>
            <p className="mt-2 text-sm text-gray-600">
              Create a healing space and invite your first reflection.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:text-gray-900"
              type="button"
            >
              Create a healing space
            </button>
            <button
              className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800"
              type="button"
            >
              Start a gentle pulse
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
