export default function PrivacyPage() {
  return (
    <div className="relative z-10 w-full max-w-2xl px-5 xl:px-0">
      <div className="mx-auto my-10 w-full">
        <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
          <div className="mt-6 overflow-hidden rounded-xl bg-white">
            <iframe
              title="Termly Privacy Policy"
              src="/privacy-termly.html"
              className="h-[75vh] min-h-[700px] w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
