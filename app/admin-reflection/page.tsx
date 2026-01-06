import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";
import { LocalizedDateTime } from "@/components/shared/localized-date-time";

export const dynamic = "force-dynamic"

export default async function ReflectionListPage() {
  const locale = await getLocale();
  const t = getTranslations(locale);
  const reflections = await prisma.reflection.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="z-10 p-8">
      <h1 className="text-2xl font-bold mb-4">{t("admin.reflections.title")}</h1>

      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">{t("admin.table.id")}</th>
            <th className="border px-4 py-2">{t("admin.table.grounded")}</th>
            <th className="border px-4 py-2">{t("admin.table.supported")}</th>
            <th className="border px-4 py-2">{t("admin.table.connected")}</th>
            <th className="border px-4 py-2">{t("admin.table.feeling")}</th>
            <th className="border px-4 py-2">{t("admin.table.healerId")}</th>
            <th className="border px-4 py-2">{t("admin.table.createdAt")}</th>
          </tr>
        </thead>

        <tbody>
          {reflections.map((r) => (
            <tr key={r.id}>
              <td className="border px-4 py-2">{r.id}</td>
              <td className="border px-4 py-2">{r.grounded ? t("common.yes") : t("common.no")}</td>
              <td className="border px-4 py-2">{r.supported ? t("common.yes") : t("common.no")}</td>
              <td className="border px-4 py-2">{r.connected ? t("common.yes") : t("common.no")}</td>
              <td className="border px-4 py-2">{r.feeling}</td>
              <td className="border px-4 py-2">{r.healerId}</td>
              <td className="border px-4 py-2">
                <LocalizedDateTime value={r.createdAt} locale={locale} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
