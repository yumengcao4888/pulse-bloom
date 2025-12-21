const HF_URL =
  "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest";

export type SentimentPrediction = {
  label: string;
  score: number;
  scores: SentimentScores;
};

export type SentimentScores = {
  negative: number;
  neutral: number;
  positive: number;
};

export async function classifyFeeling(
  feeling: string | null | undefined,
): Promise<SentimentPrediction | null> {
  if (!feeling || feeling.trim() === "") return null;
  if (!process.env.HF_TOKEN) {
    console.warn("Missing HF_TOKEN, skipping sentiment classification");
    return null;
  }

  try {
    const response = await fetch(HF_URL, {
      method: "POST",
      body: JSON.stringify({ inputs: feeling }),
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("HF sentiment request failed", await response.text());
      return null;
    }

    const data = await response.json();

    const prediction = normalizePrediction(data);

    return prediction;
  } catch (err) {
    console.error("Failed to classify feeling", err);
    return null;
  }
}

function normalizePrediction(data: unknown): SentimentPrediction | null {
  const scores = extractScores(data);
  if (scores) {
    const score = scores.positive * 1 + scores.neutral * 0.5 + scores.negative * 0;
    const dominant = getDominantLabel(scores);
    return {
      label: friendlyLabel(dominant),
      score,
      scores,
    };
  }

  if (data && typeof data === "object" && "error" in data) {
    console.error("HF classification error payload:", data);
  }

  return null;
}

function friendlyLabel(raw: string): string {
  if (raw.includes("negative") || raw.includes("label_0")) {
    return "Needs Support";
  }
  if (raw.includes("neutral") || raw.includes("label_1")) {
    return "Reflective";
  }
  if (raw.includes("positive") || raw.includes("label_2")) {
    return "Positive";
  }
  return "Unclassified";
}

function extractScores(data: unknown): SentimentScores | null {
  if (Array.isArray(data)) {
    const direct = scoresFromArray(data);
    if (direct) return direct;
    for (const entry of data) {
      const result = extractScores(entry);
      if (result) return result;
    }
    return null;
  }

  if (data && typeof data === "object" && "label" in data && "score" in data) {
    return scoresFromArray([data]);
  }

  if (data && typeof data === "object" && "error" in data) {
    console.error("HF classification error payload:", data);
  }

  return null;
}

function scoresFromArray(entries: unknown[]): SentimentScores | null {
  let negative: number | undefined;
  let neutral: number | undefined;
  let positive: number | undefined;

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    if (!("label" in entry) || !("score" in entry)) continue;
    const rawLabel = String((entry as any).label).toLowerCase();
    const score = Number((entry as any).score ?? 0);
    if (rawLabel.includes("negative") || rawLabel.includes("label_0")) {
      negative = score;
    } else if (rawLabel.includes("neutral") || rawLabel.includes("label_1")) {
      neutral = score;
    } else if (rawLabel.includes("positive") || rawLabel.includes("label_2")) {
      positive = score;
    }
  }

  if (negative == null && neutral == null && positive == null) return null;

  return {
    negative: negative ?? 0,
    neutral: neutral ?? 0,
    positive: positive ?? 0,
  };
}

function getDominantLabel(scores: SentimentScores): string {
  const entries: Array<[string, number]> = [
    ["negative", scores.negative],
    ["neutral", scores.neutral],
    ["positive", scores.positive],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "unclassified";
}
