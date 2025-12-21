import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: "pulse-bloom.vercel.app",
      lastModified: new Date(),
    }
  ];
}
