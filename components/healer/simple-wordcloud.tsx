"use client";

import ReactWordcloud, {
  type CallbacksProp,
  type OptionsProp,
  type Word,
} from "react-wordcloud";

type WordcloudSize = [number, number];

const COLOR_PALETTE = [
  "#94a3b8", // 0–1  quiet        slate-400
  "#818cf8", // 1–2  gentle       indigo-400
  "#60a5fa", // 2–3  open         blue-400
  "#38bdf8", // 3–4  clarity      sky-400
  "#4ade80", // 4–5  grounded     green-400
  "#a3e635", // 5–6  alive        lime-400
  "#facc15", // 6–7  warm         yellow-400
  "#fb923c", // 7–8  expressive  orange-400
  "#f472b6", // 8–9  care         pink-400
  "#ec4899", // 9–10 deep care   pink-500
];

function getColor(value: number) {
  const index = Math.min(
    COLOR_PALETTE.length - 1,
    Math.max(0, Math.floor(value))
  );
  return COLOR_PALETTE[index];
}

const formatTooltip = ({ text, value }: Word) =>
  `${text} (${value}) [${value > 250 ? "good" : "bad"}]`;

const callbacks: CallbacksProp = {
  getWordColor: ({ value }) => (getColor(value)),
  getWordTooltip: formatTooltip,
  onWordClick: word => console.log("Word clicked:", word),
  onWordMouseOver: word => console.log("Word hovered:", word),
};

const options: OptionsProp = {
  rotations: 2,
  rotationAngles: [0, 0],
  fontSizes: [20, 48]
};

const size: WordcloudSize = [400, 300];
const minSize: WordcloudSize = [200, 200];
const words = [
  { text: "told", value: 65 },
  { text: "mistake", value: 11 },
  { text: "thought", value: 16 },
  { text: "bad", value: 17 },
] satisfies Word[];

const scaledWords = words.map(w => ({
  ...w,
  value: Math.sqrt(w.value),
}));

function MyWordcloud() {
  return (
    <ReactWordcloud
      callbacks={callbacks}
      minSize={minSize}
      options={options}
      size={size}
      words={scaledWords}
    />
  );
}

export default MyWordcloud;
