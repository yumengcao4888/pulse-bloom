"use client";

import ReactWordcloud, {
  type CallbacksProp,
  type OptionsProp,
  type Word,
} from "react-wordcloud";

type WordcloudSize = [number, number];

const formatTooltip = ({ text, value }: Word) =>
  `${text} (${value}) [${value > 250 ? "good" : "bad"}]`;

const callbacks: CallbacksProp = {
  getWordColor: ({ value }) => (value > 7 ? "#2563eb" : "#64748b"),
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
