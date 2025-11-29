import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function PractitionerListPage() {
  const practitioners = await prisma.practitioner.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="z-10 p-8">
      <h1 className="text-2xl font-bold mb-4">All Practitioners</h1>

      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Pronouns</th>
            <th className="border px-4 py-2">Modality</th>
            <th className="border px-4 py-2">Focus</th>
            <th className="border px-4 py-2">City</th>
            <th className="border px-4 py-2">Contact</th>
            <th className="border px-4 py-2">Bio</th>
            <th className="border px-4 py-2">Created At</th>
            {/* <th className="border px-4 py-2">Updated At</th> */}
          </tr>
        </thead>

        <tbody>
          {practitioners.map((p) => (
            <tr key={p.id}>
              <td className="border px-4 py-2">{p.id}</td>
              <td className="border px-4 py-2">{p.name}</td>
              <td className="border px-4 py-2">{p.pronouns}</td>
              <td className="border px-4 py-2">{p.modality}</td>
              <td className="border px-4 py-2">{p.focus}</td>
              <td className="border px-4 py-2">{p.city}</td>
              <td className="border px-4 py-2">{p.contact}</td>
              <td className="border px-4 py-2">{p.bio}</td>
              <td className="border px-4 py-2">
                {new Date(p.createdAt).toLocaleString()}
              </td>
              {/* <td className="border px-4 py-2">
                {new Date(p.updatedAt).toLocaleString()}
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}