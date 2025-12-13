"use client";

import ReactWordcloud, {
  type CallbacksProp,
  type OptionsProp,
  type Word,
} from "react-wordcloud";

type WordcloudSize = [number, number];

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

const callbacks: CallbacksProp = {
  getWordColor: ({ value }) => pickColor(value),
  getWordTooltip: ({ text }) => text,
  onWordClick: word => console.log("Word clicked:", word),
  onWordMouseOver: word => console.log("Word hovered:", word),
};

const options: OptionsProp = {
  rotations: 2,
  rotationAngles: [0, 0],
  fontSizes: [20, 48],
};

const size: WordcloudSize = [400, 300];
const minSize: WordcloudSize = [200, 200];
const baseWords = [
  { text: "told", value: 65 },
  { text: "mistake", value: 11 },
  { text: "thought", value: 16 },
  { text: "bad", value: 17 },
] satisfies Word[];

const scaledWords: Word[] = baseWords.map(word => ({
  ...word,
  value: Math.sqrt(word.value),
}));

const wordcloudProps = {
  callbacks,
  minSize,
  options,
  size,
  words: scaledWords,
};

function MyWordcloud() {
  return <ReactWordcloud {...wordcloudProps} />;
}

export default MyWordcloud;
