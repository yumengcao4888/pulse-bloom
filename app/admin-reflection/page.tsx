import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"

export default async function ReflectionListPage() {
  const reflections = await prisma.reflection.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="z-10 p-8">
      <h1 className="text-2xl font-bold mb-4">All Reflections</h1>

      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Grounded</th>
            <th className="border px-4 py-2">Supported</th>
            <th className="border px-4 py-2">Connected</th>
            <th className="border px-4 py-2">Feeling</th>
            <th className="border px-4 py-2">PractitionerId</th>
            <th className="border px-4 py-2">Created At</th>
          </tr>
        </thead>

        <tbody>
          {reflections.map((r) => (
            <tr key={r.id}>
              <td className="border px-4 py-2">{r.id}</td>
              <td className="border px-4 py-2">{r.grounded ? "true" : "false"}</td>
              <td className="border px-4 py-2">{r.supported ? "true" : "false"}</td>
              <td className="border px-4 py-2">{r.connected ? "true" : "false"}</td>
              <td className="border px-4 py-2">{r.feeling}</td>
              <td className="border px-4 py-2">{r.practitionerId}</td>
              <td className="border px-4 py-2">
                {new Date(r.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}