type Props = {
  slug: string;
};

export default function ReflectionForm({ slug }: Props) {
  return (
    <form action="/api/reflection" method="POST" className="space-y-4">
      <input type="hidden" name="slug" value={slug} />

      <div className="space-y-2">
        <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer">
          <input
            type="checkbox"
            name="grounded"
            className="h-4 w-4"
          />
          <span>I feel grounded 🌱</span>
        </label>

        <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer">
          <input
            type="checkbox"
            name="supported"
            className="h-4 w-4"
          />
          <span>I feel supported 💛</span>
        </label>

        <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer">
          <input
            type="checkbox"
            name="connected"
            className="h-4 w-4"
          />
          <span>I feel connected 🤝</span>
        </label>
      </div>

      <label className="block">
        <span className="text-gray-700">A few words, if you&apos;d like (optional)</span>
        <textarea
          name="feeling"
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
  );
}