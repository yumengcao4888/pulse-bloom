"use client";

import ReactWordcloud, {
  type CallbacksProp,
  type OptionsProp,
  type Word,
} from "react-wordcloud";

type WordcloudSize = [number, number];

const formatTooltip = ({ text, value }: Word) =>
  `${text} (${value}) [${value > 50 ? "good" : "bad"}]`;

const callbacks: CallbacksProp = {
  getWordColor: ({ value }) => (value > 50 ? "blue" : "red"),
  getWordTooltip: formatTooltip,
  onWordClick: word => console.log("Word clicked:", word),
  onWordMouseOver: word => console.log("Word hovered:", word),
};

const options: OptionsProp = {
  rotations: 2,
  rotationAngles: [0],
};

const size: WordcloudSize = [600, 400];
const minSize: WordcloudSize = [200, 200];
const words = [
  { text: "told", value: 64 },
  { text: "mistake", value: 11 },
  { text: "thought", value: 16 },
  { text: "bad", value: 17 },
] satisfies Word[];

function MyWordcloud() {
  return (
    <ReactWordcloud
      callbacks={callbacks}
      minSize={minSize}
      options={options}
      size={size}
      words={words}
    />
  );
}

export default MyWordcloud;
