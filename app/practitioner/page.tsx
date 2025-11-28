import PractitionerForm from "@/components/practitioner/practitioner-form";
import { italianno } from '@/app/fonts';

export default async function Home() {
  return (
    <>
      <div className="relative z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="my-10 mx-auto max-w-xl">
          <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
            <h2 className={`${italianno.className} text-gray-800 text-3xl leading-snug md:text-5xl md:leading-normal`}>Every healing practice has a story.</h2>
            <p className="mb-4 text-sm text-gray-500">
              We&apos;d love to know yours, and who you hold space for.
            </p>
            <PractitionerForm />
          </div>
        </div>
      </div>
    </>
  );
}