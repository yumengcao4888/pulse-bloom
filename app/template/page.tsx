import Card from "@/components/home/card";
import { DEPLOY_URL } from "@/lib/constants";
import { Github, Twitter } from "@/components/shared/icons";
import WebVitals from "@/components/home/web-vitals";
import ComponentGrid from "@/components/home/component-grid";
import Image from "next/image";
import { nFormatter } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations, type MessageKey } from "@/lib/i18n";

export default async function Home() {
  const locale = await getLocale();
  const t = getTranslations(locale);
  const { stargazers_count: stars } = await fetch(
    "https://api.github.com/repos/steven-tey/precedent",
    {
      ...(process.env.GITHUB_OAUTH_TOKEN && {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_OAUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      }),
      // data will revalidate every 24 hours
      next: { revalidate: 86400 },
    },
  )
    .then((res) => res.json())
    .catch((e) => console.log(e));

  return (
    <>
      <div className="z-10 w-full max-w-xl px-5 xl:px-0">
        <a
          href="https://twitter.com/steventey/status/1613928948915920896"
          target="_blank"
          rel="noreferrer"
          className="mx-auto mb-5 flex max-w-fit animate-fade-up items-center justify-center space-x-2 overflow-hidden rounded-full bg-blue-100 px-7 py-2 transition-colors hover:bg-blue-200"
        >
          <Twitter className="h-5 w-5 text-[#1d9bf0]" />
          <p className="text-sm font-semibold text-[#1d9bf0]">
            {t("template.intro")}
          </p>
        </a>
        <h1
          className="animate-fade-up bg-gradient-to-br from-black to-stone-500 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent opacity-0 drop-shadow-sm [text-wrap:balance] md:text-7xl md:leading-[5rem]"
          style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
        >
          {t("template.title")}
        </h1>
        <p
          className="mt-6 animate-fade-up text-center text-gray-500 opacity-0 [text-wrap:balance] md:text-xl"
          style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}
        >
          {t("template.subtitle")}
        </p>
        <div
          className="mx-auto mt-6 flex animate-fade-up items-center justify-center space-x-5 opacity-0"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
        >
          <a
            className="group flex max-w-fit items-center justify-center space-x-2 rounded-full border border-black bg-black px-5 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black"
            href={DEPLOY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              className="h-4 w-4 group-hover:text-black"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L20 20H4L12 4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>{t("template.deploy")}</p>
          </a>
          <a
            className="flex max-w-fit items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-5 py-2 text-sm text-gray-600 shadow-md transition-colors hover:border-gray-800"
            href="https://github.com/steven-tey/precedent"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github />
            <p>
              <span className="hidden sm:inline-block">{t("template.starOn")}</span>{" "}
              GitHub{" "}
              <span className="font-semibold">{nFormatter(stars)}</span>
            </p>
          </a>
        </div>
      </div>
      <div className="my-10 grid w-full max-w-screen-xl animate-fade-up grid-cols-1 gap-5 px-5 md:grid-cols-3 xl:px-0">
        {getTemplateFeatures(t).map(({ title, description, demo, large }) => (
          <Card
            key={title}
            title={t(title as MessageKey)}
            description={t(description as MessageKey)}
            demo={
              title === "template.feature.components.title" ? (
                <ComponentGrid />
              ) : (
                demo
              )
            }
            large={large}
          />
        ))}
      </div>
    </>
  );
}

function getTemplateFeatures(t: (key: MessageKey) => string) {
  return [
    {
      title: "template.feature.components.title",
      description: "template.feature.components.desc",
      large: true,
    },
    {
      title: "template.feature.performance.title",
      description: "template.feature.performance.desc",
      demo: <WebVitals />,
    },
    {
      title: "template.feature.deploy.title",
      description: "template.feature.deploy.desc",
      demo: (
        <a href={DEPLOY_URL}>
          <Image
            src="https://vercel.com/button"
            alt={t("template.deployAlt")}
            width={120}
            height={30}
            unoptimized
          />
        </a>
      ),
    },
    {
      title: "template.feature.auth.title",
      description: "template.feature.auth.desc",
      demo: (
        <div className="flex items-center justify-center space-x-20">
          <Image alt="Clerk logo" src="/clerk.svg" width={50} height={50} />
        </div>
      ),
    },
    {
      title: "template.feature.hooks.title",
      description: "template.feature.hooks.desc",
      demo: (
        <div className="grid grid-flow-col grid-rows-3 gap-10 p-10">
          <span className="font-mono font-semibold">useIntersectionObserver</span>
          <span className="font-mono font-semibold">useLocalStorage</span>
          <span className="font-mono font-semibold">useScroll</span>
          <span className="font-mono font-semibold">nFormatter</span>
          <span className="font-mono font-semibold">capitalize</span>
          <span className="font-mono font-semibold">truncate</span>
        </div>
      ),
    },
  ];
}
