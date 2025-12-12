import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PractitionerPage(props: PageProps) {
  
  const { slug } = await props.params;

  const practitioner = await prisma.practitioner.findUnique({
    where: { slug },
    include: {
      reflections: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!practitioner) {
    return <div className="relative z-10 p-6 text-red-500">Practitioner not found.</div>;
  }

  const reflectionLink = `http://localhost:3000/reflection/${slug}`;
  const formatBool = (value: boolean | null | undefined) =>
    value == null ? "N/A" : value ? "Yes" : "No";
  const formatDate = (date: Date) => new Date(date).toLocaleString();

  return (
    <>
      <div className="relative z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="my-10 mx-auto max-w-xl">
          <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
            <div className="mb-3 flex justify-center">
              <QRCodeSVG value={reflectionLink} size={120} />
            </div>
            <h1 className="text-3xl font-semibold mb-5">{practitioner.name}</h1>
            <p className="text-gray-700">
              <b>Pronouns:</b> {practitioner.pronouns}
            </p>
            <p className="text-gray-700">
              <b>Modality:</b> {practitioner.modality}
            </p>
            <p className="text-gray-700">
              <b>Focus:</b> {practitioner.focus}
            </p>
            <p className="text-gray-700">
              <b>City:</b> {practitioner.city}
            </p>
            <p className="text-gray-700">
              <b>Contact:</b> {practitioner.contact}
            </p>
            <p className="text-gray-700">
              <b>Bio:</b> {practitioner.bio}
            </p>
            <p className="text-gray-700">
              <b>Reflection Link:</b> <Link href={reflectionLink} className="text-blue-600 underline">{reflectionLink}</Link>
            </p>
            <p className="text-gray-700">
              <b>Reflections Count:</b> {practitioner.reflections.length}
            </p>
          </div>
        </div>
      </div>
      <div className="relative z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Reflections</h2>
          {practitioner.reflections.length === 0 ? (
            <p className="text-gray-600">No reflections yet.</p>
          ) : (
            <div className="space-y-4">
              {practitioner.reflections.map((reflection) => (
                <div key={reflection.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-2 flex flex-wrap gap-4 text-sm text-gray-700">
                    <span>
                      <b>Grounded:</b> {formatBool(reflection.grounded)}
                    </span>
                    <span>
                      <b>Supported:</b> {formatBool(reflection.supported)}
                    </span>
                    <span>
                      <b>Connected:</b> {formatBool(reflection.connected)}
                    </span>
                  </div>
                  <p className="text-base text-gray-800 mb-2">
                    <b>Feeling:</b> {reflection.feeling ?? "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {formatDate(reflection.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
