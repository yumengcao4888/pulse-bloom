import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";

export const dynamic = "force-dynamic"

export default async function HealerListPage() {
  const locale = await getLocale();
  const t = getTranslations(locale);
  const healers = await prisma.healer.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          reflections: true,
        },
      },
    },
  });

  return (
    <div className="z-10 p-8">
      <h1 className="text-2xl font-bold mb-4">{t("admin.healers.title")}</h1>

      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">{t("admin.table.id")}</th>
            <th className="border px-4 py-2">{t("admin.table.slug")}</th>
            <th className="border px-4 py-2">{t("admin.table.name")}</th>
            <th className="border px-4 py-2">{t("admin.table.pronouns")}</th>
            <th className="border px-4 py-2">{t("admin.table.modality")}</th>
            <th className="border px-4 py-2">{t("admin.table.focus")}</th>
            <th className="border px-4 py-2">{t("admin.table.city")}</th>
            <th className="border px-4 py-2">{t("admin.table.contact")}</th>
            <th className="border px-4 py-2">{t("admin.table.reflections")}</th>
            <th className="border px-4 py-2">{t("admin.table.bio")}</th>
            <th className="border px-4 py-2">{t("admin.table.createdAt")}</th>
            {/* <th className="border px-4 py-2">Updated At</th> */}
          </tr>
        </thead>

        <tbody>
          {healers.map((p) => (
            <tr key={p.id}>
              <td className="border px-4 py-2">{p.id}</td>
              <td className="border px-4 py-2">{p.slug}</td>
              <td className="border px-4 py-2">{p.name}</td>
              <td className="border px-4 py-2">{p.pronouns}</td>
              <td className="border px-4 py-2">{p.modality}</td>
              <td className="border px-4 py-2">{p.focus}</td>
              <td className="border px-4 py-2">{p.city}</td>
              <td className="border px-4 py-2">{p.contact}</td>
              <td className="border px-4 py-2 text-center">{p._count?.reflections ?? 0}</td>
              <td className="border px-4 py-2">{p.bio}</td>
              <td className="border px-4 py-2">
                {new Date(p.createdAt).toLocaleString(locale)}
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
