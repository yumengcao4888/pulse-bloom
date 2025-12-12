const HF_URL =
  "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest";

export type SentimentPrediction = {
  label: string;
  score: number;
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
  if (Array.isArray(data)) {
    for (const entry of data) {
      const result = normalizePrediction(entry);
      if (result) return result;
    }
    return null;
  }

  if (data && typeof data === "object" && "label" in data) {
    const rawLabel = String((data as any).label).toLowerCase();
    return {
      label: friendlyLabel(rawLabel),
      score: Number((data as any).score ?? 0),
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
