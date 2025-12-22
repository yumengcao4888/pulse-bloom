"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactWordcloud, {
  type CallbacksProp,
  type OptionsProp,
  type Word,
} from "react-wordcloud";

type WordcloudSize = [number, number];

const DEFAULT_SIZE: WordcloudSize = [400, 300];
const MIN_SIZE: WordcloudSize = [200, 200];

const COLOR_PALETTE = [
  "#94a3b8", // quiet
  "#818cf8", // gentle
  "#60a5fa", // open
  "#38bdf8", // clarity
  "#4ade80", // grounded
  "#a3e635", // alive
  "#facc15", // warm
  "#fb923c", // expressive
  "#f472b6", // care
  "#ec4899", // deep care
] as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const pickColor = (value: number) => {
  const index = clamp(Math.floor(value), 0, COLOR_PALETTE.length - 1);
  return COLOR_PALETTE[index];
};

const wordcloudCallbacks: CallbacksProp = {
  getWordColor: ({ value }) => pickColor(value),
  getWordTooltip: ({ text, value }) => `${text} (${value.toFixed(0)})`,
  onWordClick: word => console.log("Word clicked:", word),
  onWordMouseOver: word => console.log("Word hovered:", word),
};

const baseWordcloudOptions: OptionsProp = {
  rotations: 2,
  rotationAngles: [0, 0],
  fontSizes: [30, 48],
};

type CommunityWordcloudProps = {
  words: Word[];
};

function scaleWords(words: Word[]): Word[] {
  if (!words.length) return words;
  return words.map(word => ({
    ...word,
    value: Math.sqrt(word.value),
  }));
}

function CommunityWordcloud({ words }: CommunityWordcloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<WordcloudSize>(DEFAULT_SIZE);
  const scaledWords = useMemo(() => scaleWords(words), [words]);
  const options = useMemo<OptionsProp>(() => {
    const isSmall = size[0] < 360;
    return {
      ...baseWordcloudOptions,
      fontSizes: isSmall ? [16, 28] : [24, 40],
    };
  }, [size]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const width = container.clientWidth || DEFAULT_SIZE[0];
      const height = Math.max(MIN_SIZE[1], Math.round(width * 0.65));
      setSize([Math.max(MIN_SIZE[0], width), height]);
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize);
      observer.observe(container);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <ReactWordcloud
        callbacks={wordcloudCallbacks}
        minSize={MIN_SIZE}
        options={options}
        size={size}
        words={scaledWords}
      />
    </div>
  );
}

export default CommunityWordcloud;
